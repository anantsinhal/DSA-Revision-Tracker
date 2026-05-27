import { Link, useLocation } from "wouter";
import { LayoutDashboard, List, PlusCircle, CheckSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/problems", label: "List", icon: List },
  { href: "/add", label: "Add", icon: PlusCircle },
  { href: "/queue", label: "Queue", icon: CheckSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card flex justify-around p-2 pb-safe z-50">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-md min-w-[64px]",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
