import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "ink";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.06em] rounded-[var(--r-md)] whitespace-nowrap select-none transition-[transform,background-color,border-color,opacity,color] duration-150 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-club text-on-club hover:brightness-110",
  ink: "bg-ink text-bg hover:opacity-90",
  secondary: "bg-elev2 text-ink hover:bg-line-strong",
  outline: "bg-transparent text-ink border border-line-strong hover:border-ink",
  ghost: "bg-transparent text-ink-muted hover:text-ink",
  danger: "bg-transparent text-danger border border-danger/40 hover:bg-danger/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[12px]",
  md: "h-11 px-5 text-[13px]",
  lg: "h-13 px-6 text-[14px]",
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
