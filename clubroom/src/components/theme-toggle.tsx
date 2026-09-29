"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore, useTransition } from "react";
import { setTheme } from "@/app/actions/theme";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

// The <html data-theme> attribute is the source of truth; watch it so every
// toggle on the page agrees.
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const read = () => ((document.documentElement.dataset.theme as Theme) || "dark") as Theme;
const readServer = () => "dark" as Theme;

export function ThemeToggle({ className, label }: { className?: string; label?: boolean }) {
  const theme = useSyncExternalStore(subscribe, read, readServer);
  const [, start] = useTransition();
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        start(() => setTheme(next));
      }}
      className={cn("inline-flex h-9 items-center gap-2 rounded-[var(--r-md)] bg-elev2 px-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-muted transition-colors hover:text-ink", className)}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {label && (theme === "dark" ? "Light" : "Dark")}
    </button>
  );
}
