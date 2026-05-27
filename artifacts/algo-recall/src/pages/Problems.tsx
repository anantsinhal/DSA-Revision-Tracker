import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProblemCard } from "@/components/problems/ProblemCard";
import { useProblems } from "@/hooks/useProblems";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Plus, Bookmark, X } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { getForgetProbability } from "@/lib/spaced-repetition";

export default function Problems() {
  const { problems } = useProblems();

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("nextRevision");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Collect all unique tags for quick-filter pills
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    problems.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    return [...tagSet].sort();
  }, [problems]);

  const filteredAndSorted = useMemo(() => {
    return problems
      .filter(p => {
        const q = search.toLowerCase();
        const matchesSearch = !q ||
          p.name.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q)) ||
          (p.approach && p.approach.toLowerCase().includes(q)) ||
          (p.intuition && p.intuition.toLowerCase().includes(q)) ||
          (p.mistakeNotes && p.mistakeNotes.toLowerCase().includes(q)) ||
          (p.companyTags && p.companyTags.some(c => c.toLowerCase().includes(q)));
        const matchesPlatform = platform === "all" || p.platform === platform;
        const matchesDifficulty = difficulty === "all" || p.difficulty === difficulty;
        const matchesBookmark = !bookmarkedOnly || p.isBookmarked;
        const matchesTag = !selectedTag || p.tags.includes(selectedTag);
        return matchesSearch && matchesPlatform && matchesDifficulty && matchesBookmark && matchesTag;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "nextRevision":
            return new Date(a.nextRevisionDate).getTime() - new Date(b.nextRevisionDate).getTime();
          case "confidenceAsc":
            return a.confidenceLevel - b.confidenceLevel;
          case "confidenceDesc":
            return b.confidenceLevel - a.confidenceLevel;
          case "recentlyRevised":
            return new Date(b.lastRevisedDate).getTime() - new Date(a.lastRevisedDate).getTime();
          case "alphabetical":
            return a.name.localeCompare(b.name);
          case "forgetRisk":
            return getForgetProbability(b.lastRevisedDate, b.nextRevisionDate, b.confidenceLevel)
              - getForgetProbability(a.lastRevisedDate, a.nextRevisionDate, a.confidenceLevel);
          default:
            return 0;
        }
      });
  }, [problems, search, platform, difficulty, sortBy, bookmarkedOnly, selectedTag]);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const activeFilterCount = [
    platform !== "all",
    difficulty !== "all",
    bookmarkedOnly,
    !!selectedTag,
  ].filter(Boolean).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Problem Library</h1>
            <p className="text-muted-foreground">{problems.length} problems saved · {filteredAndSorted.length} shown</p>
          </div>
          <Button asChild>
            <Link href="/add"><Plus className="w-4 h-4 mr-2" /> Add Problem</Link>
          </Button>
        </div>

        <div className="bg-card border rounded-lg p-4 space-y-3 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative w-full md:w-96 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search name, tags, notes, intuition, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex w-full md:w-auto gap-2 items-center flex-1 overflow-x-auto pb-1 md:pb-0">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground mr-1 shrink-0" />

              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-[130px] shrink-0">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="LeetCode">LeetCode</SelectItem>
                  <SelectItem value="GeeksForGeeks">GeeksForGeeks</SelectItem>
                  <SelectItem value="Codeforces">Codeforces</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-[120px] shrink-0">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[155px] shrink-0 ml-auto md:ml-4">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nextRevision">Due Date</SelectItem>
                  <SelectItem value="forgetRisk">Forget Risk ↓</SelectItem>
                  <SelectItem value="confidenceAsc">Weakest First</SelectItem>
                  <SelectItem value="confidenceDesc">Strongest First</SelectItem>
                  <SelectItem value="recentlyRevised">Recently Revised</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={bookmarkedOnly ? "default" : "outline"}
                size="icon"
                className="shrink-0"
                onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
                title="Bookmarked only"
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tag quick filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allTags.slice(0, 15).map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setPlatform("all"); setDifficulty("all"); setBookmarkedOnly(false); setSelectedTag(null); }}
                  className="text-[10px] uppercase tracking-wider font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full hover:bg-destructive/20 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}
        </div>

        {filteredAndSorted.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredAndSorted.map(problem => (
              <motion.div key={problem.id} variants={item} className="h-full">
                <ProblemCard problem={problem} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24 bg-card border rounded-lg border-dashed">
            <h3 className="text-lg font-medium mb-2">No problems found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
            {problems.length === 0 && (
              <Button asChild><Link href="/add">Add Your First Problem</Link></Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
