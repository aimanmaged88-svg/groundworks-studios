"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { setTheme } from "@/app/actions/theme";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, label }: { className?: string; label?: boolean }) {
  const [theme, setLocal] = useState<Theme>("dark");
  const [, start] = useTransition();
  useEffect(() => {
    setLocal((document.documentElement.dataset.theme as Theme) || "dark");
  }, []);
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        setLocal(next);
        start(() => setTheme(next));
      }}
      className={cn("inline-flex h-9 items-center gap-2 rounded-full border border-line bg-elev2 px-3 text-[12.5px] font-semibold text-ink-muted transition-colors hover:text-ink", className)}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {label && (theme === "dark" ? "Light" : "Dark")}
    </button>
  );
}
