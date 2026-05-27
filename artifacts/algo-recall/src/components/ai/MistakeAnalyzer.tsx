import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Problem } from "@/lib/storage";
import { apiFetch } from "@/lib/auth";
import {
  BrainCircuit,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface MistakeAnalyzerProps {
  problem: Problem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AIAnalysis {
  errorType: string;
  patternSuggestion: string;
  keyIssues: string[];
  hint: string;
  studyTopics: string[];
  severity: "minor" | "moderate" | "major";
}

const severityColor = {
  minor: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  moderate: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  major: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function MistakeAnalyzer({ problem, open, onOpenChange }: MistakeAnalyzerProps) {
  const [codeAttempt, setCodeAttempt] = useState("");
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);
    setError(null);

    try {
      const res = await apiFetch("/api/ai/analyze-mistake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemName: problem.name,
          difficulty: problem.difficulty,
          tags: problem.tags,
          approach: problem.approach,
          mistakeNotes: problem.mistakeNotes,
          codeAttempt: codeAttempt.trim() || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Analysis request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.error) throw new Error(json.error);
              if (json.content) accumulated += json.content;
              if (json.done && accumulated) {
                setAnalysis(JSON.parse(accumulated));
              }
            } catch {
              // partial chunk, continue
            }
          }
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setCodeAttempt("");
      setAnalysis(null);
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-purple-500" />
            </div>
            AI Mistake Analyzer
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{problem.name}</span> · {problem.difficulty} · {problem.tags.slice(0, 3).join(", ")}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {!analysis && (
            <>
              {problem.mistakeNotes && (
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Your Mistake Notes
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{problem.mistakeNotes}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  Code Attempt
                  <span className="text-xs text-muted-foreground font-normal">(optional — paste your solution attempt)</span>
                </label>
                <Textarea
                  value={codeAttempt}
                  onChange={(e) => setCodeAttempt(e.target.value)}
                  placeholder="Paste your code here for deeper analysis..."
                  className="font-mono text-xs h-40 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={loading || (!problem.mistakeNotes && !codeAttempt.trim())}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze My Mistakes
                  </>
                )}
              </Button>

              {!problem.mistakeNotes && !codeAttempt.trim() && (
                <p className="text-xs text-center text-muted-foreground">
                  Add mistake notes to this problem or paste your code to enable analysis
                </p>
              )}
            </>
          )}

          {analysis && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={severityColor[analysis.severity]}
                >
                  {analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1)} Issue · {analysis.errorType}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)}>
                  Analyze again
                </Button>
              </div>

              <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4 space-y-1">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Pattern Detected
                </p>
                <p className="text-sm font-medium">{analysis.patternSuggestion}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> Key Issues Found
                </p>
                <ul className="space-y-1.5">
                  {analysis.keyIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4 space-y-1">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" /> Hint (No Spoilers)
                </p>
                <p className="text-sm leading-relaxed">{analysis.hint}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-green-500" /> Study Topics
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.studyTopics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={handleClose.bind(null, false)} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
