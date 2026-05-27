import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function LeetCodeIntegration() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState(user?.leetcodeUsername ?? "");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setUsername(user?.leetcodeUsername ?? "");
  }, [user?.leetcodeUsername]);

  const syncStatus = user?.leetcodeSync?.status ?? "idle";
  const statusVariant = useMemo(() => {
    switch (syncStatus) {
      case "success":
        return "default" as const;
      case "partial":
        return "secondary" as const;
      case "failed":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  }, [syncStatus]);

  const onSave = async () => {
    setSaving(true);
    try {
      await api.updateLeetCodeUsername(username);
      await refreshUser();
      toast({ title: "LeetCode username saved" });
    } catch (err: any) {
      toast({
        title: "Failed to save username",
        description: err?.message ?? "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onSync = async () => {
    setSyncing(true);
    try {
      const result = await api.syncLeetCodeProblems();
      await refreshUser();
      toast({
        title: "Sync complete",
        description: `Imported: ${result.imported}, Skipped: ${result.skipped}, Found: ${result.totalFound}`,
      });
    } catch (err: any) {
      toast({
        title: "Sync failed",
        description: err?.message ?? "Try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>LeetCode Integration</CardTitle>
        <CardDescription>
          Link your LeetCode username and import recently accepted problems.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="leetcode-username">LeetCode Username</Label>
          <Input
            id="leetcode-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. your_username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onSave} disabled={saving} data-testid="button-save-leetcode-username">
            {saving ? "Saving..." : "Save Username"}
          </Button>
          <Button
            variant="outline"
            onClick={onSync}
            disabled={syncing || !(user?.leetcodeUsername && user.leetcodeUsername.length > 0)}
            data-testid="button-sync-leetcode"
          >
            {syncing ? "Syncing..." : "Sync Problems"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Last Sync Time</div>
            <div className="text-sm font-medium mt-1">
              {formatDateTime(user?.leetcodeSync?.lastSyncAt)}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Imported Problems</div>
            <div className="text-sm font-medium mt-1">
              {user?.leetcodeSync?.importedProblemsCount ?? 0}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Sync Status</div>
            <div className="text-sm font-medium mt-1 flex items-center gap-2">
              <Badge variant={statusVariant}>{syncStatus}</Badge>
            </div>
          </div>
        </div>

        {user?.leetcodeSync?.lastError && (
          <div className="text-sm text-destructive">
            {user.leetcodeSync.lastError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
