import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Bookmark } from "lucide-react";
import { Problem } from "@/lib/storage";
import { useProblems } from "@/hooks/useProblems";
import { useToast } from "@/hooks/use-toast";

const POPULAR_TAGS = ["Array", "DP", "Graph", "Tree", "Trie", "Greedy", "Binary Search", "Sliding Window", "Stack", "Queue", "Heap", "Linked List", "Two Pointer", "BFS", "DFS", "Hash Map", "Recursion", "Backtracking"];
const POPULAR_COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Uber", "Airbnb", "Bloomberg", "Goldman Sachs"];

const formSchema = z.object({
  name: z.string().min(2, "Problem name is required"),
  platform: z.enum(["LeetCode", "GeeksForGeeks", "Codeforces", "Other"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  url: z.string().optional(),
  approach: z.string().optional(),
  intuition: z.string().optional(),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  confidenceLevel: z.number().min(1).max(5),
  lastRevisedDate: z.string(),
  mistakeNotes: z.string().optional(),
  revisionFrequency: z.string().optional(),
  solveDuration: z.string().optional(),
  isBookmarked: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProblemFormProps {
  initialData?: Problem;
  isEdit?: boolean;
}

export function ProblemForm({ initialData, isEdit = false }: ProblemFormProps) {
  const { addProblem, updateProblem } = useProblems();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [companyTags, setCompanyTags] = useState<string[]>(initialData?.companyTags || []);
  const [companyInput, setCompanyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      platform: initialData?.platform || "LeetCode",
      difficulty: initialData?.difficulty || "Medium",
      url: initialData?.url || "",
      approach: initialData?.approach || "",
      intuition: initialData?.intuition || "",
      timeComplexity: initialData?.timeComplexity || "",
      spaceComplexity: initialData?.spaceComplexity || "",
      confidenceLevel: initialData?.confidenceLevel || 3,
      lastRevisedDate: initialData?.lastRevisedDate || new Date().toISOString().split("T")[0],
      mistakeNotes: initialData?.mistakeNotes || "",
      revisionFrequency: initialData?.revisionFrequency?.toString() || "",
      solveDuration: initialData?.solveDuration?.toString() || "",
      isBookmarked: initialData?.isBookmarked || false,
    },
  });

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent, value?: string) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = (value || tagInput).trim();
    const upper = trimmed.toUpperCase();
    if (upper && !tags.includes(upper)) {
      setTags([...tags, upper]);
      setTagInput("");
    }
  };

  const handleAddCompany = (e: React.KeyboardEvent | React.MouseEvent, value?: string) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = (value || companyInput).trim();
    if (trimmed && !companyTags.includes(trimmed)) {
      setCompanyTags([...companyTags, trimmed]);
      setCompanyInput("");
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const revFreq = data.revisionFrequency ? parseInt(data.revisionFrequency, 10) : undefined;
      const cleanFreq = revFreq !== undefined && !isNaN(revFreq) ? revFreq : undefined;
      const solveDur = data.solveDuration ? parseInt(data.solveDuration, 10) : undefined;
      const cleanDur = solveDur !== undefined && !isNaN(solveDur) ? solveDur : undefined;

      const normalized = {
        ...data,
        approach: data.approach ?? "",
        intuition: data.intuition ?? "",
        timeComplexity: data.timeComplexity ?? "",
        spaceComplexity: data.spaceComplexity ?? "",
        mistakeNotes: data.mistakeNotes ?? "",
        url: data.url || undefined,
      };

      if (isEdit && initialData) {
        await updateProblem(initialData.id, {
          ...normalized,
          tags,
          companyTags,
          confidenceLevel: data.confidenceLevel as 1 | 2 | 3 | 4 | 5,
          revisionFrequency: cleanFreq,
          solveDuration: cleanDur,
        });
        toast({ title: "Problem updated successfully" });
      } else {
        await addProblem({
          ...normalized,
          tags,
          companyTags,
          confidenceLevel: data.confidenceLevel as 1 | 2 | 3 | 4 | 5,
          revisionFrequency: cleanFreq,
          solveDuration: cleanDur,
        });
        toast({ title: "Problem added successfully" });
      }
      setLocation("/problems");
    } catch {
      toast({ title: "Failed to save problem", description: "Could not reach the server. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Problem Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Two Sum" {...field} data-testid="input-problem-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="platform" render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-platform">
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LeetCode">LeetCode</SelectItem>
                      <SelectItem value="GeeksForGeeks">GeeksForGeeks</SelectItem>
                      <SelectItem value="Codeforces">Codeforces</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="difficulty" render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-difficulty">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Easy" className="text-green-500 font-medium">Easy</SelectItem>
                      <SelectItem value="Medium" className="text-amber-500 font-medium">Medium</SelectItem>
                      <SelectItem value="Hard" className="text-red-500 font-medium">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="url" render={({ field }) => (
              <FormItem>
                <FormLabel>Problem URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://leetcode.com/problems/..." {...field} />
                </FormControl>
              </FormItem>
            )} />

            {/* Topic Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Topics / Tags</label>
              <div className="flex gap-2 mb-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="e.g. DP, Graph (Enter)" data-testid="input-tag" />
                <Button type="button" variant="secondary" onClick={(e) => handleAddTag(e)} data-testid="button-add-tag"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {POPULAR_TAGS.filter(t => !tags.includes(t.toUpperCase())).slice(0, 8).map(tag => (
                  <button key={tag} type="button" onClick={(e) => handleAddTag(e, tag)} className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                    + {tag}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:bg-muted-foreground/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
                {tags.length === 0 && <span className="text-sm text-muted-foreground italic">No tags added</span>}
              </div>
            </div>

            {/* Company Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Company Tags</label>
              <div className="flex gap-2 mb-2">
                <Input value={companyInput} onChange={(e) => setCompanyInput(e.target.value)} onKeyDown={handleAddCompany} placeholder="e.g. Google, Amazon (Enter)" />
                <Button type="button" variant="secondary" onClick={(e) => handleAddCompany(e)}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {POPULAR_COMPANIES.filter(c => !companyTags.includes(c)).slice(0, 6).map(c => (
                  <button key={c} type="button" onClick={(e) => handleAddCompany(e, c)} className="text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full hover:bg-blue-500/20 transition-colors">
                    + {c}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {companyTags.map(c => (
                  <Badge key={c} variant="outline" className="pl-2 pr-1 py-1 text-blue-500 border-blue-500/20 flex items-center gap-1">
                    {c}
                    <button type="button" onClick={() => setCompanyTags(companyTags.filter(t => t !== c))} className="hover:bg-muted-foreground/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
                {companyTags.length === 0 && <span className="text-sm text-muted-foreground italic">No companies added</span>}
              </div>
            </div>

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4 space-y-4">
                <FormField control={form.control} name="confidenceLevel" render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-2">
                      <FormLabel>Confidence Level: {field.value}</FormLabel>
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${field.value <= 2 ? "bg-red-500/10 text-red-500" : field.value === 3 ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"}`}>
                        {field.value <= 2 ? "Weak" : field.value === 3 ? "Medium" : "Strong"}
                      </span>
                    </div>
                    <FormControl>
                      <Slider min={1} max={5} step={1} defaultValue={[field.value]} onValueChange={(vals) => field.onChange(vals[0])} data-testid="slider-confidence" />
                    </FormControl>
                    <FormDescription className="flex justify-between mt-1 text-xs">
                      <span>1 (Clueless)</span><span>5 (Mastered)</span>
                    </FormDescription>
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <FormField control={form.control} name="lastRevisedDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Revised</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-last-revised" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="solveDuration" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solve Time (min)</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g. 25" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="revisionFrequency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Interval (Days)</FormLabel>
                    <FormControl><Input type="number" placeholder="Auto based on confidence" {...field} data-testid="input-revision-frequency" /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="isBookmarked" render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-amber-500" />
                      <FormLabel className="!mt-0">Bookmark this problem</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <FormField control={form.control} name="intuition" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-purple-500 dark:text-purple-400">💡 Key Intuition</FormLabel>
                <FormControl>
                  <Textarea placeholder="What's the core insight? What pattern does this follow?" className="h-28 border-purple-500/30 focus-visible:ring-purple-500" {...field} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="approach" render={({ field }) => (
              <FormItem>
                <FormLabel>Approach / Strategy</FormLabel>
                <FormControl>
                  <Textarea placeholder="Briefly describe the optimal approach..." className="h-28 font-mono text-sm" {...field} data-testid="textarea-approach" />
                </FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="timeComplexity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Complexity</FormLabel>
                  <FormControl><Input placeholder="O(N)" className="font-mono" {...field} data-testid="input-time-complexity" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="spaceComplexity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Space Complexity</FormLabel>
                  <FormControl><Input placeholder="O(1)" className="font-mono" {...field} data-testid="input-space-complexity" /></FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="mistakeNotes" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-500 dark:text-amber-400">⚠️ Mistakes & Gotchas</FormLabel>
                <FormControl>
                  <Textarea placeholder="What did you mess up? Edge cases missed? What to watch out for?" className="h-40 border-amber-500/30 focus-visible:ring-amber-500" {...field} data-testid="textarea-mistake-notes" />
                </FormControl>
              </FormItem>
            )} />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button variant="outline" asChild type="button">
            <Link href="/problems">Cancel</Link>
          </Button>
          <Button type="submit" size="lg" disabled={isSaving} data-testid="button-submit-problem">
            {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Problem"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
