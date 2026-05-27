import { Problem } from "./storage";

export interface AnalyticsData {
  totalSolved: number;
  weakCount: number;
  strongCount: number;
  dueToday: number;
  mostFrequentWeakTag: string;
  mostSolvedTag: string;
  mistakePattern: string;
  topicDistribution: { name: string; value: number }[];
  confidenceDistribution: { name: string; value: number }[];
}

export function computeAnalytics(problems: Problem[]): AnalyticsData {
  const totalSolved = problems.length;
  
  let weakCount = 0;
  let strongCount = 0;
  let dueTodayCount = 0;
  
  const tagCounts: Record<string, number> = {};
  const weakTagCounts: Record<string, number> = {};
  const confidenceCounts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  
  const today = new Date().toISOString().split("T")[0];
  const allMistakeNotes: string[] = [];

  for (const p of problems) {
    // Confidence stats
    if (p.confidenceLevel <= 2) weakCount++;
    if (p.confidenceLevel >= 4) strongCount++;
    
    confidenceCounts[p.confidenceLevel.toString() as keyof typeof confidenceCounts]++;
    
    // Due today
    if (p.nextRevisionDate <= today) dueTodayCount++;
    
    // Tags
    for (const tag of p.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      if (p.confidenceLevel <= 2) {
        weakTagCounts[tag] = (weakTagCounts[tag] || 0) + 1;
      }
    }
    
    // Mistakes
    if (p.mistakeNotes.trim()) {
      allMistakeNotes.push(p.mistakeNotes.toLowerCase());
    }
  }

  // Find most frequent tags
  const mostSolvedTag = Object.keys(tagCounts).reduce((a, b) => tagCounts[a] > tagCounts[b] ? a : b, "None");
  const mostFrequentWeakTag = Object.keys(weakTagCounts).reduce((a, b) => weakTagCounts[a] > weakTagCounts[b] ? a : b, "None");

  // Simple mistake pattern extraction (finding common keywords)
  const commonKeywords = ["forgot", "base case", "edge case", "dp", "graph", "binary search", "index out of bounds", "pointer", "loop", "time limit", "memory limit", "sort", "heap", "recursion"];
  const keywordCounts: Record<string, number> = {};
  for (const note of allMistakeNotes) {
    for (const kw of commonKeywords) {
      if (note.includes(kw)) {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      }
    }
  }
  
  const sortedKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(k => k[0]);
  const mistakePattern = sortedKeywords.length > 0 ? `You frequently struggle with: ${sortedKeywords.join(", ")}` : "Not enough mistake data to analyze.";

  const topicDistribution = Object.entries(tagCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5 tags

  const confidenceDistribution = [
    { name: "1", value: confidenceCounts["1"] },
    { name: "2", value: confidenceCounts["2"] },
    { name: "3", value: confidenceCounts["3"] },
    { name: "4", value: confidenceCounts["4"] },
    { name: "5", value: confidenceCounts["5"] },
  ];

  return {
    totalSolved,
    weakCount,
    strongCount,
    dueToday: dueTodayCount,
    mostFrequentWeakTag,
    mostSolvedTag,
    mistakePattern,
    topicDistribution,
    confidenceDistribution
  };
}
