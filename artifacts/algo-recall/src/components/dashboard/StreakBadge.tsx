import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakBadge({ currentStreak, longestStreak }: StreakBadgeProps) {
  let message = "Keep it up!";
  if (currentStreak === 0) message = "Start your streak today!";
  else if (currentStreak >= 3 && currentStreak < 7) message = "You're on fire!";
  else if (currentStreak >= 7 && currentStreak < 30) message = "Unstoppable!";
  else if (currentStreak >= 30) message = "Legendary consistency!";

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Flame className="w-10 h-10 text-orange-500" fill="currentColor" />
            <div className="absolute inset-0 animate-ping opacity-50 blur-sm">
              <Flame className="w-10 h-10 text-orange-500" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono tracking-tight">
              {currentStreak} Day Streak
            </h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Longest</p>
          <p className="font-mono font-medium">{longestStreak} days</p>
        </div>
      </CardContent>
    </Card>
  );
}
