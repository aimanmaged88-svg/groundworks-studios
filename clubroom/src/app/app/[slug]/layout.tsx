import { signOut } from "@/app/(auth)/actions";
import { AppShell } from "@/components/app-shell";
import { ClubTheme } from "@/components/club-mark";
import { requireUser } from "@/lib/auth";
import { getClubContext } from "@/lib/club";
import { logoUrl } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysUntil } from "@/lib/utils";

export default async function ClubLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/app/${slug}`);
  const ctx = await getClubContext(slug);
  const trialDaysLeft = ctx.subscription?.status === "trialing" ? daysUntil(ctx.subscription.trial_ends_at) : null;

  // Support access: a platform owner who isn't a member of this club leaves a trace every time they open it.
  if (ctx.isPlatformOwner && ctx.roles.length === 0) {
    const admin = createAdminClient();
    await admin.from("audit_log").insert({ club_id: ctx.club.id, actor_user_id: user.id, impersonated_by: user.id, action: "platform.view_club", target_table: "clubs", target_id: ctx.club.id });
  }

  return (
    <ClubTheme colours={ctx.club.colours} className="min-h-dvh">
      <AppShell
        slug={ctx.club.slug}
        clubName={ctx.club.name}
        shortName={ctx.club.short_name}
        logoUrl={logoUrl(ctx.club.logo_path)}
        isDemo={ctx.club.is_demo}
        isAdmin={ctx.isAdmin}
        trialDaysLeft={ctx.isAdmin ? trialDaysLeft : null}
        userEmail={user.email ?? ""}
        signOut={signOut}
      >
        {children}
      </AppShell>
    </ClubTheme>
  );
}
