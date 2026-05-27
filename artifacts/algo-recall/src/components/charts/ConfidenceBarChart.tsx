import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfidenceBarChartProps {
  data: { name: string; value: number }[];
}

export function ConfidenceBarChart({ data }: ConfidenceBarChartProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      fill: parseInt(d.name) <= 2 ? "hsl(var(--destructive))" : 
            parseInt(d.name) === 3 ? "hsl(var(--chart-3))" : 
            "hsl(var(--chart-2))"
    }));
  }, [data]);

  return (
    <Card className="flex flex-col h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Confidence Levels</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: "hsl(var(--muted-foreground))" }}
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
              cursor={{ fill: "hsl(var(--muted)/0.5)" }}
              contentStyle={{ 
                backgroundColor: "hsl(var(--popover))", 
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)"
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
