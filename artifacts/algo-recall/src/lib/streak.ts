import { AppState } from "./storage";

export function updateStreak(state: AppState, todayStr: string): AppState['streakData'] {
  const streak = { ...state.streakData };
  const lastRev = streak.lastRevisionDate;
  
  if (lastRev === todayStr) {
    // Already revised today, do nothing to streak length
    return streak;
  }

  if (!lastRev) {
    // First revision
    streak.currentStreak = 1;
    streak.longestStreak = Math.max(streak.longestStreak, 1);
    streak.lastRevisionDate = todayStr;
    return streak;
  }

  const lastDate = new Date(lastRev);
  const today = new Date(todayStr);
  
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    streak.currentStreak += 1;
  } else if (diffDays > 1) {
    // Streak broken
    streak.currentStreak = 1;
  }
  
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastRevisionDate = todayStr;

  return streak;
}

export function updateActivity(activity: AppState['activity'], todayStr: string): AppState['activity'] {
  const newActivity = [...activity];
  const existing = newActivity.find(a => a.date === todayStr);
  if (existing) {
    existing.count += 1;
  } else {
    newActivity.push({ date: todayStr, count: 1 });
  }
  return newActivity;
}
