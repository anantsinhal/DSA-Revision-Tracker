import { Layout } from "@/components/layout/Layout";
import { PomodoroTimer } from "@/components/settings/PomodoroTimer";
import { ExportImport } from "@/components/settings/ExportImport";
import { LeetCodeIntegration } from "@/components/settings/LeetCodeIntegration";
import { useTheme } from "@/hooks/useTheme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your app preferences and data.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how AlgoRecall looks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                  </div>
                  <Switch 
                    id="dark-mode" 
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </CardContent>
            </Card>

            <ExportImport />

            <LeetCodeIntegration />
          </div>

          <div className="space-y-8">
            <div className="sticky top-6">
              <PomodoroTimer />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
