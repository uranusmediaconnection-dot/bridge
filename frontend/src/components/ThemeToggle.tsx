"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="theme-toggle-btn"><div className="w-4 h-4" /></div>;
  }

  const current = theme === "system" ? resolvedTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="theme-toggle-btn group"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      data-testid="theme-toggle"
    >
      <Sun
        className={`w-4 h-4 transition-all duration-300 ${
          isDark ? "opacity-0 scale-0 absolute" : "opacity-100 scale-100"
        }`}
      />
      <Moon
        className={`w-4 h-4 transition-all duration-300 ${
          isDark ? "opacity-100 scale-100" : "opacity-0 scale-0 absolute"
        }`}
      />
      <span className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/5 transition-colors duration-200" />
    </button>
  );
}
