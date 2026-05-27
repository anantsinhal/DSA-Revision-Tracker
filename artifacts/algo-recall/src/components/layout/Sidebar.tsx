import { Link, useLocation } from "wouter";
import { LayoutDashboard, List, PlusCircle, CheckSquare, Trophy, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/problems", label: "Problems", icon: List },
  { href: "/add", label: "Add Problem", icon: PlusCircle },
  { href: "/queue", label: "Queue", icon: CheckSquare },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-2 text-primary">
          <span className="bg-primary text-primary-foreground p-1 rounded">AR</span>
          AlgoRecall
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t flex flex-col gap-2">
        {user && (
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={logout}>
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        )}
        <div className="text-xs text-muted-foreground font-mono text-center mt-2">
          v1.0.0
        </div>
      </div>
    </aside>
  );
}
