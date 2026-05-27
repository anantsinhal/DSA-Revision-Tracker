import { Layout } from "@/components/layout/Layout";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { StatCard } from "@/components/dashboard/StatCard";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { MiniRevisionQueue } from "@/components/dashboard/MiniRevisionQueue";
import { RevisionHeatmap } from "@/components/dashboard/RevisionHeatmap";
import { BrainCircuit, Target, CheckCircle2, AlertTriangle, TrendingUp, RefreshCw, BarChart2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { state } = useAnalytics();
  const { summary, topics, activity, isLoading, isError } = useDashboardAnalytics();

  if (isLoading) return <Layout><div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></Layout>;
  if (isError || !summary || !topics || !activity) return <Layout><div className="flex h-full items-center justify-center">Error loading analytics.</div></Layout>;

  // Lowest confidence topics
  const weakTopics = [...topics].sort((a, b) => a.averageConfidence - b.averageConfidence).slice(0, 3);
  const strongTopics = [...topics].sort((a, b) => b.averageConfidence - a.averageConfidence).slice(0, 3);
  const weakest = weakTopics.length > 0 ? weakTopics[0] : null;
  const strongest = strongTopics.length > 0 ? strongTopics[0] : null;
  const mostRevisedTopic = [...topics].sort((a, b) => b.totalProblems - a.totalProblems)[0];

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Here's your revision progress.</p>
        </div>

        <StreakBadge 
          currentStreak={summary.streak} 
          longestStreak={Math.max(summary.streak, state?.streakData?.longestStreak || 0)} 
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Problems" 
            value={summary.totalProblems} 
            icon={<CheckCircle2 />}
            className="hover-elevate transition-all"
          />
          <StatCard 
            title="Due Today" 
            value={summary.dueToday} 
            icon={<Target className={summary.dueToday > 0 ? "text-destructive" : ""} />}
            className="hover-elevate transition-all"
            description={summary.dueToday > 0 ? "Needs attention" : "All caught up!"}
          />
          <StatCard 
            title="Total Revisions" 
            value={summary.totalRevisions} 
            icon={<RefreshCw className="text-blue-500" />}
            className="hover-elevate transition-all"
          />
          <StatCard 
            title="Avg. Confidence" 
            value={topics.length > 0 ? (topics.reduce((acc, t) => acc + t.averageConfidence, 0) / topics.length).toFixed(1) : "0"} 
            icon={<BarChart2 className="text-green-500" />}
            className="hover-elevate transition-all"
            description="/ 5.0 overall"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Map</CardTitle>
              </CardHeader>
              <CardContent>
                <RevisionHeatmap activity={activity} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Intelligence & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {weakest && strongest && (
                    <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <BrainCircuit className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1 text-primary">Topic Mastery</h4>
                        <p className="text-sm text-muted-foreground">
                          You are struggling with <strong>{weakest.tag}</strong> {weakest.averageConfidence < 4 && `(Avg: ${weakest.averageConfidence.toFixed(1)}) `}
                          but excelling at <strong>{strongest.tag}</strong>{strongest.averageConfidence >= 4 && ` (Avg: ${strongest.averageConfidence.toFixed(1)})`}.
                        </p>
                      </div>
                    </div>
                  )}
                  {summary.streak >= 3 ? (
                    <div className="flex items-start gap-4 p-4 bg-orange-500/5 rounded-lg border border-orange-500/10">
                      <TrendingUp className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1 text-orange-600">Great Momentum!</h4>
                        <p className="text-sm text-muted-foreground">
                          Longest streak: {Math.max(summary.streak, state?.streakData?.longestStreak || 0)} days - great momentum! You're retaining knowledge effectively!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border">
                      <TrendingUp className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">Consistency Check</h4>
                        <p className="text-sm text-muted-foreground">
                          Start revising daily to build your streak and improve long-term retention.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weakest Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weakTopics.map((topic, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-md bg-muted/30">
                      <span className="font-medium">{topic.tag}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{topic.totalProblems} problems</span>
                        <span className={`px-2 py-1 rounded font-mono font-bold ${topic.averageConfidence < 3 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {topic.averageConfidence.toFixed(1)} / 5.0
                        </span>
                      </div>
                    </div>
                  ))}
                  {weakTopics.length === 0 && <p className="text-sm text-muted-foreground">Add problems with tags to see topic insights.</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex justify-between items-center">
                  Up Next
                  <Button variant="link" size="sm" asChild className="px-0">
                    <Link href="/queue">View Queue</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MiniRevisionQueue problems={summary.dueToday > 0 && state ? state.problems : []} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
