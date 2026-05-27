import { useMemo } from "react";
import { Problem } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface InterviewReadinessProps {
  problems: Problem[];
  streak: number;
}

interface TopicScore {
  tag: string;
  score: number;
  count: number;
  status: "ready" | "needs-work" | "critical";
}

function computeScore(problems: Problem[], streak: number) {
  if (problems.length === 0) return { overall: 0, topics: [], grade: "F" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // 1. Coverage score (0-25): how many unique topics covered
  const allTags = new Set(problems.flatMap((p) => p.tags));
  const coreTopics = ["Array", "DP", "Graph", "Tree", "Binary Search", "Sliding Window", "Two Pointer", "Stack", "Heap"];
  const coveredCore = coreTopics.filter((t) =>
    [...allTags].some((tag) => tag.toUpperCase().includes(t.toUpperCase()))
  ).length;
  const coverageScore = Math.min(25, Math.round((coveredCore / coreTopics.length) * 25));

  // 2. Confidence score (0-30): average confidence across all problems
  const avgConf = problems.reduce((s, p) => s + p.confidenceLevel, 0) / problems.length;
  const confScore = Math.round((avgConf / 5) * 30);

  // 3. Revision completion (0-25): fraction of problems not overdue
  const onTrack = problems.filter((p) => p.nextRevisionDate >= todayStr).length;
  const revScore = Math.round((onTrack / problems.length) * 25);

  // 4. Consistency streak (0-20): streak days
  const streakScore = Math.min(20, Math.round((streak / 14) * 20));

  const overall = coverageScore + confScore + revScore + streakScore;

  // Per-topic analysis
  const tagMap: Record<string, { conf: number[]; count: number }> = {};
  for (const p of problems) {
    for (const tag of p.tags) {
      if (!tagMap[tag]) tagMap[tag] = { conf: [], count: 0 };
      tagMap[tag].conf.push(p.confidenceLevel);
      tagMap[tag].count++;
    }
  }

  const topics: TopicScore[] = Object.entries(tagMap)
    .map(([tag, { conf, count }]) => {
      const avg = conf.reduce((a, b) => a + b, 0) / conf.length;
      const score = Math.round((avg / 5) * 100);
      const status: TopicScore["status"] =
        score >= 70 ? "ready" : score >= 40 ? "needs-work" : "critical";
      return { tag, score, count, status };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 6);

  const grade =
    overall >= 85 ? "A" :
    overall >= 70 ? "B" :
    overall >= 55 ? "C" :
    overall >= 40 ? "D" : "F";

  return { overall, topics, grade, coverageScore, confScore, revScore, streakScore };
}

export function InterviewReadiness({ problems, streak }: InterviewReadinessProps) {
  const { overall, topics, grade, coverageScore, confScore, revScore, streakScore } =
    useMemo(() => computeScore(problems, streak), [problems, streak]);

  const gradeColor =
    grade === "A" ? "text-green-500" :
    grade === "B" ? "text-blue-500" :
    grade === "C" ? "text-amber-500" :
    "text-red-500";

  const statusColors = {
    ready: "bg-green-500/10 text-green-600 border-green-500/20",
    "needs-work": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    critical: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const statusIcon = {
    ready: <TrendingUp className="w-3 h-3" />,
    "needs-work": <Minus className="w-3 h-3" />,
    critical: <TrendingDown className="w-3 h-3" />,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-500" />
          Interview Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted/30"
              />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={`${overall} ${100 - overall}`}
                strokeLinecap="round"
                className={gradeColor}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
              <span className={`text-2xl font-bold ${gradeColor}`}>{grade}</span>
              <span className="text-[10px] text-muted-foreground">{overall}/100</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            {(
              [
                { label: "Coverage", val: coverageScore, max: 25 },
                { label: "Confidence", val: confScore, max: 30 },
                { label: "Up to date", val: revScore, max: 25 },
                { label: "Streak", val: streakScore, max: 20 },
              ] as { label: string; val: number; max: number }[]
            ).map(({ label, val, max }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(val / max) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-8 text-right">{val}/{max}</span>
              </div>
            ))}
          </div>
        </div>

        {topics.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Topic Readiness</p>
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <Badge
                  key={t.tag}
                  variant="outline"
                  className={`text-xs gap-1 ${statusColors[t.status]}`}
                >
                  {statusIcon[t.status]}
                  {t.tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {problems.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Add problems to see your interview readiness score.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
