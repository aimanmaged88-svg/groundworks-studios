"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom sheet on phones, centred dialog on larger screens.
 */
export function Sheet({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-[2px] animate-[fade-in_0.25s_ease-out_both]" onClick={onClose} />
      <div
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col rounded-t-[var(--r-xl)] border border-line bg-elev shadow-pop animate-[sheet-in_0.35s_var(--ease-out)_both] sm:rounded-[var(--r-xl)]",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-11 rounded-full bg-line-strong sm:hidden" />
        <div className="flex items-start justify-between gap-4 px-5 pt-4 sm:pt-5">
          <div className="min-w-0">
            {title && <h2 className="display text-[22px] text-ink">{title}</h2>}
            {sub && <p className="mt-1 text-[13px] text-ink-muted">{sub}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full bg-elev2 text-ink-muted hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap gap-2.5 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}
