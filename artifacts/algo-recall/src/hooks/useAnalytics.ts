import { useMemo } from "react";
import { useProblems } from "./useProblems";
import { computeAnalytics } from "@/lib/analytics";
import { checkAchievements } from "@/lib/achievements";

export function useAnalytics() {
  const { state, problems, isLoading } = useProblems();

  // Return null while loading so Dashboard shows its loading spinner
  const analytics = useMemo(() => {
    if (isLoading) return null;
    return computeAnalytics(problems);
  }, [problems, isLoading]);

  const achievements = useMemo(() => {
    if (!state) return [];
    return checkAchievements(state);
  }, [state]);

  const streakData = state?.streakData ?? {
    currentStreak: 0,
    longestStreak: 0,
    lastRevisionDate: "",
  };

  return {
    analytics,
    achievements,
    streakData,
    activity: state?.activity ?? [],
    // Expose full AppState so Dashboard can pass problems to MiniRevisionQueue
    state,
    isLoading,
  };
}
