import { useEffect, useState } from "react";
import { loadLocalState, saveLocalState } from "@/lib/storage";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const local = loadLocalState();
    setTheme(local.theme);
    if (local.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const local = loadLocalState();
    saveLocalState({ ...local, theme: newTheme });
  };

  return { theme, toggleTheme };
}
