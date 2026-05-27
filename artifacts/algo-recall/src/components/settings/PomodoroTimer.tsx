import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function PomodoroTimer() {
  const { mode, formattedTime, isRunning, progress, toggleTimer, resetTimer, setTimerMode } = usePomodoroTimer();

  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden">
      <CardHeader className="pb-2 text-center bg-muted/30">
        <CardTitle className="text-lg font-medium flex items-center justify-center gap-2">
          {mode === "focus" ? (
            <><Brain className="w-5 h-5 text-primary" /> Focus Session</>
          ) : (
            <><Coffee className="w-5 h-5 text-amber-500" /> Short Break</>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-4 border-muted">
            {/* Simple circular progress visualization using conic-gradient */}
            <div 
              className="absolute inset-[-4px] rounded-full"
              style={{
                background: `conic-gradient(${mode === "focus" ? "hsl(var(--primary))" : "hsl(var(--chart-3))"} ${progress}%, transparent 0)`
              }}
            >
              <div className="absolute inset-1 rounded-full bg-card" />
            </div>
            
            <div className="relative z-10 text-5xl font-bold font-mono tracking-tighter">
              {formattedTime}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <Button 
            size="lg" 
            className="w-16 h-16 rounded-full" 
            onClick={toggleTimer}
            variant={isRunning ? "outline" : "default"}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 translate-x-0.5" />}
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-16 h-16 rounded-full"
            onClick={resetTimer}
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex bg-muted rounded-lg p-1">
          <Button 
            variant={mode === "focus" ? "secondary" : "ghost"} 
            className="flex-1"
            size="sm"
            onClick={() => setTimerMode("focus")}
          >
            Focus (25m)
          </Button>
          <Button 
            variant={mode === "break" ? "secondary" : "ghost"} 
            className="flex-1"
            size="sm"
            onClick={() => setTimerMode("break")}
          >
            Break (5m)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
