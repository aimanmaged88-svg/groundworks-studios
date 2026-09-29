import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { subscriptionAllowsUse } from "@/lib/plans";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Plan limits, checked wherever a player is created (public form, admin
 * add, import). Uses the service role because the caller may be anon.
 */
export async function checkClubCanAddPlayers(admin: SupabaseClient<Database>, clubId: string, adding = 1): Promise<{ ok: true } | { ok: false; reason: "paused" | "limit"; limit?: number }> {
  const [{ data: sub }, { count }] = await Promise.all([
    admin.from("subscriptions").select("status, trial_ends_at, member_limit").eq("club_id", clubId).maybeSingle(),
    admin.from("people").select("id", { count: "exact", head: true }).eq("club_id", clubId).eq("kind", "player").is("archived_at", null),
  ]);
  if (!subscriptionAllowsUse(sub)) return { ok: false, reason: "paused" };
  const limit = sub?.member_limit ?? 400;
  if ((count ?? 0) + adding > limit) return { ok: false, reason: "limit", limit };
  return { ok: true };
}
