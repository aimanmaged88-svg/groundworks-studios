import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  club_name: z.string().trim().min(2).max(80),
  sport_key: z.string().max(40).optional(),
  suburb: z.string().trim().max(80).optional(),
  instagram: z.string().trim().max(60).optional(),
  contact_name: z.string().trim().max(80).optional(),
  email: z.email().optional().or(z.literal("")),
  mobile: z.string().trim().max(30).optional(),
  colours: z.record(z.string(), z.string()).optional(),
  logo_url: z.string().url().max(500).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional(),
  website: z.string().optional(), // honeypot
});

/** "Send me this preview": stores the lead and emails the founder. */
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Check the details." }, { status: 422 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true });
  if (!d.email && !d.mobile) return NextResponse.json({ ok: false, error: "Leave an email or a mobile so we can get back to you." }, { status: 422 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHash("sha256").update(`${ip}|${new Date().toISOString().slice(0, 10)}`).digest("hex").slice(0, 32);
  const admin = createAdminClient();
  const { data: allowed } = await admin.rpc("rate_limit_hit", { p_key: `lead:${ipHash}`, p_limit: 5, p_window: "1 hour" });
  if (allowed === false) return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });

  const { error } = await admin.from("leads").insert({
    club_name: d.club_name,
    sport_key: d.sport_key || null,
    suburb: d.suburb || null,
    instagram: d.instagram?.replace(/^@/, "") || null,
    contact_name: d.contact_name || null,
    email: d.email || null,
    mobile: d.mobile || null,
    colours: d.colours ?? {},
    logo_url: d.logo_url || null,
    message: d.message || null,
    ip_hash: ipHash,
  });
  if (error) return NextResponse.json({ ok: false, error: "Couldn't save that. Try again." }, { status: 500 });

  const to = process.env.LEADS_TO_EMAIL;
  if (to) {
    sendEmail({
      to,
      subject: `Clubroom lead: ${d.club_name}${d.suburb ? ` (${d.suburb})` : ""}`,
      text: `${d.club_name}${d.instagram ? ` · @${d.instagram}` : ""}\n${d.contact_name ?? ""} ${d.email ?? ""} ${d.mobile ?? ""}\n${d.message ?? ""}\nColours: ${JSON.stringify(d.colours ?? {})}\nLogo: ${d.logo_url ?? "uploaded, not stored"}`,
    }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
