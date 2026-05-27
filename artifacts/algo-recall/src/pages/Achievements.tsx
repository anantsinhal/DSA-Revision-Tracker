import { Layout } from "@/components/layout/Layout";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { useAnalytics } from "@/hooks/useAnalytics";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export default function Achievements() {
  const { achievements } = useAnalytics();

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Achievements</h1>
            <p className="text-muted-foreground">Gamify your learning journey.</p>
          </div>
          <div className="bg-card border rounded-full px-4 py-2 flex items-center gap-3 shadow-sm">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-medium">
              {unlockedCount} / {totalCount} Unlocked
            </span>
          </div>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {achievements.map(achievement => (
            <motion.div key={achievement.id} variants={item}>
              <AchievementCard achievement={achievement} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
}
