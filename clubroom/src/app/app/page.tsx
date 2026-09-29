import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getMyClubs, requireUser } from "@/lib/auth";
import { ClubMark } from "@/components/club-mark";
import { Chip } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { logoUrl } from "@/lib/storage";

/** Lands a signed-in user in the right club. */
export default async function AppIndex() {
  await requireUser("/app");
  const clubs = await getMyClubs();
  if (clubs.length === 0) redirect("/start");
  if (clubs.length === 1) redirect(clubs[0].status === "onboarding" ? "/start" : `/app/${clubs[0].slug}`);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-12">
      <div>
        <p className="eyebrow">Your clubs</p>
        <h1 className="display mt-2 text-[34px] text-ink">Pick a club</h1>
      </div>
      <ul className="flex flex-col gap-2.5">
        {clubs.map((c) => (
          <li key={c.club_id}>
            <Link href={c.status === "onboarding" ? "/start" : `/app/${c.slug}`} className="flex items-center gap-3.5 rounded-[var(--r-md)] border border-line bg-elev p-3.5 transition-colors hover:border-line-strong">
              <ClubMark name={c.name} src={logoUrl(c.logo_path)} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">{c.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.roles.map((r) => (
                    <Chip key={r} tone="muted">
                      {r}
                    </Chip>
                  ))}
                  {c.is_demo && <Chip tone="warn">Demo</Chip>}
                </div>
              </div>
              <ChevronRight className="size-4 text-ink-dim" />
            </Link>
          </li>
        ))}
      </ul>
      <ButtonLink href="/start" variant="outline">
        Start another club
      </ButtonLink>
    </main>
  );
}
