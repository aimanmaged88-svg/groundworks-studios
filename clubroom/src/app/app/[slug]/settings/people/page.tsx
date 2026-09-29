import type { Metadata } from "next";
import { getClubContext } from "@/lib/club";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PeopleSettings } from "./people-settings";

export const metadata: Metadata = { title: "Admins and coaches" };

export default async function PeopleSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.from("club_users").select("id, user_id, role, status, created_at").eq("club_id", ctx.club.id).in("role", ["admin", "coach"]).eq("status", "active").order("created_at"),
    supabase.from("invites").select("id, email, role, expires_at, accepted_at, created_at").eq("club_id", ctx.club.id).is("accepted_at", null).order("created_at", { ascending: false }),
  ]);
  // Emails live in auth; look them up with the service role for the admin list only.
  const admin = createAdminClient();
  const emails = new Map<string, string>();
  const names = new Map<string, string>();
  for (const m of members ?? []) {
    const { data } = await admin.auth.admin.getUserById(m.user_id);
    if (data.user?.email) emails.set(m.user_id, data.user.email);
  }
  const { data: profiles } = await admin.from("user_profiles").select("user_id, full_name").in("user_id", (members ?? []).map((m) => m.user_id));
  for (const p of profiles ?? []) if (p.full_name) names.set(p.user_id, p.full_name);

  return (
    <PeopleSettings
      slug={slug}
      me={user!.id}
      members={(members ?? []).map((m) => ({ id: m.id, user_id: m.user_id, role: m.role as "admin" | "coach", email: emails.get(m.user_id) ?? "", name: names.get(m.user_id) ?? "" }))}
      invites={(invites ?? []).map((i) => ({ id: i.id, email: i.email, role: i.role, expires_at: i.expires_at }))}
    />
  );
}
