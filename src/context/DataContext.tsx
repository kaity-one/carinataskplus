import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth,
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  handleFirestoreError, 
  OperationType 
} from '../firebase/config';
import { useAuth } from './AuthContext';
import type { Task, Habit, FocusSession, DailyReflection, GoalCategory, PriorityLevel } from '../types';
import { getTodayString, calculateStreakStats } from '../utils/date';
import { playTaskDoneSound, playStreakSound } from '../utils/audio';
import { fireConfetti, fireSuperConfetti } from '../utils/confetti';

interface DataContextType {
  tasks: Task[];
  habits: Habit[];
  focusSessions: FocusSession[];
  reflections: DailyReflection[];
  loadingData: boolean;
  // Task operations
  createTask: (data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  // Habit operations
  createHabit: (data: Omit<Habit, 'id' | 'userId' | 'currentStreak' | 'bestStreak' | 'completedDates' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  toggleHabitToday: (id: string, customDate?: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  // Focus sessions
  logFocusSession: (durationMinutes: number, sessionType: 'focus' | 'shortBreak' | 'longBreak', taskId?: string, taskTitle?: string, category?: string) => Promise<void>;
  // Reflections
  saveReflection: (rating: number, wins: string, challenges: string, tomorrowFocus: string, date?: string) => Promise<void>;
  // Helpers
  seedInitialDataIfEmpty: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_TASKS_KEY = 'carinataskplus_local_tasks';
const LOCAL_HABITS_KEY = 'carinataskplus_local_habits';
const LOCAL_SESSIONS_KEY = 'carinataskplus_local_sessions';
const LOCAL_REFLECTIONS_KEY = 'carinataskplus_local_reflections';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const currentUserId = user?.uid || (isGuest ? 'guest' : null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Sync data whenever currentUserId changes
  useEffect(() => {
    if (!currentUserId) {
      setTasks([]);
      setHabits([]);
      setFocusSessions([]);
      setReflections([]);
      setLoadingData(false);
      return;
    }

    if (isGuest) {
      // Local storage fallback for guest mode
      try {
        const localTasks = localStorage.getItem(LOCAL_TASKS_KEY);
        const localHabits = localStorage.getItem(LOCAL_HABITS_KEY);
        const localSessions = localStorage.getItem(LOCAL_SESSIONS_KEY);
        const localReflections = localStorage.getItem(LOCAL_REFLECTIONS_KEY);

        if (localTasks) setTasks(JSON.parse(localTasks));
        if (localHabits) setHabits(JSON.parse(localHabits));
        if (localSessions) setFocusSessions(JSON.parse(localSessions));
        if (localReflections) setReflections(JSON.parse(localReflections));
      } catch (e) {
        console.error("Local storage parse error:", e);
      }
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    // 1. Subscribe to tasks
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', currentUserId));
    const unsubTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const items: Task[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Task, 'id'>) });
        });
        setTasks(items);
        setLoadingData(false);
      },
      (error) => {
        if (!auth.currentUser || auth.currentUser.uid !== currentUserId) return;
        handleFirestoreError(error, OperationType.LIST, 'tasks');
        setLoadingData(false);
      }
    );

    // 2. Subscribe to habits
    const habitsQuery = query(collection(db, 'habits'), where('userId', '==', currentUserId));
    const unsubHabits = onSnapshot(
      habitsQuery,
      (snapshot) => {
        const items: Habit[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Habit, 'id'>) });
        });
        setHabits(items);
      },
      (error) => {
        if (!auth.currentUser || auth.currentUser.uid !== currentUserId) return;
        handleFirestoreError(error, OperationType.LIST, 'habits');
      }
    );

    // 3. Subscribe to focus sessions
    const sessionsQuery = query(collection(db, 'focusSessions'), where('userId', '==', currentUserId));
    const unsubSessions = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const items: FocusSession[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<FocusSession, 'id'>) });
        });
        setFocusSessions(items);
      },
      (error) => {
        if (!auth.currentUser || auth.currentUser.uid !== currentUserId) return;
        handleFirestoreError(error, OperationType.LIST, 'focusSessions');
      }
    );

    // 4. Subscribe to reflections
    const reflectionsQuery = query(collection(db, 'reflections'), where('userId', '==', currentUserId));
    const unsubReflections = onSnapshot(
      reflectionsQuery,
      (snapshot) => {
        const items: DailyReflection[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<DailyReflection, 'id'>) });
        });
        setReflections(items);
      },
      (error) => {
        if (!auth.currentUser || auth.currentUser.uid !== currentUserId) return;
        handleFirestoreError(error, OperationType.LIST, 'reflections');
      }
    );

    return () => {
      unsubTasks();
      unsubHabits();
      unsubSessions();
      unsubReflections();
    };
  }, [currentUserId, isGuest]);

  // Seed sample starter data if user has no tasks and no habits
  const seedInitialDataIfEmpty = async () => {
    if (!currentUserId) return;
    const today = getTodayString();

    const sampleTasks: Omit<Task, 'id' | 'userId'>[] = [
      {
        title: "Solve 2 LeetCode / Data Structures problems",
        category: "Study",
        priority: "high",
        date: today,
        completed: false,
        estimatedPomodoros: 2,
        completedPomodoros: 0,
        notes: "Focus on Trees & Dynamic Programming. Take notes on edge cases.",
        subtasks: [
          { id: "sub-1", title: "Problem 1: Invert Binary Tree", completed: false },
          { id: "sub-2", title: "Problem 2: House Robber", completed: false },
        ]
      },
      {
        title: "Review Pull Requests and finish unit tests",
        category: "Work",
        priority: "high",
        date: today,
        completed: true,
        completedAt: new Date().toISOString(),
        estimatedPomodoros: 3,
        completedPomodoros: 3,
        notes: "Ensure test coverage remains > 90% for authentication module.",
        subtasks: [
          { id: "sub-3", title: "PR #142 code review", completed: true },
          { id: "sub-4", title: "Write mocking tests for token refresh", completed: true },
        ]
      },
      {
        title: "45-minute gym session / cardio run",
        category: "Health/Fitness",
        priority: "medium",
        date: today,
        completed: false,
        estimatedPomodoros: 2,
        completedPomodoros: 0,
        notes: "Full body workout + 15 min mobility stretches.",
      },
      {
        title: "Read 15 pages of 'Designing Data-Intensive Applications'",
        category: "Personal",
        priority: "low",
        date: today,
        completed: false,
        estimatedPomodoros: 1,
        completedPomodoros: 0,
        notes: "Chapter 3: Storage and Retrieval engines.",
      }
    ];

    const sampleHabits: Omit<Habit, 'id' | 'userId' | 'currentStreak' | 'bestStreak' | 'completedDates'>[] = [
      {
        title: "Code for at least 1 hour",
        description: "Hands-on coding, building projects, or solving challenges.",
        category: "Work",
        frequency: "daily",
        color: "#6366f1"
      },
      {
        title: "Morning deep focus session (no social media)",
        description: "Zero phone checking before 10 AM.",
        category: "Study",
        frequency: "weekdays",
        color: "#10b981"
      },
      {
        title: "Hydration: Drink 2.5 Liters of water",
        description: "Keep water bottle filled at desk all day.",
        category: "Health/Fitness",
        frequency: "daily",
        color: "#06b6d4"
      },
      {
        title: "Evening reflection and plan tomorrow",
        description: "Wrap up the day with 5 minutes of mindful journaling.",
        category: "Personal",
        frequency: "daily",
        color: "#f59e0b"
      }
    ];

    // Seed tasks
    for (const t of sampleTasks) {
      await createTask(t);
    }
    // Seed habits
    for (const h of sampleHabits) {
      await createHabit(h);
    }
  };

  // Task Operations
  const createTask = async (data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUserId) return;
    const nowIso = new Date().toISOString();
    const taskId = 'task_' + Math.random().toString(36).substring(2, 10);
    const newTask: Task = {
      ...data,
      id: taskId,
      userId: currentUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (isGuest) {
      const updated = [newTask, ...tasks];
      setTasks(updated);
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(updated));
      return;
    }

    try {
      await setDoc(doc(db, 'tasks', taskId), newTask);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `tasks/${taskId}`);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!currentUserId) return;
    const nowIso = new Date().toISOString();

    if (isGuest) {
      const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: nowIso } : t));
      setTasks(updated);
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(updated));
      return;
    }

    try {
      await updateDoc(doc(db, 'tasks', id), {
        ...updates,
        updatedAt: nowIso,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const toggleTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextCompleted = !target.completed;

    if (nextCompleted) {
      playTaskDoneSound();
      fireConfetti();
    }

    await updateTask(id, {
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
    });
  };

  const deleteTask = async (id: string) => {
    if (!currentUserId) return;

    if (isGuest) {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(updated));
      return;
    }

    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
    }
  };

  // Habit Operations
  const createHabit = async (data: Omit<Habit, 'id' | 'userId' | 'currentStreak' | 'bestStreak' | 'completedDates' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUserId) return;
    const habitId = 'habit_' + Math.random().toString(36).substring(2, 10);
    const nowIso = new Date().toISOString();
    const newHabit: Habit = {
      ...data,
      id: habitId,
      userId: currentUserId,
      currentStreak: 0,
      bestStreak: 0,
      completedDates: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (isGuest) {
      const updated = [...habits, newHabit];
      setHabits(updated);
      localStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(updated));
      return;
    }

    try {
      await setDoc(doc(db, 'habits', habitId), newHabit);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `habits/${habitId}`);
    }
  };

  const toggleHabitToday = async (id: string, customDate?: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit || !currentUserId) return;

    const dateToToggle = customDate || getTodayString();
    const dates = new Set(habit.completedDates || []);
    let willComplete = false;

    if (dates.has(dateToToggle)) {
      dates.delete(dateToToggle);
    } else {
      dates.add(dateToToggle);
      willComplete = true;
    }

    const newCompletedDates = Array.from(dates);
    const stats = calculateStreakStats(newCompletedDates);

    if (willComplete) {
      playStreakSound();
      if (stats.currentStreak >= 3) {
        fireSuperConfetti();
      } else {
        fireConfetti();
      }
    }

    const updates = {
      completedDates: newCompletedDates,
      currentStreak: stats.currentStreak,
      bestStreak: Math.max(habit.bestStreak || 0, stats.bestStreak),
      updatedAt: new Date().toISOString(),
    };

    if (isGuest) {
      const updatedList = habits.map((h) => (h.id === id ? { ...h, ...updates } : h));
      setHabits(updatedList);
      localStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(updatedList));
      return;
    }

    try {
      await updateDoc(doc(db, 'habits', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `habits/${id}`);
    }
  };

  const deleteHabit = async (id: string) => {
    if (!currentUserId) return;

    if (isGuest) {
      const updated = habits.filter((h) => h.id !== id);
      setHabits(updated);
      localStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(updated));
      return;
    }

    try {
      await deleteDoc(doc(db, 'habits', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `habits/${id}`);
    }
  };

  // Focus Session Operations
  const logFocusSession = async (
    durationMinutes: number, 
    sessionType: 'focus' | 'shortBreak' | 'longBreak', 
    taskId?: string, 
    taskTitle?: string, 
    category?: string
  ) => {
    if (!currentUserId) return;
    const sessionId = 'session_' + Math.random().toString(36).substring(2, 10);
    const today = getTodayString();
    const nowIso = new Date().toISOString();

    const newSession: FocusSession = {
      id: sessionId,
      userId: currentUserId,
      durationMinutes,
      sessionType,
      date: today,
      completedAt: nowIso,
      taskId: taskId || undefined,
      taskTitle: taskTitle || undefined,
      category: category || 'Work',
    };

    // If attached to a task, increment its completed pomodoros
    if (taskId && sessionType === 'focus') {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const nextCompletedPoms = (task.completedPomodoros || 0) + 1;
        updateTask(taskId, { completedPomodoros: nextCompletedPoms });
      }
    }

    if (isGuest) {
      const updated = [newSession, ...focusSessions];
      setFocusSessions(updated);
      localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(updated));
      return;
    }

    try {
      await setDoc(doc(db, 'focusSessions', sessionId), newSession);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `focusSessions/${sessionId}`);
    }
  };

  // Daily Reflection Operations
  const saveReflection = async (rating: number, wins: string, challenges: string, tomorrowFocus: string, date?: string) => {
    if (!currentUserId) return;
    const targetDate = date || getTodayString();
    const reflectionId = 'ref_' + targetDate.replace(/-/g, '_') + '_' + currentUserId.substring(0, 8);
    const nowIso = new Date().toISOString();

    const entry: DailyReflection = {
      id: reflectionId,
      userId: currentUserId,
      date: targetDate,
      rating,
      wins,
      challenges,
      tomorrowFocus,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    fireConfetti();

    if (isGuest) {
      const existingIdx = reflections.findIndex(r => r.date === targetDate);
      let updated: DailyReflection[];
      if (existingIdx >= 0) {
        updated = [...reflections];
        updated[existingIdx] = entry;
      } else {
        updated = [entry, ...reflections];
      }
      setReflections(updated);
      localStorage.setItem(LOCAL_REFLECTIONS_KEY, JSON.stringify(updated));
      return;
    }

    try {
      await setDoc(doc(db, 'reflections', reflectionId), entry);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reflections/${reflectionId}`);
    }
  };

  return (
    <DataContext.Provider
      value={{
        tasks,
        habits,
        focusSessions,
        reflections,
        loadingData,
        createTask,
        updateTask,
        toggleTask,
        deleteTask,
        createHabit,
        toggleHabitToday,
        deleteHabit,
        logFocusSession,
        saveReflection,
        seedInitialDataIfEmpty,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
