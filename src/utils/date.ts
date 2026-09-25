// Date formatting and streak calculation utilities

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getOffsetDateString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const today = getTodayString();
  const tomorrow = getOffsetDateString(1);
  const yesterday = getOffsetDateString(-1);

  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';

  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function formatFullDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Calculates current streak and best streak from an array of completed YYYY-MM-DD dates
 */
export function calculateStreakStats(completedDates: string[]): { currentStreak: number; bestStreak: number; completedToday: boolean } {
  if (!completedDates || completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, completedToday: false };
  }

  const uniqueSortedDates = Array.from(new Set(completedDates)).sort();
  const dateSet = new Set(uniqueSortedDates);
  const today = getTodayString();
  const yesterday = getOffsetDateString(-1);
  const completedToday = dateSet.has(today);

  // Determine starting point for current streak:
  // If completed today, start counting back from today.
  // If completed yesterday, start counting back from yesterday.
  // Otherwise, current streak is 0.
  let currentStreak = 0;
  let checkDate = completedToday ? today : (dateSet.has(yesterday) ? yesterday : null);

  if (checkDate) {
    let curr = new Date(checkDate);
    while (true) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;
      
      if (dateSet.has(dStr)) {
        currentStreak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate best streak historically
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of uniqueSortedDates) {
    const parts = dateStr.split('-');
    const currDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays === 0) {
        // duplicate day, ignore
      } else {
        tempStreak = 1;
      }
    }
    prevDate = currDate;
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  }

  bestStreak = Math.max(bestStreak, currentStreak);

  return { currentStreak, bestStreak, completedToday };
}

export interface DayGridItem {
  date: string;
  dayOfMonth: number;
  dayOfWeek: number; // 0=Sun, 6=Sat
  isCompleted: boolean;
  isToday: boolean;
  formatted: string;
}

export function generateHabitHeatmap(completedDates: string[], daysCount = 35): DayGridItem[] {
  const dateSet = new Set(completedDates || []);
  const today = getTodayString();
  const items: DayGridItem[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${d}`;

    items.push({
      date: dStr,
      dayOfMonth: d.getDate(),
      dayOfWeek: d.getDay(),
      isCompleted: dateSet.has(dStr),
      isToday: dStr === today,
      formatted: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    });
  }

  return items;
}

export const MOTIVATIONAL_QUOTES = [
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { text: "Focus is a muscle. The more you protect your attention, the stronger it gets.", author: "Cal Newport" },
  { text: "Consistency isn't about perfection; it's about refusing to give up.", author: "James Clear" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Deep work is the superpower of the 21st century.", author: "Carl Newport" }
];
