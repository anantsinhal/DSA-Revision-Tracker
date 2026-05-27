import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppState } from "@/lib/storage";

interface RevisionHeatmapProps {
  activity: AppState["activity"];
}

export function RevisionHeatmap({ activity }: RevisionHeatmapProps) {
  // Generate last 52 weeks of dates
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const cells: { date: string; count: number }[] = [];
  const activityMap = new Map(activity.map(a => [a.date, a.count]));
  
  // Start from ~1 year ago, adjust to start of week
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364); // 52 weeks * 7 days = 364
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay); // Rewind to Sunday
  
  for (let i = 0; i < 364 + today.getDay() + 1; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    cells.push({
      date: dateStr,
      count: activityMap.get(dateStr) || 0
    });
  }

  // Weeks grouping for CSS grid
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/50 dark:bg-muted/20";
    if (count === 1) return "bg-primary/30";
    if (count <= 3) return "bg-primary/60";
    if (count <= 6) return "bg-primary/80";
    return "bg-primary";
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-max flex flex-col gap-2">
        <div className="flex gap-1">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1">
              {week.map((cell, dIndex) => (
                <Tooltip key={`${wIndex}-${dIndex}`}>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-3 h-3 rounded-sm ${getColor(cell.count)} transition-colors hover:ring-2 ring-primary/50 cursor-crosshair`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      <span className="font-mono font-medium">{cell.count}</span> revisions on {cell.date}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mr-2">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-muted/50 dark:bg-muted/20" />
          <div className="w-3 h-3 rounded-sm bg-primary/30" />
          <div className="w-3 h-3 rounded-sm bg-primary/60" />
          <div className="w-3 h-3 rounded-sm bg-primary/80" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
