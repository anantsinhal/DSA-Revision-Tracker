import { Link } from "wouter";
import { Problem } from "@/lib/storage";
import { getRevisionStatus } from "@/lib/spaced-repetition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useProblems } from "@/hooks/useProblems";
import { useToast } from "@/hooks/use-toast";

interface MiniRevisionQueueProps {
  problems: Problem[];
}

export function MiniRevisionQueue({ problems }: MiniRevisionQueueProps) {
  const { markRevised } = useProblems();
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];
  
  // Get problems due today or overdue
  const dueProblems = problems
    .filter(p => p.nextRevisionDate <= today)
    .sort((a, b) => {
      // Sort by confidence (weak first), then date
      if (a.confidenceLevel !== b.confidenceLevel) return a.confidenceLevel - b.confidenceLevel;
      return new Date(a.nextRevisionDate).getTime() - new Date(b.nextRevisionDate).getTime();
    })
    .slice(0, 5);

  const handleRevise = (id: string, name: string) => {
    markRevised(id);
    toast({
      title: "Marked as Revised",
      description: `Great job reviewing ${name}!`,
      duration: 3000,
    });
  };

  if (dueProblems.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-3" />
        <p className="text-muted-foreground">All caught up for today!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dueProblems.map((p) => {
        const status = getRevisionStatus(p.nextRevisionDate);
        return (
          <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
            <div className="min-w-0 flex-1 mr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate block">{p.name}</span>
                {status === "Due" && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px] shrink-0">Overdue</Badge>
                )}
                {p.confidenceLevel <= 2 && (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] shrink-0 text-red-500 border-red-500/30">Weak</Badge>
                )}
              </div>
              <div className="flex text-xs text-muted-foreground gap-3">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    p.confidenceLevel <= 2 ? 'bg-red-500' : p.confidenceLevel === 3 ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  Conf: {p.confidenceLevel}
                </span>
                <span>•</span>
                <span className="truncate">{p.platform}</span>
              </div>
            </div>
            
            <Button 
              size="sm" 
              onClick={() => handleRevise(p.id, p.name)}
              className="shrink-0"
              data-testid={`button-revise-${p.id}`}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Done
            </Button>
          </div>
        );
      })}
    </div>
  );
}
