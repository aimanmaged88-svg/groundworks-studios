/**
 * Spreadsheet import: column targets, header auto-mapping and value parsing.
 * Pure functions so they can be unit-tested; the routes do the I/O.
 */

export type ImportTarget = {
  key: string;
  label: string;
  group: "player" | "guardian" | "sensitive" | "registration" | "consent" | "meta";
  aliases: string[];
};

export const TARGETS: ImportTarget[] = [
  { key: "player_full_name", label: "Player full name", group: "player", aliases: ["player name", "player", "child name", "child", "name", "full name", "player full name"] },
  { key: "player_first_name", label: "Player first name", group: "player", aliases: ["first name", "player first name", "first", "given name"] },
  { key: "player_last_name", label: "Player last name", group: "player", aliases: ["last name", "player last name", "surname", "family name", "last"] },
  { key: "dob", label: "Date of birth", group: "player", aliases: ["date of birth", "dob", "birth date", "birthdate", "born"] },
  { key: "gender", label: "Gender", group: "player", aliases: ["gender", "sex", "boy/girl"] },
  { key: "school", label: "School", group: "player", aliases: ["school"] },
  { key: "experience", label: "Experience", group: "registration", aliases: ["experience", "basketball experience", "level", "played before"] },
  { key: "uniform_size", label: "Uniform size", group: "registration", aliases: ["uniform size", "uniform", "size", "jersey size", "shirt size"] },
  { key: "guardian_full_name", label: "Parent full name", group: "guardian", aliases: ["parent name", "parent", "guardian name", "guardian", "parent/guardian", "parent or guardian", "contact name"] },
  { key: "guardian_first_name", label: "Parent first name", group: "guardian", aliases: ["parent first name", "guardian first name"] },
  { key: "guardian_last_name", label: "Parent last name", group: "guardian", aliases: ["parent last name", "guardian last name"] },
  { key: "relationship", label: "Relationship", group: "guardian", aliases: ["relationship", "relation"] },
  { key: "guardian_mobile", label: "Parent mobile", group: "guardian", aliases: ["parent mobile", "mobile", "phone", "parent phone", "contact number", "mobile number"] },
  { key: "guardian_email", label: "Parent email", group: "guardian", aliases: ["parent email", "email", "e-mail", "email address"] },
  { key: "emergency_name", label: "Emergency contact", group: "sensitive", aliases: ["emergency contact", "emergency contact name", "emergency name", "emergency"] },
  { key: "emergency_phone", label: "Emergency phone", group: "sensitive", aliases: ["emergency phone", "emergency contact phone", "emergency number", "their phone"] },
  { key: "medical", label: "Medical", group: "sensitive", aliases: ["medical", "medical conditions", "conditions", "allergies", "medical notes", "conditions, allergies or medication"] },
  { key: "ambulance_cover", label: "Ambulance cover", group: "sensitive", aliases: ["ambulance cover", "ambulance"] },
  { key: "notes", label: "Notes", group: "registration", aliases: ["notes", "anything else", "comments", "other"] },
  { key: "heard_via", label: "How they heard", group: "registration", aliases: ["how did you hear", "heard via", "how they heard", "source", "referral"] },
  { key: "consent_medical", label: "Consent: medical", group: "consent", aliases: ["consent - medical", "medical consent", "consent medical"] },
  { key: "consent_conduct", label: "Consent: conduct", group: "consent", aliases: ["consent - conduct", "code of conduct", "conduct consent", "consent conduct"] },
  { key: "consent_photos", label: "Consent: photos", group: "consent", aliases: ["consent - photos", "photo consent", "photos", "consent photos", "photo"] },
  { key: "submitted_at", label: "Registered on", group: "meta", aliases: ["registered", "submitted", "submitted at", "date registered", "created", "timestamp", "date"] },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-z0-9/ ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Best-guess mapping from spreadsheet headers to targets. Exact alias matches win; each header is used once. */
export function autoMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const used = new Set<string>();
  const normalised = headers.map((h) => ({ h, n: norm(h) }));
  // exact alias matches first, in target order
  for (const t of TARGETS) {
    const hit = normalised.find(({ h, n }) => !used.has(h) && t.aliases.includes(n));
    if (hit) {
      map[t.key] = hit.h;
      used.add(hit.h);
    }
  }
  // then loose "contains" matches for anything still unmapped
  for (const t of TARGETS) {
    if (map[t.key]) continue;
    const hit = normalised.find(({ h, n }) => !used.has(h) && t.aliases.some((a) => a.length > 4 && n.includes(a)));
    if (hit) {
      map[t.key] = hit.h;
      used.add(hit.h);
    }
  }
  return map;
}

export function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };

/**
 * Turns a date-ish cell into YYYY-MM-DD. Handles ISO, Australian d/m/y,
 * "4 May 2013", Excel serial numbers and JS Dates. Two-digit years are
 * read as 19xx/20xx by nearness. Returns null when it can't be sure.
 */
