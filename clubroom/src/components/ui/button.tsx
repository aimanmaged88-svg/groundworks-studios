import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--r-pill)] whitespace-nowrap select-none transition-[transform,background-color,border-color,opacity] duration-200 [transition-timing-function:var(--ease-spring)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-club text-on-club shadow-[0_14px_34px_-14px_color-mix(in_oklab,var(--club-primary)_70%,transparent)] hover:brightness-105",
  secondary: "bg-elev2 text-ink border border-line-strong hover:border-ink-dim",
  outline: "bg-transparent text-ink border border-line-strong hover:bg-elev2",
  ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-elev2",
  danger: "bg-danger/12 text-danger border border-danger/30 hover:bg-danger/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-13 px-6 text-[15px] tracking-[0.02em] uppercase",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, icon, children, disabled, ...props },
  ref,
) {
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? <LoaderCircle className="size-4 animate-[spin_0.8s_linear_infinite]" /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  className,
  variant = "primary",
  size = "md",
  icon,
  children,
  ...props
}: {
  href: string;
  className?: string;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children: ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}
