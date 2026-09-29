import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink, Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/card";
import { ClubMark } from "@/components/club-mark";
import { createHash } from "node:crypto";

export const metadata: Metadata = { title: "You're invited" };

const roleWord: Record<string, string> = { admin: "an admin", coach: "a coach", parent: "a parent", player: "a player" };

async function acceptInvite(token: string) {
  "use server";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) redirect(`/invite/${token}?error=1`);
  const { data: club } = await supabase.from("clubs").select("slug").eq("id", data).single();
  redirect(club ? `/app/${club.slug}` : "/app");
}

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  // Look the invite up with the service role so a signed-out visitor can see who invited them.
  const admin = createAdminClient();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: invite } = await admin
    .from("invites")
    .select("email, role, expires_at, accepted_at, clubs(name, logo_path, colours)")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  const club = invite?.clubs as { name: string; logo_path: string | null } | null;
  const valid = invite && !invite.accepted_at && new Date(invite.expires_at) > new Date();
  const user = await getSessionUser();
  const here = `/invite/${token}`;

  if (!invite || !valid) {
    return (
      <div className="rise">
        <h1 className="display text-[34px] text-ink">This invite has expired</h1>
        <p className="mt-3 text-[14.5px] text-ink-muted">Ask the club admin to send you a new one.</p>
      </div>
    );
  }

  return (
    <div className="rise flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <ClubMark name={club?.name ?? "Club"} src={club?.logo_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/club-logos/${club.logo_path}` : null} size={56} />
        <div>
          <p className="eyebrow">You&rsquo;re invited</p>
          <h1 className="display mt-1 text-[30px] text-ink">{club?.name}</h1>
        </div>
      </div>
      <p className="text-[15px] text-ink-muted">
        You&rsquo;ve been invited to join <b className="text-ink">{club?.name}</b> as {roleWord[invite.role] ?? invite.role}. The invite was sent to <b className="text-ink">{invite.email}</b>.
      </p>
      {error && (
        <Banner tone="danger">
          <span>Something went wrong accepting the invite. Try again, or ask for a new one.</span>
        </Banner>
      )}
      {user ? (
        <form action={acceptInvite.bind(null, token)}>
          <Button type="submit" size="lg" className="w-full">
            Join {club?.name}
          </Button>
          <p className="mt-3 text-center text-[12.5px] text-ink-dim">Signed in as {user.email}</p>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <ButtonLink href={`/sign-up?next=${encodeURIComponent(here)}`} size="lg" className="w-full">
            Create a login to join
          </ButtonLink>
          <ButtonLink href={`/sign-in?next=${encodeURIComponent(here)}`} variant="outline" size="lg" className="w-full">
            I already have a login
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
