import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getToken, setToken, removeToken, apiFetch } from "../lib/auth";

interface User {
  id: string;
  email: string;
  leetcodeUsername?: string;
  leetcodeSync?: {
    lastSyncAt?: string;
    importedProblemsCount?: number;
    status?: "idle" | "success" | "partial" | "failed";
    lastError?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    const res = await apiFetch("/api/auth/me");
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
    } else {
      removeToken();
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          removeToken();
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