export function parseDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : toIso(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  if (typeof value === "number") {
    // Excel serial (days since 1899-12-30)
    if (value > 20000 && value < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
      return toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    }
    return null;
  }
  const s = String(value).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s);
  if (m) return toIso(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(s);
  if (m) {
    const y = +m[3] < 100 ? (+m[3] > 30 ? 1900 + +m[3] : 2000 + +m[3]) : +m[3];
    return toIso(y, +m[2], +m[1]); // Australian day/month/year
  }
  m = /^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{2,4})$/i.exec(s);
  if (m) {
    const mo = MONTHS[m[2].slice(0, 4).toLowerCase()] ?? MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (!mo) return null;
    const y = +m[3] < 100 ? (+m[3] > 30 ? 1900 + +m[3] : 2000 + +m[3]) : +m[3];
    return toIso(y, mo, +m[1]);
  }
  m = /^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i.exec(s);
  if (m) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (!mo) return null;
    return toIso(+m[3], mo, +m[2]);
  }
  return null;
}

function toIso(y: number, mo: number, d: number) {
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Timestamp cell to ISO string, or null. */
export function parseTimestamp(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  const s = String(value).trim();
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString();
  const d = parseDate(s);
  return d ? `${d}T00:00:00.000Z` : null;
}

export function parseBool(value: unknown): boolean | null {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return value;
  const s = String(value).trim().toLowerCase();
  if (["yes", "y", "true", "1", "x", "✓", "ticked", "agree", "agreed", "consent"].includes(s)) return true;
  if (["no", "n", "false", "0", "unticked", "declined"].includes(s)) return false;
  return null;
}

export type ImportRow = Record<string, unknown>;

export type BuiltRow = {
  index: number;
  payload: {
    player: { first_name: string; last_name: string; dob: string | null; gender?: string; school?: string };
    guardian: { first_name: string; last_name: string; email?: string; mobile?: string; relationship?: string };
    sensitive: { medical?: string; ambulance_cover?: string; emergency_name?: string; emergency_phone?: string };
    registration: { uniform_size?: string; experience?: string; heard_via?: string; notes?: string };
    consents: Array<{ key: string; granted: boolean; text_shown: string }>;
    submitted_at?: string;
  };
  problems: string[];
};

const str = (v: unknown) => (v == null ? "" : String(v).trim());

/** Applies a mapping to one spreadsheet row and reports what is missing or unreadable. */
export function buildRow(row: ImportRow, mapping: Record<string, string>, index: number, fileLabel: string): BuiltRow {
  const get = (key: string) => (mapping[key] ? row[mapping[key]] : undefined);
  const problems: string[] = [];

  let first = str(get("player_first_name"));
  let last = str(get("player_last_name"));
  if (!first && get("player_full_name") != null) ({ first, last } = splitName(str(get("player_full_name"))));
  if (!first) problems.push("no player name");

  const dobRaw = get("dob");
  const dob = parseDate(dobRaw);
  if (dobRaw != null && str(dobRaw) !== "" && !dob) problems.push(`unreadable date of birth "${str(dobRaw)}"`);
  if (!dob) problems.push("no date of birth");

  let gFirst = str(get("guardian_first_name"));
  let gLast = str(get("guardian_last_name"));
  if (!gFirst && get("guardian_full_name") != null) ({ first: gFirst, last: gLast } = splitName(str(get("guardian_full_name"))));

  const consents: BuiltRow["payload"]["consents"] = [];
  for (const key of ["medical", "conduct", "photos"] as const) {
    const v = get(`consent_${key}`);
    const b = parseBool(v);
    if (b != null) consents.push({ key, granted: b, text_shown: `Imported from ${fileLabel}, column "${mapping[`consent_${key}`]}"` });
  }

  const submitted = parseTimestamp(get("submitted_at"));

  return {
    index,
    problems,
    payload: {
      player: { first_name: first, last_name: last, dob, gender: str(get("gender")) || undefined, school: str(get("school")) || undefined },
      guardian: { first_name: gFirst, last_name: gLast, email: str(get("guardian_email")).toLowerCase() || undefined, mobile: str(get("guardian_mobile")) || undefined, relationship: str(get("relationship")) || undefined },
      sensitive: { medical: str(get("medical")) || undefined, ambulance_cover: str(get("ambulance_cover")) || undefined, emergency_name: str(get("emergency_name")) || undefined, emergency_phone: str(get("emergency_phone")) || undefined },
      registration: { uniform_size: str(get("uniform_size")) || undefined, experience: str(get("experience")) || undefined, heard_via: str(get("heard_via")) || undefined, notes: str(get("notes")) || undefined },
      consents,
      submitted_at: submitted ?? undefined,
    },
  };
}

/** Minimal CSV parser (RFC 4180-ish: quotes, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ""));
}
