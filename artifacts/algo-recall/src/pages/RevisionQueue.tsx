import { useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProblemCard } from "@/components/problems/ProblemCard";
import { useProblems } from "@/hooks/useProblems";
import { getRevisionStatus } from "@/lib/spaced-repetition";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function RevisionQueue() {
  const { problems } = useProblems();

  const { overdue, dueToday, comingUp } = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split("T")[0];

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const limitStr = threeDaysFromNow.toISOString().split("T")[0];

    const ov: typeof problems = [];
    const dt: typeof problems = [];
    const cu: typeof problems = [];

    // Custom sorting function based on priority: weak first, then by mistake count
    const sortPriority = (a: typeof problems[0], b: typeof problems[0]) => {
      if (a.confidenceLevel !== b.confidenceLevel) return a.confidenceLevel - b.confidenceLevel;
      if (a.mistakeNotes && !b.mistakeNotes) return -1;
      if (!a.mistakeNotes && b.mistakeNotes) return 1;
      return new Date(a.nextRevisionDate).getTime() - new Date(b.nextRevisionDate).getTime();
    };

    problems.forEach(p => {
      if (p.nextRevisionDate < todayStr) ov.push(p);
      else if (p.nextRevisionDate === todayStr) dt.push(p);
      else if (p.nextRevisionDate > todayStr && p.nextRevisionDate <= limitStr) cu.push(p);
    });

    return {
      overdue: ov.sort(sortPriority),
      dueToday: dt.sort(sortPriority),
      comingUp: cu.sort((a,b) => new Date(a.nextRevisionDate).getTime() - new Date(b.nextRevisionDate).getTime())
    };
  }, [problems]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const isEmpty = overdue.length === 0 && dueToday.length === 0 && comingUp.length === 0;

  return (
    <Layout>
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Revision Queue</h1>
          <p className="text-muted-foreground">Prioritized list based on spaced repetition algorithms.</p>
        </div>

        {isEmpty ? (
          <div className="text-center py-20 bg-card border rounded-lg border-dashed">
            <CheckCircle2 className="w-16 h-16 text-green-500/50 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Queue is Empty</h3>
            <p className="text-muted-foreground">You don't have any revisions scheduled for the next 3 days.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {overdue.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="text-xl font-bold text-destructive">Overdue</h2>
                  <span className="bg-destructive/10 text-destructive text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                    {overdue.length}
                  </span>
                </div>
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {overdue.map(p => (
                    <motion.div key={p.id} variants={item} className="h-full">
                      <ProblemCard problem={p} />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {dueToday.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Due Today</h2>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                    {dueToday.length}
                  </span>
                </div>
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dueToday.map(p => (
                    <motion.div key={p.id} variants={item} className="h-full">
                      <ProblemCard problem={p} />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {comingUp.length > 0 && (
              <section className="opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-bold text-muted-foreground">Coming Up</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comingUp.map(p => (
                    <div key={p.id} className="h-full">
                      <ProblemCard problem={p} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
