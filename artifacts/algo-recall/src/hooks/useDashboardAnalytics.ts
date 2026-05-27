import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/auth";

export interface AnalyticsSummary {
  totalProblems: number;
  totalRevisions: number;
  dueToday: number;
  streak: number;
}

export interface TopicAnalytics {
  tag: string;
  averageConfidence: number;
  totalProblems: number;
}

export interface ActivityAnalytics {
  date: string;
  count: number;
}

export function useDashboardAnalytics() {
  const summaryQuery = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async (): Promise<AnalyticsSummary> => {
      const res = await apiFetch("/api/analytics/summary");
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const topicsQuery = useQuery({
    queryKey: ["analytics", "topics"],
    queryFn: async (): Promise<TopicAnalytics[]> => {
      const res = await apiFetch("/api/analytics/topics");
      if (!res.ok) throw new Error("Failed to fetch topics");
      return res.json();
    },
  });

  const activityQuery = useQuery({
    queryKey: ["analytics", "activity"],
    queryFn: async (): Promise<ActivityAnalytics[]> => {
      const res = await apiFetch("/api/analytics/activity");
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
  });

  const isLoading = summaryQuery.isLoading || topicsQuery.isLoading || activityQuery.isLoading;
  const isError = summaryQuery.isError || topicsQuery.isError || activityQuery.isError;

  return {
    summary: summaryQuery.data,
    topics: topicsQuery.data,
    activity: activityQuery.data,
    isLoading,
    isError,
  };
}
