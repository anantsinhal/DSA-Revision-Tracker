import { AppState, Problem } from "./storage";

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  totalRequired: number;
}

export function checkAchievements(state: AppState): Achievement[] {
  const { problems, streakData, activity } = state;
  const totalSolved = problems.length;
  
  const graphCount = problems.filter(p => p.tags.some(t => t.toLowerCase().includes('graph'))).length;
  const dpCount = problems.filter(p => p.tags.some(t => t.toLowerCase().includes('dp') || t.toLowerCase().includes('dynamic programming'))).length;
  
  // Check perfect week (7 consecutive days of activity ending today or yesterday)
  // Simplified approximation: if current streak is >= 7, perfect week is unlocked
  const hasPerfectWeek = streakData.currentStreak >= 7;

  // We could store actual unlock dates in state, but computing dynamically for this prototype
  
  return [
    {
      id: "first_step",
      icon: "💎",
      name: "First Step",
      description: "Added your first problem",
      isUnlocked: totalSolved >= 1,
      progress: Math.min(totalSolved, 1),
      totalRequired: 1,
    },
    {
      id: "streak_7",
      icon: "🔥",
      name: "7 Day Streak",
      description: "Maintained a 7-day revision streak",
      isUnlocked: streakData.longestStreak >= 7,
      progress: Math.min(streakData.longestStreak, 7),
      totalRequired: 7,
    },
    {
      id: "problems_50",
      icon: "🏆",
      name: "50 Problems Solved",
      description: "Added 50 problems to your tracker",
      isUnlocked: totalSolved >= 50,
      progress: Math.min(totalSolved, 50),
      totalRequired: 50,
    },
    {
      id: "graph_master",
      icon: "🕸️",
      name: "Graph Master",
      description: "Solved 10 Graph problems",
      isUnlocked: graphCount >= 10,
      progress: Math.min(graphCount, 10),
      totalRequired: 10,
    },
    {
      id: "dp_warrior",
      icon: "⚡",
      name: "DP Warrior",
      description: "Solved 10 DP problems",
      isUnlocked: dpCount >= 10,
      progress: Math.min(dpCount, 10),
      totalRequired: 10,
    },
    {
      id: "consistency_king",
      icon: "👑",
      name: "Consistency King",
      description: "Achieved a 30-day streak",
      isUnlocked: streakData.longestStreak >= 30,
      progress: Math.min(streakData.longestStreak, 30),
      totalRequired: 30,
    },
    {
      id: "perfect_week",
      icon: "🌟",
      name: "Perfect Week",
      description: "Revised something every day for 7 days",
      isUnlocked: hasPerfectWeek,
      progress: Math.min(streakData.currentStreak, 7),
      totalRequired: 7,
    }
  ];
}
