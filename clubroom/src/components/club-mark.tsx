import { cn } from "@/lib/utils";

/** Club logo with an initials fallback. `src` is a full URL or null. */
export function ClubMark({ name, src, size = 44, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} className={cn("shrink-0 rounded-full bg-elev2 object-cover", className)} style={{ width: size, height: size }} />;
  }
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full bg-club font-display text-on-club", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-label={name}
    >
      {initials || "C"}
    </span>
  );
}

/** Wraps children in the club's colour tokens. */
export function ClubTheme({ colours, children, className }: { colours: { primary?: string; accent?: string; on_primary?: string } | null | undefined; children: React.ReactNode; className?: string }) {
  const style = colours
    ? ({
        "--club-primary": colours.primary,
        "--club-accent": colours.accent ?? colours.primary,
        "--club-on-primary": colours.on_primary ?? "#0b0c10",
      } as React.CSSProperties)
    : undefined;
  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
