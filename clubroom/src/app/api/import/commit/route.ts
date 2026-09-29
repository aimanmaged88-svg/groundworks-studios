import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getClubContext } from "@/lib/club";
import { buildRow } from "@/lib/import";
import { checkClubCanAddPlayers } from "@/lib/limits";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  slug: z.string(),
  fileName: z.string().max(200),
  mapping: z.record(z.string(), z.string()),
  rows: z.array(z.record(z.string(), z.unknown())).max(2000),
  skip: z.array(z.number().int()).optional(),
});

/** Writes the rows through submit_registration() with source = import. Admins only; logged. */
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  const { slug, fileName, mapping, rows, skip = [] } = parsed.data;
  const ctx = await getClubContext(slug);
  if (!ctx.isAdmin) return NextResponse.json({ ok: false, error: "Admins only" }, { status: 403 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const skipSet = new Set(skip);
  const limit = await checkClubCanAddPlayers(admin, ctx.club.id, rows.length - skipSet.size);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: limit.reason === "paused" ? "The club is paused until a plan is chosen." : `This import would go past the plan's ${limit.limit} players. Upgrade under Settings → Billing, or import fewer rows.` }, { status: 409 });
  }

  let created = 0;
  let duplicates = 0;
  const errors: Array<{ row: number; error: string }> = [];
  for (let i = 0; i < rows.length; i++) {
    if (skipSet.has(i)) continue;
    const built = buildRow(rows[i], mapping, i, fileName);
    if (built.problems.some((p) => p.startsWith("no player name") || p.startsWith("no date of birth"))) {
      errors.push({ row: i + 2, error: built.problems.join("; ") });
      continue;
    }
    const { data: id, error } = await admin.rpc("submit_registration", { p_club_slug: slug, p_payload: built.payload, p_source: "import" });
    if (error) {
      errors.push({ row: i + 2, error: error.message });
      continue;
    }
    created++;
    const { data: reg } = await admin.from("registrations").select("possible_duplicate").eq("id", id).single();
    if (reg?.possible_duplicate) duplicates++;
  }

  const result = { created, duplicates, skipped: skipSet.size, errors };
  await admin.from("imports").insert({ club_id: ctx.club.id, file_name: fileName, row_count: rows.length, mapping, result, imported_by: user!.id });
  await admin.from("audit_log").insert({ club_id: ctx.club.id, actor_user_id: user!.id, action: "import", target_table: "registrations", detail: { file: fileName, ...result, errors: errors.length } });
  return NextResponse.json({ ok: true, ...result });
}
