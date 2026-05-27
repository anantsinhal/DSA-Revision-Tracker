import { Achievement } from "@/lib/achievements";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { icon, name, description, isUnlocked, progress, totalRequired } = achievement;
  
  const percentage = (progress / totalRequired) * 100;

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      isUnlocked ? "bg-card border-primary/20 shadow-sm" : "bg-muted/30 border-dashed opacity-70 grayscale-[0.5]"
    )}>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={cn(
          "text-4xl shrink-0 transition-transform duration-500",
          isUnlocked ? "scale-110 drop-shadow-md" : "opacity-50"
        )}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-bold text-lg leading-tight mb-1",
            isUnlocked ? "text-foreground" : "text-muted-foreground"
          )}>
            {name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          
          {!isUnlocked && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>{progress}</span>
                <span>{totalRequired}</span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          )}
          
          {isUnlocked && (
            <div className="text-xs font-medium text-primary bg-primary/10 inline-block px-2 py-0.5 rounded-full">
              Unlocked
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
