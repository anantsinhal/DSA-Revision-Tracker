import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppState } from "@/lib/storage";

interface WeeklyTrendChartProps {
  activity: AppState["activity"];
}

export function WeeklyTrendChart({ activity }: WeeklyTrendChartProps) {
  const chartData = useMemo(() => {
    // Generate data for the last 14 days
    const data = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const activityMap = new Map(activity.map(a => [a.date, a.count]));

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      data.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        count: activityMap.get(dateStr) || 0
      });
    }
    return data;
  }, [activity]);

  return (
    <Card className="flex flex-col h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Revision Trend (Last 14 Days)</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--popover))", 
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)"
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
