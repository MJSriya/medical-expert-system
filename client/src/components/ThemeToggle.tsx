import { useEffect, useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function getInitialTheme(): "light" | "dark" {
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  const isDark = useMemo(() => theme === "dark", [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      data-testid="theme-toggle"
      className="
        h-10 rounded-xl px-3
        bg-card/70 hover:bg-card
        border-card-border/70
        shadow-sm hover:shadow-md
        transition-all duration-300
      "
    >
      <span className="sr-only">Toggle theme</span>
      <span className="relative flex items-center gap-2">
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        <span className="hidden sm:block text-sm font-semibold">
          {isDark ? "Dark" : "Light"}
        </span>
      </span>
    </Button>
  );
}
