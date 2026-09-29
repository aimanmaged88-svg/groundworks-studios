import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A quiet surface. Use sparingly; most things sit straight on the page with rules. */
export function Card({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  return <Tag className={cn("min-w-0 rounded-[var(--r-lg)] bg-elev", className)}>{children}</Tag>;
}

/** Section heading with the thick rule above it, like a team sheet. */
export function SectionHead({ title, sub, action, number, className }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; number?: string; className?: string }) {
  return (
    <div className={cn("rule-top flex items-end justify-between gap-4 pt-3", className)}>
      <div className="flex items-baseline gap-3">
        {number && <span className="numeral text-[18px] text-club">{number}</span>}
        <div>
          <h3 className="display text-[19px] text-ink">{title}</h3>
          {sub && <p className="mt-1 text-[12.5px] text-ink-muted">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
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

/** One cell of a scoreboard strip (wrap several in <div className="scoreboard">). */
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
      className={cn("flex min-w-0 flex-col items-start gap-1.5 text-left", onClick && "cursor-pointer", className)}
    >
      <span className={cn("numeral text-[38px] md:text-[44px]", toneClass, active && "underline decoration-club decoration-4 underline-offset-8")}>{value}</span>
      <span className="eyebrow">{label}</span>
    </Tag>
  );
}

export function Chip({ children, tone = "default", className }: { children: ReactNode; tone?: "default" | "club" | "ok" | "warn" | "danger" | "info" | "muted"; className?: string }) {
  const tones = {
    default: "bg-elev2 text-ink",
    muted: "bg-transparent text-ink-dim border border-line",
    club: "bg-club text-on-club",
    ok: "bg-ok/15 text-ok",
    warn: "bg-warn/18 text-warn",
    danger: "bg-danger/15 text-danger",
    info: "bg-info/15 text-info",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-[var(--r-sm)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]", tones, className)}>{children}</span>;
}

export function Banner({ children, tone = "info", icon, className }: { children: ReactNode; tone?: "info" | "warn" | "danger" | "ok" | "club"; icon?: ReactNode; className?: string }) {
  const tones = {
    info: "border-info",
    warn: "border-warn",
    danger: "border-danger",
    ok: "border-ok",
    club: "border-club",
  }[tone];
  return (
    <div className={cn("flex items-start gap-3 border-l-4 bg-elev py-3.5 pl-4 pr-4 text-[13.5px] leading-relaxed text-ink", tones, className)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function EmptyState({ title, text, action, icon }: { title: ReactNode; text?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 py-10">
      {icon && <div className="text-ink-dim">{icon}</div>}
      <p className="display text-[20px] text-ink">{title}</p>
      {text && <p className="max-w-sm text-[13.5px] text-ink-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block size-5 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-line-strong border-t-club", className)} />;
}
