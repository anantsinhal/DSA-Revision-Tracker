export type Difficulty = "Easy" | "Medium" | "Hard";
export type Platform = "LeetCode" | "GeeksForGeeks" | "Codeforces" | "Other";

export interface Problem {
  id: string;
  name: string;
  platform: Platform;
  difficulty: Difficulty;
  tags: string[];

  source?: "manual" | "leetcode";
  sourceMeta?: {
    externalId?: string;
    url?: string;
    importedAt?: string;
  };

  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  confidenceLevel: 1 | 2 | 3 | 4 | 5;
  lastRevisedDate: string;
  nextRevisionDate: string;
  mistakeNotes: string;
  revisionFrequency?: number;
  revisionCount: number;
  createdAt: string;
}

export interface RevisionActivity {
  date: string;
  count: number;
}

/**
 * LocalState: user-specific data that lives in localStorage.
 * Problems are now stored in MongoDB via the REST API instead.
 */
export interface LocalState {
  activity: RevisionActivity[];
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastRevisionDate: string;
  };
  theme: "light" | "dark";
  pomodoroSettings: {
    focusMinutes: number;
    breakMinutes: number;
  };
}

/**
 * AppState: full application state that combines API-fetched problems with
 * localStorage data. Maintained for backward compatibility with analytics,
 * achievements, and streak logic throughout the app.
 */
export interface AppState extends LocalState {
  problems: Problem[];
}

// localStorage key for local (non-problem) state
const LOCAL_STATE_KEY = "algo-recall-local";

// localStorage key used to track whether seed data has been pushed to the API
const SEEDED_KEY = "algo-recall-seeded";

const DEFAULT_LOCAL_STATE: LocalState = {
  activity: [],
  streakData: {
    currentStreak: 0,
    longestStreak: 0,
    lastRevisionDate: "",
  },
  theme: "light",
  pomodoroSettings: {
    focusMinutes: 25,
    breakMinutes: 5,
  },
};

/**
 * Load local (non-problem) state from localStorage.
 * If the new key doesn't exist yet, attempts to migrate theme/streak/activity
 * from the old "algo-recall-state" key used before the MongoDB upgrade.
 */
export function loadLocalState(): LocalState {
  try {
    const stored = localStorage.getItem(LOCAL_STATE_KEY);
    if (stored) {
      return { ...DEFAULT_LOCAL_STATE, ...JSON.parse(stored) };
    }

    // Migration path: extract local fields from the old unified state key
    const oldStored = localStorage.getItem("algo-recall-state");
    if (oldStored) {
      const old = JSON.parse(oldStored);
      const migrated: LocalState = {
        activity: old.activity || [],
        streakData: old.streakData || DEFAULT_LOCAL_STATE.streakData,
        theme: old.theme || "light",
        pomodoroSettings:
          old.pomodoroSettings || DEFAULT_LOCAL_STATE.pomodoroSettings,
      };
      saveLocalState(migrated);
      return migrated;
    }
  } catch {
    // Return defaults if anything goes wrong
  }
  return { ...DEFAULT_LOCAL_STATE };
}

/** Persist local (non-problem) state to localStorage. */
export function saveLocalState(state: LocalState): void {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
}

/** Returns true if the backend has never been seeded for this browser. */
export function isFirstLoad(): boolean {
  return !localStorage.getItem(SEEDED_KEY);
}

/** Mark that seed data has been pushed so we don't re-seed on next visit. */
export function markAsSeeded(): void {
  localStorage.setItem(SEEDED_KEY, "true");
}
