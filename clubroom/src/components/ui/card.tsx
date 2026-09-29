import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  return <Tag className={cn("rounded-[var(--r-lg)] border border-line bg-elev shadow-card", className)}>{children}</Tag>;
}

export function CardHeader({ title, sub, action, className }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div>
        <h3 className="text-[15px] font-bold tracking-tight text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-[12.5px] text-ink-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  value,
  label,
  tone = "default",
  active,
  onClick,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  tone?: "default" | "club" | "ok" | "warn" | "danger" | "info";
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const toneClass = {
    default: "text-ink",
    club: "text-club",
    ok: "text-ok",
    warn: "text-warn",
    danger: "text-danger",
    info: "text-info",
  }[tone];
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col items-start gap-1 rounded-[var(--r-md)] border bg-elev px-4 py-3.5 text-left transition-[border-color,transform] duration-200 [transition-timing-function:var(--ease-spring)]",
        onClick && "cursor-pointer hover:border-line-strong active:scale-[0.98]",
        active ? "border-club" : "border-line",
        className,
      )}
    >
      <span className={cn("numeral text-[26px]", toneClass)}>{value}</span>
      <span className="eyebrow">{label}</span>
    </Tag>
  );
}

export function Chip({ children, tone = "default", className }: { children: ReactNode; tone?: "default" | "club" | "ok" | "warn" | "danger" | "info" | "muted"; className?: string }) {
  const tones = {
    default: "bg-elev2 text-ink border-line",
    muted: "bg-transparent text-ink-dim border-line",
    club: "bg-club/15 text-club border-club/30",
    ok: "bg-ok/12 text-ok border-ok/30",
    warn: "bg-warn/14 text-warn border-warn/30",
    danger: "bg-danger/12 text-danger border-danger/30",
    info: "bg-info/12 text-info border-info/30",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-[var(--r-pill)] border px-2.5 py-0.5 text-[11.5px] font-bold tracking-[0.02em]", tones, className)}>{children}</span>;
}

export function Banner({ children, tone = "info", icon, className }: { children: ReactNode; tone?: "info" | "warn" | "danger" | "ok" | "club"; icon?: ReactNode; className?: string }) {
  const tones = {
    info: "border-info/30 bg-info/10 text-ink",
    warn: "border-warn/35 bg-warn/12 text-ink",
    danger: "border-danger/35 bg-danger/10 text-ink",
    ok: "border-ok/30 bg-ok/10 text-ink",
    club: "border-club/35 bg-club/12 text-ink",
  }[tone];
  return (
    <div className={cn("flex items-start gap-3 rounded-[var(--r-md)] border px-4 py-3.5 text-[13.5px] leading-relaxed", tones, className)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({ title, text, action, icon }: { title: ReactNode; text?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="grid size-12 place-items-center rounded-full bg-elev2 text-ink-muted">{icon}</div>}
      <p className="text-[15px] font-bold text-ink">{title}</p>
      {text && <p className="max-w-sm text-[13.5px] text-ink-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block size-5 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-line-strong border-t-club", className)} />;
}
