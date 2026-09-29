import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getPublicClub, type FormField } from "@/lib/public-club";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Public registration endpoint. Validates against the club's live form,
 * rate-limits by IP, then hands everything to submit_registration() so the
 * write is atomic. Runs with the service role: the browser never gets one.
 */
export async function POST(request: NextRequest) {
  let body: { slug?: string; form_id?: string; values?: Record<string, string>; consents?: Record<string, boolean>; website?: string };
  try {
    body = await request.json();
  } catch {
    return bad("That didn't look like a form submission.");
  }
  // Honeypot
  if (body.website) return NextResponse.json({ ok: true, id: null });
  if (!body.slug) return bad("Missing club.");

  const data = await getPublicClub(body.slug);
  if (!data || !data.form || !data.season?.registration_open) return bad("Registrations are closed.", 409);
  if (body.form_id && body.form_id !== data.form.id) return bad("The form has been updated. Reload the page and try again.", 409);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(`${ip}|${new Date().toISOString().slice(0, 10)}`).digest("hex").slice(0, 32);

  const admin = createAdminClient();
  const { data: allowed } = await admin.rpc("rate_limit_hit", { p_key: `register:${data.club.slug}:${ipHash}`, p_limit: 12, p_window: "15 minutes" });
  if (allowed === false) return bad("Too many submissions from this connection. Try again in a few minutes.", 429);

  // Validate every enabled field against the template
  const values = body.values ?? {};
  const fields = data.form.fields.filter((f) => f.enabled !== false);
  const problems: string[] = [];
  const clean: Record<string, string> = {};
  for (const f of fields) {
    const raw = typeof values[f.key] === "string" ? values[f.key].trim() : "";
    if (!raw) {
      if (f.required) problems.push(`${f.label} is required.`);
      continue;
    }
    const check = validate(f, raw);
    if (check) problems.push(check);
    else clean[f.key] = raw;
  }
  for (const c of data.form.consents) {
    if (c.required && !body.consents?.[c.key]) problems.push(`Please tick "${c.label}".`);
  }
  if (problems.length) return bad(problems.join(" "), 422);

  // Shape the payload the way submit_registration() expects
  const payload: Record<string, Record<string, string>> & { consents?: unknown[] } = { player: {}, guardian: {}, sensitive: {}, registration: {}, custom: {} };
  for (const f of fields) {
    const v = clean[f.key];
    if (v == null) continue;
    const [group, col] = (f.maps_to ?? "").split(".");
    if (group && col && payload[group]) payload[group][col] = v;
    else payload.custom[f.key] = v;
  }
  payload.consents = data.form.consents.map((c) => ({ key: c.key, granted: !!body.consents?.[c.key], text_shown: c.text }));

  const { data: id, error } = await admin.rpc("submit_registration", {
    p_club_slug: data.club.slug,
    p_payload: payload,
    p_ip_hash: ipHash,
    p_user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? undefined,
    p_source: "public_form",
  });
  if (error) {
    console.error("submit_registration failed", error);
    return bad("We couldn't save the registration. Please try again in a moment.", 500);
  }

  // Confirmation email, best effort
  const email = payload.guardian.email;
  if (email) {
    const player = `${payload.player.first_name ?? ""} ${payload.player.last_name ?? ""}`.trim();
    sendEmail({
      to: email,
      subject: `${data.club.name}: registration received for ${player}`,
      text: `Thanks. ${data.club.name} has ${player}'s registration${data.season ? ` for ${data.season.name}` : ""}. The club will confirm the spot by text or email.${
        data.season?.fee_cents ? " Nothing to pay right now; the club will tell you how and when." : ""
      }\n\nRegistration reference: ${id}`,
    }).catch((e) => console.warn("confirmation email failed", e));
  }

  return NextResponse.json({ ok: true, id });
}

function validate(f: FormField, v: string): string | null {
  switch (f.type) {
    case "email":
      return z.email().safeParse(v).success ? null : `${f.label}: enter a valid email.`;
    case "tel":
      return /^[0-9+()\s-]{6,20}$/.test(v) ? null : `${f.label}: enter a valid phone number.`;
    case "date": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) return `${f.label}: enter a valid date.`;
      const year = Number(v.slice(0, 4));
      if (year < 1920 || year > new Date().getFullYear()) return `${f.label}: check the year.`;
      return null;
    }
    case "select":
      return f.options?.includes(v) ? null : `${f.label}: pick one of the options.`;
    case "checkbox":
      return v === "yes" ? null : `${f.label}: unexpected value.`;
    default:
      return v.length <= 2000 ? null : `${f.label}: too long.`;
  }
}

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}
