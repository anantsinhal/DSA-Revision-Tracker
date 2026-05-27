import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AppState,
  LocalState,
  Problem,
  loadLocalState,
  saveLocalState,
  isFirstLoad,
  markAsSeeded,
} from "@/lib/storage";
import { calculateNextRevisionDate } from "@/lib/spaced-repetition";
import { updateStreak, updateActivity } from "@/lib/streak";
import * as api from "@/lib/api";

export function useProblems() {
  // Problems come from MongoDB via the REST API
  const [problems, setProblems] = useState<Problem[]>([]);
  // Local state (streak, activity, theme, pomodoro) stays in localStorage
  const [localState, setLocalState] = useState<LocalState>(loadLocalState());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reconstruct a full AppState object for backward compatibility with
   * analytics, achievements, and streak utilities that expect AppState.
   */
  const state = useMemo<AppState>(
    () => ({ problems, ...localState }),
    [problems, localState]
  );

  const saveLocal = useCallback((next: LocalState) => {
    saveLocalState(next);
    setLocalState(next);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadProblems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetched = await api.fetchProblems();

      if (fetched.length === 0 && isFirstLoad()) {
        // First time ever — seed demo data into the backend
        await api.seedProblems();
        markAsSeeded();
        const seeded = await api.fetchProblems();
        setProblems(seeded);
      } else {
        setProblems(fetched);
      }
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  /** Add a new problem to MongoDB and update local state */
  const addProblem = useCallback(
    async (
      problem: Omit<Problem, "id" | "createdAt" | "revisionCount" | "nextRevisionDate">
    ) => {
      const today = new Date().toISOString().split("T")[0];
      const created = await api.createProblem({
        ...problem,
        createdAt: today,
        revisionCount: 0,
        nextRevisionDate: calculateNextRevisionDate(
          problem.lastRevisedDate,
          problem.confidenceLevel,
          problem.revisionFrequency
        ),
      });
      setProblems((prev) => [created, ...prev]);
    },
    []
  );

  /** Update an existing problem; recalculates nextRevisionDate if scheduling fields changed */
  const updateProblem = useCallback(
    async (id: string, updates: Partial<Problem>) => {
      const existing = problems.find((p) => p.id === id);

      // Recalculate next revision date if confidence, lastRevised, or frequency changed
      if (
        existing &&
        (updates.confidenceLevel !== undefined ||
          updates.lastRevisedDate !== undefined ||
          updates.revisionFrequency !== undefined)
      ) {
        const merged = { ...existing, ...updates };
        updates = {
          ...updates,
          nextRevisionDate: calculateNextRevisionDate(
            merged.lastRevisedDate,
            merged.confidenceLevel,
            merged.revisionFrequency
          ),
        };
      }

      const updated = await api.updateProblem(id, updates);
      setProblems((prev) => prev.map((p) => (p.id === id ? updated : p)));
    },
    [problems]
  );

  /** Delete a problem from MongoDB and remove it from local state */
  const deleteProblem = useCallback(async (id: string) => {
    await api.deleteProblem(id);
    setProblems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /**
   * Mark a problem as revised today.
   * - Saves updated revision metadata to MongoDB
   * - Updates streak and activity in localStorage
   */
  const markRevised = useCallback(
    async (id: string, newConfidence?: 1 | 2 | 3 | 4 | 5) => {
      const today = new Date().toISOString().split("T")[0];
      const existing = problems.find((p) => p.id === id);
      if (!existing) return;

      const updated = await api.reviseProblem(id, newConfidence);
      setProblems((prev) => prev.map((p) => (p.id === id ? updated : p)));

      // Update streak and daily activity in localStorage
      const fullState = { problems, ...localState };
      const newStreakData = updateStreak(fullState, today);
      const newActivity = updateActivity(localState.activity, today);
      saveLocal({ ...localState, streakData: newStreakData, activity: newActivity });
    },
    [problems, localState, saveLocal]
  );

  return {
    state,
    problems,
    isLoading,
    error,
    addProblem,
    updateProblem,
    deleteProblem,
    markRevised,
  };
}
