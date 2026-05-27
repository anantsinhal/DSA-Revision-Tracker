import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { loadLocalState, saveLocalState, AppState, Problem } from "@/lib/storage";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ExportImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Combine API-stored problems with localStorage data into one backup object
      const problems = await api.fetchProblems();
      const local = loadLocalState();
      const backup: AppState = { problems, ...local };

      const dataStr = JSON.stringify(backup, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const filename = `algorecall-backup-${new Date().toISOString().split("T")[0]}.json`;
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", filename);
      link.click();

      toast({ title: "Backup exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.problems || !Array.isArray(json.problems)) {
          throw new Error("Invalid format: missing problems array");
        }

        // Restore local state (streak, activity, theme, pomodoro)
        if (json.streakData || json.activity || json.theme) {
          saveLocalState({
            activity: json.activity || [],
            streakData: json.streakData || { currentStreak: 0, longestStreak: 0, lastRevisionDate: "" },
            theme: json.theme || "light",
            pomodoroSettings: json.pomodoroSettings || { focusMinutes: 25, breakMinutes: 5 },
          });
        }

        // Delete existing problems then re-create from backup
        const existing = await api.fetchProblems();
        await Promise.all(existing.map((p: Problem) => api.deleteProblem(p.id)));
        await Promise.all(
          (json.problems as Problem[]).map((p) => {
            const { id: _id, ...data } = p;
            return api.createProblem(data);
          })
        );

        toast({
          title: "Data imported successfully",
          description: "Reloading application...",
        });
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast({
          title: "Import failed",
          description: "Invalid backup file format.",
          variant: "destructive",
        });
        setImporting(false);
      }
    };

    reader.onerror = () => {
      toast({ title: "Failed to read file", variant: "destructive" });
      setImporting(false);
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = async () => {
    try {
      // Delete all problems from the backend
      const existing = await api.fetchProblems();
      await Promise.all(existing.map((p: Problem) => api.deleteProblem(p.id)));
      // Clear all local storage keys used by AlgoRecall
      ["algo-recall-local", "algo-recall-state", "algo-recall-seeded"].forEach(
        (key) => localStorage.removeItem(key)
      );
      toast({ title: "Data reset", description: "Reloading application..." });
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast({ title: "Reset failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export your data as a JSON backup or restore a previous export.
            Problems are stored in MongoDB; streaks and settings stay locally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExport} className="flex-1" disabled={exporting} data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Exporting..." : "Export Backup"}
            </Button>

            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              data-testid="input-import-file"
            />
            <Button
              onClick={handleImportClick}
              variant="outline"
              className="flex-1"
              disabled={importing}
              data-testid="button-import"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? "Importing..." : "Import Backup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently deletes all your problems from MongoDB and clears local
            settings. Cannot be undone without a backup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="button-factory-reset">
                Factory Reset Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your saved problems from the
                  database and clear your streak, activity, and settings. This
                  cannot be undone unless you have a backup.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-reset"
                >
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
