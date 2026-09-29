import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { Division } from "@/lib/age-rule";
import { computeAgeGroup, markDuplicates, type MemberRow } from "@/lib/members";

type Db = SupabaseClient<Database>;

/**
 * Loads every player in the club with their guardian, latest registration,
 * current-season fee and team. Runs as the signed-in user, so RLS decides
 * what comes back. Never touches person_sensitive.
 */
export async function loadMembers(
  supabase: Db,
  clubId: string,
  season: { id: string; age_rule_mode: "birth_year" | "age_at_date"; age_cutoff_date: string | null } | null,
): Promise<{ rows: MemberRow[]; divisions: Division[]; teams: string[] }> {
  const [{ data: people }, { data: gships }, { data: regs }, { data: fees }, { data: tms }, { data: divs }] = await Promise.all([
    supabase.from("people").select("id, first_name, last_name, dob, gender, school, has_medical_flag, photo_consent, archived_at, created_at").eq("club_id", clubId).eq("kind", "player").order("created_at", { ascending: false }),
    supabase.from("guardianships").select("child_person_id, relationship, is_primary, guardian:people!guardianships_guardian_person_id_fkey(id, first_name, last_name, mobile, email)").eq("club_id", clubId),
    supabase.from("registrations").select("id, player_person_id, submitted_at, status, source, uniform_size, experience, heard_via, notes, possible_duplicate, custom").eq("club_id", clubId).order("submitted_at", { ascending: false }),
    season ? supabase.from("fees").select("id, person_id, status, amount_cents").eq("club_id", clubId).eq("season_id", season.id) : Promise.resolve({ data: [] as Array<{ id: string; person_id: string; status: "owing" | "partial" | "paid" | "waived"; amount_cents: number }> }),
    season ? supabase.from("team_members").select("person_id, role, teams!inner(name, season_id)").eq("club_id", clubId).eq("role", "player").eq("teams.season_id", season.id) : Promise.resolve({ data: [] as Array<{ person_id: string; role: string; teams: { name: string; season_id: string } }> }),
    season ? supabase.from("divisions").select("name, sort, gender, born_from, born_to, min_age, max_age").eq("season_id", season.id).order("sort") : Promise.resolve({ data: [] as Division[] }),
  ]);

  const divisions = (divs ?? []) as Division[];
  const rule = season ? { ...season, divisions } : null;
  const guardianByChild = new Map<string, MemberRow["guardian"]>();
  for (const g of gships ?? []) {
    const gp = g.guardian as unknown as { id: string; first_name: string; last_name: string; mobile: string | null; email: string | null } | null;
    if (!gp) continue;
    if (!guardianByChild.has(g.child_person_id) || g.is_primary) guardianByChild.set(g.child_person_id, { ...gp, relationship: g.relationship });
  }
  const regByPlayer = new Map<string, MemberRow["registration"]>();
  for (const r of regs ?? []) {
    if (!regByPlayer.has(r.player_person_id)) {
      regByPlayer.set(r.player_person_id, { ...r, custom: (r.custom ?? {}) as Record<string, string> });
    }
  }
  const feeByPlayer = new Map((fees ?? []).map((f) => [f.person_id, { id: f.id, status: f.status, amount_cents: f.amount_cents }]));
  const teamByPlayer = new Map<string, string>();
  for (const t of tms ?? []) {
    const team = t.teams as unknown as { name: string } | null;
    if (team) teamByPlayer.set(t.person_id, team.name);
  }

  const rows: MemberRow[] = (people ?? []).map((p) => ({
    ...p,
    age_group: computeAgeGroup(p.dob, rule),
    guardian: guardianByChild.get(p.id) ?? null,
    registration: regByPlayer.get(p.id) ?? null,
    fee: feeByPlayer.get(p.id) ?? null,
    team: teamByPlayer.get(p.id) ?? null,
    duplicate_of: null,
  }));
  markDuplicates(rows);
  const teams = [...new Set(rows.map((r) => r.team).filter((t): t is string => !!t))].sort();
  return { rows, divisions, teams };
}
