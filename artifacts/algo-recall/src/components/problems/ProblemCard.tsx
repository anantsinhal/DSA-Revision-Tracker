import { useState } from "react";
import { Link } from "wouter";
import { Problem } from "@/lib/storage";
import { getRevisionStatus, getForgetProbability } from "@/lib/spaced-repetition";
import { useProblems } from "@/hooks/useProblems";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MistakeAnalyzer } from "@/components/ai/MistakeAnalyzer";
import {
  Edit, Trash2, CheckCircle2, Clock, AlertTriangle,
  ExternalLink, Bookmark, BookmarkCheck, BrainCircuit
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProblemCardProps {
  problem: Problem;
}

export function ProblemCard({ problem }: ProblemCardProps) {
  const { markRevised, deleteProblem, updateProblem } = useProblems();
  const { toast } = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const status = getRevisionStatus(problem.nextRevisionDate);
  const isDue = status === "Due" || status === "Due Soon";
  const forgetScore = getForgetProbability(
    problem.lastRevisedDate,
    problem.nextRevisionDate,
    problem.confidenceLevel
  );

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Hard": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "";
    }
  };

  const getConfidenceColor = (level: number) => {
    if (level <= 2) return "bg-red-500";
    if (level === 3) return "bg-amber-500";
    return "bg-green-500";
  };

  const getForgetColor = (score: number) => {
    if (score >= 75) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (score >= 45) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-green-600 bg-green-500/10 border-green-500/20";
  };

  const handleRevise = () => {
    markRevised(problem.id);
    toast({ title: "Revised!", description: `Progress updated for ${problem.name}` });
  };

  const handleDelete = () => {
    deleteProblem(problem.id);
    toast({ title: "Deleted", description: `${problem.name} removed from tracker.`, variant: "destructive" });
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateProblem(problem.id, { isBookmarked: !problem.isBookmarked });
    toast({ title: problem.isBookmarked ? "Bookmark removed" : "Bookmarked!" });
  };

  const problemUrl = problem.url || problem.sourceMeta?.url;

  return (
    <>
      <Card className="hover-elevate transition-all border group relative flex flex-col h-full">
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg overflow-hidden">
          <div className={`w-full h-full ${getConfidenceColor(problem.confidenceLevel)} opacity-80`} />
        </div>

        <CardHeader className="p-4 pb-2 pl-5">
          <div className="flex justify-between items-start gap-2">
            <h3
              className="font-bold text-lg leading-tight group-hover:text-primary transition-colors cursor-pointer flex-1 min-w-0 truncate"
              onClick={() => setDetailsOpen(true)}
            >
              {problem.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              {isDue && (
                <Badge variant={status === "Due" ? "destructive" : "secondary"} className="shrink-0 text-xs">
                  {status}
                </Badge>
              )}
              <button
                onClick={handleToggleBookmark}
                className="text-muted-foreground hover:text-amber-500 transition-colors p-1"
                title={problem.isBookmarked ? "Remove bookmark" : "Bookmark"}
              >
                {problem.isBookmarked
                  ? <BookmarkCheck className="w-4 h-4 text-amber-500" />
                  : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className={`font-medium ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </Badge>
            <Badge variant="secondary" className="text-xs bg-muted">
              {problem.platform}
            </Badge>
            {forgetScore >= 45 && (
              <Badge variant="outline" className={`text-xs font-mono ${getForgetColor(forgetScore)}`}>
                {forgetScore}% forget
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2 pl-5 flex-1">
          <div className="flex flex-wrap gap-1 mb-3">
            {problem.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            {problem.tags.length > 3 && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                +{problem.tags.length - 3}
              </span>
            )}
            {problem.companyTags && problem.companyTags.length > 0 && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                {problem.companyTags[0]}{problem.companyTags.length > 1 ? ` +${problem.companyTags.length - 1}` : ""}
              </span>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Next: {problem.nextRevisionDate}</span>
            </div>
            {problem.mistakeNotes && (
              <div className="flex items-center gap-1.5 text-amber-600/80 dark:text-amber-400/80">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="truncate">Has mistake notes</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pl-5 pt-0 flex justify-between items-center border-t mt-auto bg-muted/20">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
              <Link href={`/edit/${problem.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>

            {problemUrl && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                <a href={problemUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}

            {(problem.mistakeNotes || problem.approach) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-purple-500"
                onClick={() => setAiOpen(true)}
                title="AI Mistake Analyzer"
              >
                <BrainCircuit className="h-4 w-4" />
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete problem?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove "{problem.name}" from your tracker. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Button size="sm" onClick={handleRevise} className="h-8" variant={isDue ? "default" : "secondary"}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Revise
          </Button>
        </CardFooter>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex flex-wrap items-center gap-3">
              {problem.name}
              <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
                {problem.difficulty}
              </Badge>
              <Badge variant="secondary">{problem.platform}</Badge>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-3 flex-wrap">
              {problemUrl && (
                <a href={problemUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-sm">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Problem
                </a>
              )}
              {problem.solveDuration && (
                <span className="text-sm text-muted-foreground">⏱ {problem.solveDuration} min to solve</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Confidence</p>
                <div className="flex items-center gap-2 font-mono font-medium">
                  <div className={`w-3 h-3 rounded-full ${getConfidenceColor(problem.confidenceLevel)}`} />
                  {problem.confidenceLevel}/5
                </div>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Revisions</p>
                <p className="font-mono font-medium">{problem.revisionCount}</p>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Time</p>
                <p className="font-mono font-medium">{problem.timeComplexity || "N/A"}</p>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Forget Risk</p>
                <p className={`font-mono font-medium ${getForgetColor(forgetScore).split(" ")[0]}`}>{forgetScore}%</p>
              </div>
            </div>

            {problem.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
            )}

            {problem.companyTags && problem.companyTags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Companies</h4>
                <div className="flex flex-wrap gap-2">
                  {problem.companyTags.map(c => <Badge key={c} variant="outline" className="text-blue-500 border-blue-500/20">{c}</Badge>)}
                </div>
              </div>
            )}

            {problem.intuition && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-purple-500 uppercase tracking-wider flex items-center gap-1.5">
                  💡 Key Intuition
                </h4>
                <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-md whitespace-pre-wrap text-sm leading-relaxed">
                  {problem.intuition}
                </div>
              </div>
            )}

            {problem.approach && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Approach / Strategy</h4>
                <div className="p-4 bg-card border rounded-md whitespace-pre-wrap text-sm leading-relaxed">
                  {problem.approach}
                </div>
              </div>
            )}

            {problem.mistakeNotes && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Mistake Notes
                </h4>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 rounded-md whitespace-pre-wrap text-sm leading-relaxed">
                  {problem.mistakeNotes}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t flex-wrap">
              {(problem.mistakeNotes || problem.approach) && (
                <Button variant="outline" className="text-purple-600 border-purple-500/30 hover:bg-purple-500/5" onClick={() => { setDetailsOpen(false); setAiOpen(true); }}>
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  AI Analyze
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href={`/edit/${problem.id}`}>Edit Details</Link>
              </Button>
              <Button onClick={() => { handleRevise(); setDetailsOpen(false); }}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Revised
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Mistake Analyzer */}
      <MistakeAnalyzer problem={problem} open={aiOpen} onOpenChange={setAiOpen} />
    </>
  );
}
