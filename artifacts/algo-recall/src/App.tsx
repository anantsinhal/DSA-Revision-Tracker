import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import Problems from "@/pages/Problems";
import AddProblem from "@/pages/AddProblem";
import EditProblem from "@/pages/EditProblem";
import RevisionQueue from "@/pages/RevisionQueue";
import Achievements from "@/pages/Achievements";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";

const queryClient = new QueryClient();

// A simple wrapper for routes that require authentication
function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Signup} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/problems" component={() => <ProtectedRoute component={Problems} />} />
      <Route path="/add" component={() => <ProtectedRoute component={AddProblem} />} />
      <Route path="/edit/:id" component={() => <ProtectedRoute component={EditProblem} />} />
      <Route path="/queue" component={() => <ProtectedRoute component={RevisionQueue} />} />
      <Route path="/achievements" component={() => <ProtectedRoute component={Achievements} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
