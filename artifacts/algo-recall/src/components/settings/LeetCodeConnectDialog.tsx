import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";

interface LeetCodeConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "connect" | "syncing" | "done";

export function LeetCodeConnectDialog({ open, onOpenChange }: LeetCodeConnectDialogProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState(user?.leetcodeUsername ?? "");
  const [step, setStep] = useState<Step>("connect");
  const [syncResult, setSyncResult] = useState<{ imported: number; skipped: number; totalFound: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUsername(user?.leetcodeUsername ?? "");
      setStep("connect");
      setSyncResult(null);
      setError(null);
    }
  }, [open, user?.leetcodeUsername]);

  const handleConnect = async () => {
    if (!username.trim()) return;
    setError(null);
    setStep("syncing");

    try {
      await api.updateLeetCodeUsername(username.trim());
      const result = await api.syncLeetCodeProblems();
      await refreshUser();
      setSyncResult(result);
      setStep("done");
    } catch (err: any) {
      const msg = err?.message ?? "Something went wrong. Please try again.";
      setError(msg);
      setStep("connect");
      toast({ title: "Connection failed", description: msg, variant: "destructive" });
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "connect" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-orange-500 fill-current">
                    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
                  </svg>
                </div>
                <DialogTitle className="text-xl">Connect LeetCode</DialogTitle>
              </div>
              <DialogDescription className="text-sm leading-relaxed">
                Enter your LeetCode username to import your recently solved problems. AlgoRecall will automatically schedule them for spaced repetition based on patterns you need to improve.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <label htmlFor="lc-username" className="text-sm font-medium">
                  LeetCode Username
                </label>
                <div className="flex gap-2">
                  <Input
                    id="lc-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. anantsinhal26"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    title="Open LeetCode profile"
                  >
                    <a
                      href={username ? `https://leetcode.com/u/${username}/` : "https://leetcode.com"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <div className="rounded-lg bg-muted/50 border p-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground text-xs">What gets imported:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Up to 50 most recently accepted solutions</li>
                  <li>Difficulty, topic tags, and problem links</li>
                  <li>Auto-scheduled for spaced repetition</li>
                  <li>Duplicates are skipped automatically</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  onClick={handleConnect}
                  disabled={!username.trim()}
                  className="flex-1"
                >
                  Import & Sync
                </Button>
                <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                  Skip for now
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "syncing" && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-orange-500 fill-current">
                  <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
                </svg>
              </div>
              <RefreshCw className="w-4 h-4 text-orange-500 animate-spin absolute -bottom-1 -right-1" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold">Syncing your problems…</p>
              <p className="text-sm text-muted-foreground">
                Fetching accepted solutions from LeetCode
              </p>
            </div>
          </div>
        )}

        {step === "done" && syncResult && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Sync Complete!
              </DialogTitle>
              <DialogDescription>
                Your LeetCode problems have been imported and scheduled for review.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-green-500/5 p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{syncResult.imported}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Imported</div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 text-center">
                  <div className="text-2xl font-bold">{syncResult.skipped}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Already had</div>
                </div>
                <div className="rounded-lg border bg-blue-500/5 p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{syncResult.totalFound}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Found</div>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 border p-3 text-sm text-muted-foreground space-y-1">
                <p>✅ Problems scheduled using spaced repetition</p>
                <p>🔍 Weak patterns will surface for review first</p>
                <p>🔄 Re-sync anytime from Settings → LeetCode</p>
              </div>

              <Button onClick={() => onOpenChange(false)} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
