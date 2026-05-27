import mongoose from "mongoose";
import { Question } from "../models/Question";
import { User } from "../models/User";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const DEFAULT_LIMIT = 50;

type LoggerLike = {
  info?: (obj: unknown, msg?: string) => void;
  warn?: (obj: unknown, msg?: string) => void;
  error?: (obj: unknown, msg?: string) => void;
};

export class LeetCodeUserNotFoundError extends Error {
  readonly code = "LEETCODE_USER_NOT_FOUND";
}

export class LeetCodeRateLimitError extends Error {
  readonly code = "LEETCODE_RATE_LIMIT";
}

export class LeetCodeUpstreamError extends Error {
  readonly code = "LEETCODE_UPSTREAM_ERROR";
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
  }
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function leetCodeGraphQL<TData>(query: string, variables: Record<string, unknown>) {
  if (typeof globalThis.fetch !== "function") {
    throw new LeetCodeUpstreamError("Fetch is not available in this Node runtime");
  }

  const res = await globalThis.fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "AlgoRecall/1.0",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (res.status === 429) {
    throw new LeetCodeRateLimitError("LeetCode rate limit reached");
  }

  if (!res.ok) {
    throw new LeetCodeUpstreamError(
      `LeetCode upstream error: ${res.status}`,
      res.status,
    );
  }

  const json = (await res.json()) as GraphQLResponse<TData>;
  if (json.errors && json.errors.length > 0) {
    throw new LeetCodeUpstreamError(json.errors[0]?.message ?? "LeetCode GraphQL error");
  }

  if (!json.data) {
    throw new LeetCodeUpstreamError("Empty response from LeetCode");
  }

  return json.data;
}

async function assertLeetCodeUserExists(username: string) {
  const query = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
      }
    }
  `;

  const data = await leetCodeGraphQL<{ matchedUser: { username: string } | null }>(query, {
    username,
  });

  if (!data.matchedUser) {
    throw new LeetCodeUserNotFoundError("Invalid LeetCode username");
  }
}

export type LeetCodeSolvedProblem = {
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  url: string;
};

export async function fetchSolvedProblems(
  username: string,
  limit = DEFAULT_LIMIT,
): Promise<{ problems: LeetCodeSolvedProblem[]; totalFound: number }> {
  await assertLeetCodeUserExists(username);

  const recentAcceptedQuery = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        title
        titleSlug
        timestamp
      }
    }
  `;

  const recent = await leetCodeGraphQL<{
    recentAcSubmissionList: Array<{ title: string; titleSlug: string; timestamp: string }>;
  }>(recentAcceptedQuery, { username, limit });

  const uniqueSlugs = Array.from(
    new Set((recent.recentAcSubmissionList ?? []).map((s) => s.titleSlug).filter(Boolean)),
  );
  const totalFound = uniqueSlugs.length;

  const questionQuery = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title
        difficulty
        topicTags {
          name
          slug
        }
      }
    }
  `;

  const concurrency = 5;
  const results: LeetCodeSolvedProblem[] = [];

  for (let i = 0; i < uniqueSlugs.length; i += concurrency) {
    const slice = uniqueSlugs.slice(i, i + concurrency);
    const batch = await Promise.all(
      slice.map(async (titleSlug) => {
        const data = await leetCodeGraphQL<{
          question: {
            title: string;
            difficulty: "Easy" | "Medium" | "Hard";
            topicTags: Array<{ name: string; slug: string }>;
          } | null;
        }>(questionQuery, { titleSlug });

        if (!data.question) return null;

        return {
          title: data.question.title,
          titleSlug,
          difficulty: data.question.difficulty,
          tags: (data.question.topicTags ?? []).map((t) => t.name).filter(Boolean),
          url: `https://leetcode.com/problems/${titleSlug}/`,
        } satisfies LeetCodeSolvedProblem;
      }),
    );

    for (const item of batch) {
      if (item) results.push(item);
    }
  }

  return { problems: results, totalFound };
}

