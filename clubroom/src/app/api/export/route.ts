import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getClubContext } from "@/lib/club";
import { loadMembers } from "@/lib/members-server";
import { describeFilters, EMPTY_FILTERS, fullName, type MemberFilters } from "@/lib/members";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fmtDob } from "@/lib/utils";

const bodySchema = z.object({
  slug: z.string(),
  format: z.enum(["xlsx", "csv"]),
  ids: z.array(z.string().uuid()).max(5000),
  filters: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Exports the members currently in view. Admins only. The rows come through
 * RLS; the sensitive columns are added with the service role after the admin
 * check, and every export is written to the audit log with the filters used.
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  const { slug, format, ids } = parsed.data;
  const filters = { ...EMPTY_FILTERS, ...(parsed.data.filters ?? {}) } as MemberFilters;

  const ctx = await getClubContext(slug);
  if (!ctx.isAdmin) return NextResponse.json({ ok: false, error: "Admins only" }, { status: 403 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { rows: all } = await loadMembers(supabase, ctx.club.id, ctx.season);
  const wanted = new Set(ids);
  const rows = all.filter((r) => wanted.has(r.id));

  const admin = createAdminClient();
  const [{ data: sens }, { data: consents }] = await Promise.all([
    admin.from("person_sensitive").select("person_id, medical, ambulance_cover, emergency_name, emergency_phone, emergency_relationship").in("person_id", rows.map((r) => r.id)),
    supabase.from("consents").select("person_id, consent_key, granted, granted_at").in("person_id", rows.map((r) => r.id)).order("granted_at", { ascending: false }),
  ]);
  const sensBy = new Map((sens ?? []).map((s) => [s.person_id, s]));
  const consentBy = new Map<string, Record<string, boolean>>();
  for (const c of consents ?? []) {
    const m = consentBy.get(c.person_id) ?? {};
    if (!(c.consent_key in m)) m[c.consent_key] = c.granted;
    consentBy.set(c.person_id, m);
  }
  const customKeys = [...new Set(rows.flatMap((r) => Object.keys(r.registration?.custom ?? {})))];

  await admin.from("audit_log").insert({
    club_id: ctx.club.id,
    actor_user_id: user!.id,
    action: "export",
    target_table: "people",
    detail: { format, count: rows.length, filters: describeFilters(filters), includes_sensitive: true },
  });

  const headers = [
    "Player name", "First name", "Last name", "Date of birth", "Age group", "Gender", "School", "Experience", "Uniform size",
    "Parent name", "Relationship", "Parent mobile", "Parent email",
    "Emergency contact", "Emergency phone", "Emergency relationship", "Medical", "Ambulance cover",
    "Consent - medical", "Consent - conduct", "Consent - photos",
    "Notes", "How did you hear", "Fee status", "Team", "Registered", "Status", "Source", "Possible duplicate",
    ...customKeys,
  ];
  const yesNo = (v: boolean | undefined | null) => (v == null ? "" : v ? "Yes" : "No");
  const data = rows.map((r) => {
    const s = sensBy.get(r.id);
    const c = consentBy.get(r.id) ?? {};
    return [
      fullName(r), r.first_name, r.last_name, r.dob ? fmtDob(r.dob) : "", r.age_group ?? "", r.gender ?? "", r.school ?? "", r.registration?.experience ?? "", r.registration?.uniform_size ?? "",
      r.guardian ? fullName(r.guardian) : "", r.guardian?.relationship ?? "", r.guardian?.mobile ?? "", r.guardian?.email ?? "",
      s?.emergency_name ?? "", s?.emergency_phone ?? "", s?.emergency_relationship ?? "", s?.medical ?? "", s?.ambulance_cover ?? "",
      yesNo(c.medical), yesNo(c.conduct), yesNo(c.photos),
      r.registration?.notes ?? "", r.registration?.heard_via ?? "", r.fee?.status ?? "", r.team ?? "",
      r.registration?.submitted_at ? new Date(r.registration.submitted_at).toLocaleString("en-AU", { timeZone: ctx.club.timezone }) : "",
      r.registration?.status ?? "", r.registration?.source ?? "", r.duplicate_of || r.registration?.possible_duplicate ? "Yes" : "",
      ...customKeys.map((k) => r.registration?.custom?.[k] ?? ""),
    ];
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const base = `${ctx.club.slug}-members-${stamp}`;

  if (format === "csv") {
    const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(cell).join(","), ...data.map((row) => row.map(cell).join(","))].join("\r\n");
    return new NextResponse("﻿" + csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${base}.csv"` } });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Clubroom";
  const ws = wb.addWorksheet("Members", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true };
  data.forEach((row) => ws.addRow(row));
  ws.columns.forEach((col) => {
    let width = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      width = Math.max(width, Math.min(48, String(cell.value ?? "").length + 2));
    });
    col.width = width;
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename="${base}.xlsx"` },
  });
}
