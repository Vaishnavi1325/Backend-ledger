"use client";

import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const toast = useToast();

  function handleToggle() {
    const next = toggleTheme();
    toast.info(
      `Switched to ${next === "dark" ? "Dark" : "Light"} theme.`,
      "Theme Updated"
    );
  }

  // Avoid hydration mismatch by rendering placeholder skeleton or static button
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0 opacity-0"
        aria-hidden="true"
      >
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="h-8 w-8 p-0 text-foreground transition-colors hover:bg-muted"
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      aria-label="Toggle dark/light mode"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
    </Button>
  );
}
