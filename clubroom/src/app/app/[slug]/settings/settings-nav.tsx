"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "", label: "Club" },
  { href: "/season", label: "Season" },
  { href: "/form", label: "Registration form" },
  { href: "/people", label: "Admins and coaches" },
  { href: "/billing", label: "Billing" },
];

export function SettingsNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/app/${slug}/settings`;
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      {ITEMS.map((it) => {
        const href = base + it.href;
        const active = it.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link key={it.href} href={href} className={cn("-mb-px shrink-0 border-b-[3px] px-3 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em]", active ? "border-club text-ink" : "border-transparent text-ink-muted hover:text-ink")}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