export function mapLeetCodeProblem(problem: LeetCodeSolvedProblem) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const addDays = (dateStr: string, days: number): string => {
    const date = new Date(dateStr);
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next.toISOString().split("T")[0];
  };

  // Default imported problems to "Medium confidence" so they show up in a sane cadence.
  const confidenceLevel: 1 | 2 | 3 | 4 | 5 = 3;

  return {
    name: problem.title,
    platform: "LeetCode" as const,
    difficulty: problem.difficulty,
    tags: problem.tags,
    approach: "",
    timeComplexity: "",
    spaceComplexity: "",
    confidenceLevel,
    lastRevisedDate: todayStr,
    nextRevisionDate: addDays(todayStr, 7),
    mistakeNotes: "",
    revisionCount: 0,
    createdAt: todayStr,
    source: "leetcode" as const,
    sourceMeta: {
      externalId: problem.titleSlug,
      url: problem.url,
      importedAt: new Date(),
    },
  };
}

export async function deduplicateImports(userId: string, externalIds: string[]) {
  if (externalIds.length === 0) return new Set<string>();

  const existing = await Question.find({
    userId: new mongoose.Types.ObjectId(userId),
    "sourceMeta.externalId": { $in: externalIds },
  }).select({ "sourceMeta.externalId": 1 });

  const set = new Set<string>();
  for (const doc of existing) {
    const id = (doc as any)?.sourceMeta?.externalId;
    if (typeof id === "string") set.add(id);
  }

  return set;
}

export async function syncProblems(params: {
  userId: string;
  username: string;
  limit?: number;
  logger?: LoggerLike;
}) {
  const { userId, username, limit, logger } = params;

  const { problems, totalFound } = await fetchSolvedProblems(username, limit);

  const mapped = problems.map(mapLeetCodeProblem);
  const externalIds = mapped
    .map((p) => p.sourceMeta?.externalId)
    .filter((x): x is string => typeof x === "string");

  const existingSet = await deduplicateImports(userId, externalIds);
  const newDocs = mapped.filter((p) => {
    const id = p.sourceMeta?.externalId;
    return typeof id === "string" ? !existingSet.has(id) : true;
  });

  let imported = 0;
  let skipped = mapped.length - newDocs.length;
  let failed = 0;

  try {
    if (newDocs.length > 0) {
      const inserted = await Question.insertMany(
        newDocs.map((doc) => ({ ...doc, userId: new mongoose.Types.ObjectId(userId) })),
        { ordered: false },
      );
      imported = inserted.length;
    }
  } catch (err: any) {
    // insertMany ordered:false can partially succeed.
    imported = typeof err?.insertedDocs?.length === "number" ? err.insertedDocs.length : imported;

    const writeErrors = Array.isArray(err?.writeErrors) ? err.writeErrors : [];
    for (const we of writeErrors) {
      if (we?.code === 11000) skipped++;
      else failed++;
    }

    if (writeErrors.length === 0) {
      failed++;
      logger?.error?.({ err }, "LeetCode sync insertMany failed");
    }
  }

  const status = failed > 0 ? (imported > 0 ? "partial" : "failed") : "success";
  const importedProblemsCount = await Question.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    source: "leetcode",
  });

  const update: any = {
    $set: {
      "leetcodeSync.lastSyncAt": new Date(),
      "leetcodeSync.importedProblemsCount": importedProblemsCount,
      "leetcodeSync.status": status,
    },
  };
  if (failed > 0) {
    update.$set["leetcodeSync.lastError"] = `Some problems failed to import (${failed}).`;
  } else {
    update.$unset = { "leetcodeSync.lastError": 1 };
  }

  await User.updateOne({ _id: userId }, update);

  logger?.info?.(
    { userId, imported, skipped, totalFound, status, failed },
    "LeetCode sync completed",
  );

  return { imported, skipped, totalFound };
}
