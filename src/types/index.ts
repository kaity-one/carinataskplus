export type GoalCategory = 'Study' | 'Work' | 'Health/Fitness' | 'Personal';

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  category: GoalCategory;
  priority: PriorityLevel;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string | null;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  subtasks?: Subtask[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  frequency: 'daily' | 'weekdays' | 'weekends';
  currentStreak: number;
  bestStreak: number;
  completedDates: string[]; // List of YYYY-MM-DD strings
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  taskTitle?: string;
  category?: string;
  durationMinutes: number;
  sessionType: 'focus' | 'shortBreak' | 'longBreak';
  date: string; // YYYY-MM-DD
  completedAt: string;
}

export interface DailyReflection {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  rating: number; // 1 - 5
  wins: string;
  challenges: string;
  tomorrowFocus: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  role?: string; // Student, Developer, Professional, etc.
  bio?: string;
  dailyFocusTargetMinutes?: number; // e.g. 120 minutes (4 pomodoros)
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ViewTab = 'dashboard' | 'goals' | 'habits' | 'focus' | 'reflection' | 'schedule' | 'profile';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // e.g. "07:30"
  endTime: string;   // e.g. "09:15"
  date: string;      // YYYY-MM-DD
  dayOfWeek?: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  rawStart?: string;
  rawEnd?: string;
  isAllDay?: boolean;
  recurrence?: string;
}

export interface ProposedTask {
  id: string;
  title: string;
  category: GoalCategory;
  priority: PriorityLevel;
  notes?: string;
  estimatedPomodoros: number;
  subtasks?: string[];
  track: 'Developer' | 'Student' | 'Health/Fitness' | 'Productivity' | 'General';
  canBeHabit?: boolean;
  habitFrequency?: 'daily' | 'weekdays' | 'weekends';
}
