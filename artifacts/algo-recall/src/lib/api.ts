import { Problem } from "./storage";
import { calculateNextRevisionDate } from "./spaced-repetition";
import { apiFetch } from "./auth";

/** Base path for the questions REST API (proxied through Replit's shared proxy) */
const API_BASE = "/api/questions";
const REVISE_BASE = "/api/problems";
const AUTH_BASE = "/api/auth";
const INTEGRATIONS_BASE = "/api/integrations";

// ─── API functions ────────────────────────────────────────────────────────────

/** Fetch all DSA problems from MongoDB via the Express backend */
export async function fetchProblems(): Promise<Problem[]> {
  const res = await apiFetch(API_BASE);
  if (!res.ok) throw new Error(`Failed to fetch problems: ${res.status}`);
  return res.json();
}

/**
 * Create a new problem in MongoDB.
 * Returns the saved document including its MongoDB-generated id.
 */
export async function createProblem(data: Omit<Problem, "id">): Promise<Problem> {
  const res = await apiFetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create problem: ${res.status}`);
  return res.json();
}

/**
 * Update an existing problem by its MongoDB id.
 * Returns the updated document.
 */
export async function updateProblem(
  id: string,
  data: Partial<Problem>
): Promise<Problem> {
  const res = await apiFetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update problem: ${res.status}`);
  return res.json();
}

/** Permanently delete a problem by its MongoDB id */
export async function deleteProblem(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete problem: ${res.status}`);
}

/**
 * Mark a problem as revised.
 * Backend increments revisionCount and computes nextRevisionDate.
 */
export async function reviseProblem(
  id: string,
  confidenceLevel?: 1 | 2 | 3 | 4 | 5
): Promise<Problem> {
  const res = await apiFetch(`${REVISE_BASE}/${id}/revise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      confidenceLevel === undefined ? {} : { confidenceLevel }
    ),
  });
  if (!res.ok) throw new Error(`Failed to revise problem: ${res.status}`);
  return res.json();
}

// ─── Integrations ───────────────────────────────────────────────────────────

export async function updateLeetCodeUsername(leetcodeUsername: string): Promise<any> {
  const res = await apiFetch(`${INTEGRATIONS_BASE}/leetcode/username`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leetcodeUsername }),
  });
  if (!res.ok) throw new Error(`Failed to save LeetCode username: ${res.status}`);
  return res.json();
}

export async function syncLeetCodeProblems(): Promise<{
  imported: number;
  skipped: number;
  totalFound: number;
}> {
  const res = await apiFetch(`${INTEGRATIONS_BASE}/leetcode/sync`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to sync LeetCode problems: ${res.status}`);
  return res.json();
}

// ─── Seed data ────────────────────────────────────────────────────────────────

/**
 * Push demo problems into the backend.
 * Called once on first load when the database is empty.
 */
export async function seedProblems(): Promise<void> {
  const seeds = buildSeedData();
  await Promise.all(seeds.map((p) => createProblem(p)));
}

function buildSeedData(): Omit<Problem, "id">[] {
  const today = new Date();

  // Helper: ISO date string offset by N days from today
  const d = (offset: number): string => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return date.toISOString().split("T")[0];
  };

  // Shorthand: compute nextRevisionDate from lastRevised + confidence
  const nrd = (lastRevised: string, conf: 1 | 2 | 3 | 4 | 5) =>
    calculateNextRevisionDate(lastRevised, conf);

  return [
    {
      name: "Two Sum",
      platform: "LeetCode",
      difficulty: "Easy",
      tags: ["Array", "Hash Table"],
      approach: "Hash map stores complement of each element and its index.",
      timeComplexity: "O(N)",
      spaceComplexity: "O(N)",
      confidenceLevel: 5,
      lastRevisedDate: d(-5),
      nextRevisionDate: nrd(d(-5), 5),
      mistakeNotes: "",
      revisionCount: 3,
      createdAt: d(-20),
    },
    {
      name: "Longest Increasing Subsequence",
      platform: "LeetCode",
      difficulty: "Medium",
      tags: ["DP", "Binary Search"],
      approach: "DP O(N²) or Binary Search O(N log N) using a maintained tails array.",
      timeComplexity: "O(N log N)",
      spaceComplexity: "O(N)",
      confidenceLevel: 2,
      lastRevisedDate: d(-3),
      nextRevisionDate: nrd(d(-3), 2),
      mistakeNotes: "Forgot how to use binary search for replacement in tails array.",
      revisionCount: 2,
      createdAt: d(-15),
    },
    {
      name: "Course Schedule",
      platform: "LeetCode",
      difficulty: "Medium",
      tags: ["Graph", "Topological Sort", "DFS"],
      approach:
        "Cycle detection via DFS (states: unvisited/visiting/visited) or Kahn's algorithm.",
      timeComplexity: "O(V + E)",
      spaceComplexity: "O(V + E)",
      confidenceLevel: 3,
      lastRevisedDate: d(-4),
      nextRevisionDate: nrd(d(-4), 3),
      mistakeNotes: "Confused visiting vs visited states in DFS.",
      revisionCount: 4,
      createdAt: d(-30),
    },
    {
      name: "Merge K Sorted Lists",
      platform: "LeetCode",
      difficulty: "Hard",
      tags: ["Heap", "Linked List", "Divide and Conquer"],
      approach: "Min-heap tracks the smallest current element from each list.",
      timeComplexity: "O(N log K)",
      spaceComplexity: "O(K)",
      confidenceLevel: 1,
      lastRevisedDate: d(-2),
      nextRevisionDate: nrd(d(-2), 1),
      mistakeNotes: "Struggled with custom comparator for priority queue in JS.",
      revisionCount: 1,
      createdAt: d(-10),
    },
    {
      name: "Alien Dictionary",
      platform: "LeetCode",
      difficulty: "Hard",
      tags: ["Graph", "Topological Sort"],
      approach: "Build directed graph from word pairs, then find topological ordering.",
      timeComplexity: "O(C)",
      spaceComplexity: "O(1)",
      confidenceLevel: 2,
      lastRevisedDate: d(-5),
      nextRevisionDate: nrd(d(-5), 2),
      mistakeNotes: "Prefix edge case: 'abc' before 'ab' is an invalid input.",
      revisionCount: 2,
      createdAt: d(-12),
    },
    {
      name: "Coin Change",
      platform: "LeetCode",
      difficulty: "Medium",
      tags: ["DP"],
      approach: "Bottom-up DP. dp[i] = min coins to make amount i.",
      timeComplexity: "O(S × N)",
      spaceComplexity: "O(S)",
      confidenceLevel: 4,
      lastRevisedDate: d(-7),
      nextRevisionDate: nrd(d(-7), 4),
      mistakeNotes: "",
      revisionCount: 5,
      createdAt: d(-40),
    },
    {
      name: "Water Jug Problem",
      platform: "GeeksForGeeks",
      difficulty: "Medium",
      tags: ["Math", "BFS"],
      approach: "Bézout's identity: target must be a multiple of GCD(x, y).",
      timeComplexity: "O(log(min(x,y)))",
      spaceComplexity: "O(1)",
      confidenceLevel: 3,
      lastRevisedDate: d(-2),
      nextRevisionDate: nrd(d(-2), 3),
      mistakeNotes: "",
      revisionCount: 1,
      createdAt: d(-2),
    },
    {
      name: "Minimum Spanning Tree (Kruskal)",
      platform: "Codeforces",
      difficulty: "Hard",
      tags: ["Graph", "MST", "Union Find"],
      approach: "Sort edges by weight, add edge if it doesn't form a cycle (DSU).",
      timeComplexity: "O(E log E)",
      spaceComplexity: "O(V)",
      confidenceLevel: 4,
      lastRevisedDate: d(-6),
      nextRevisionDate: nrd(d(-6), 4),
      mistakeNotes: "",
      revisionCount: 3,
      createdAt: d(-25),
    },
  ];
}
