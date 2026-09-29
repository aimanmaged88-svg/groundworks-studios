import { ageGroupFor, type Division, type SeasonRule } from "@/lib/age-rule";

/** One player as the members table sees them. Sensitive details are never in here. */
export type MemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  dob: string | null;
  age_group: string | null;
  gender: string | null;
  school: string | null;
  has_medical_flag: boolean;
  photo_consent: boolean | null;
  archived_at: string | null;
  created_at: string;
  guardian: { id: string; first_name: string; last_name: string; mobile: string | null; email: string | null; relationship: string | null } | null;
  registration: {
    id: string;
    submitted_at: string;
    status: "new" | "reviewed" | "placed" | "withdrawn";
    source: "public_form" | "admin" | "import";
    uniform_size: string | null;
    experience: string | null;
    heard_via: string | null;
    notes: string | null;
    possible_duplicate: boolean;
    custom: Record<string, string>;
  } | null;
  fee: { id: string; status: "owing" | "partial" | "paid" | "waived"; amount_cents: number } | null;
  team: string | null;
  duplicate_of: string | null; // another row with the same name + DOB
};

export type MemberFilters = {
  q: string;
  gender: string;
  age_group: string;
  experience: string;
  heard_via: string;
  photo: "" | "yes" | "no";
  medical: "" | "yes" | "no";
  fee: string;
  status: string;
  team: string;
  archived: boolean;
};

export const EMPTY_FILTERS: MemberFilters = { q: "", gender: "", age_group: "", experience: "", heard_via: "", photo: "", medical: "", fee: "", status: "", team: "", archived: false };

export type SortKey = "name" | "age_group" | "dob" | "gender" | "school" | "guardian" | "fee" | "submitted_at" | "team";

export function fullName(p: { first_name: string; last_name: string }) {
  return `${p.first_name} ${p.last_name}`.trim();
}

export function genderBucket(g: string | null | undefined): "boy" | "girl" | "other" | "unknown" {
  const v = (g ?? "").toLowerCase();
  if (!v) return "unknown";
  if (/^(boy|male|m|man)$/.test(v)) return "boy";
  if (/^(girl|female|f|woman)$/.test(v)) return "girl";
  return "other";
}

export function markDuplicates(rows: MemberRow[]) {
  const seen = new Map<string, string>();
  for (const r of rows) {
    if (!r.dob) continue;
    const key = `${r.first_name.trim().toLowerCase()}|${r.last_name.trim().toLowerCase()}|${r.dob}`;
    const first = seen.get(key);
    if (first) r.duplicate_of = first;
    else seen.set(key, r.id);
  }
  return rows;
}

export function applyFilters(rows: MemberRow[], f: MemberFilters) {
  const q = f.q.trim().toLowerCase();
  return rows.filter((r) => {
    if (!f.archived && r.archived_at) return false;
    if (f.archived && !r.archived_at) return false;
    if (q) {
      const hay = [fullName(r), r.school, r.gender, r.age_group, r.guardian && fullName(r.guardian), r.guardian?.mobile, r.guardian?.email, r.registration?.uniform_size, r.registration?.experience, r.registration?.heard_via, r.registration?.notes, r.team]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.gender && genderBucket(r.gender) !== f.gender) return false;
    if (f.age_group && (r.age_group ?? "none") !== f.age_group) return false;
    if (f.experience && (r.registration?.experience ?? "") !== f.experience) return false;
    if (f.heard_via && (r.registration?.heard_via ?? "") !== f.heard_via) return false;
    if (f.photo === "yes" && r.photo_consent !== true) return false;
    if (f.photo === "no" && r.photo_consent === true) return false;
    if (f.medical === "yes" && !r.has_medical_flag) return false;
    if (f.medical === "no" && r.has_medical_flag) return false;
    if (f.fee && (r.fee?.status ?? "none") !== f.fee) return false;
    if (f.status && (r.registration?.status ?? "none") !== f.status) return false;
    if (f.team && (r.team ?? "none") !== f.team) return false;
    return true;
  });
}

export function sortRows(rows: MemberRow[], key: SortKey, dir: 1 | -1) {
  const val = (r: MemberRow): string | number => {
    switch (key) {
      case "name":
        return `${r.last_name} ${r.first_name}`.toLowerCase();
      case "age_group":
        return r.age_group ?? "zzz";
      case "dob":
        return r.dob ?? "";
      case "gender":
        return r.gender ?? "";
      case "school":
        return (r.school ?? "").toLowerCase();
      case "guardian":
        return r.guardian ? fullName(r.guardian).toLowerCase() : "";
      case "fee":
        return r.fee?.status ?? "";
      case "team":
        return r.team ?? "zzz";
      case "submitted_at":
        return r.registration?.submitted_at ?? r.created_at;
    }
  };
  return [...rows].sort((a, b) => {
    const x = val(a);
    const y = val(b);
    return x < y ? -dir : x > y ? dir : 0;
  });
}

export function describeFilters(f: MemberFilters) {
  const parts: string[] = [];
  if (f.q) parts.push(`search "${f.q}"`);
  if (f.gender) parts.push(`gender ${f.gender}`);
  if (f.age_group) parts.push(f.age_group);
  if (f.experience) parts.push(f.experience);
  if (f.heard_via) parts.push(`heard via ${f.heard_via}`);
  if (f.photo) parts.push(`photo consent ${f.photo}`);
  if (f.medical) parts.push(`medical ${f.medical}`);
  if (f.fee) parts.push(`fee ${f.fee}`);
  if (f.status) parts.push(`status ${f.status}`);
  if (f.team) parts.push(`team ${f.team}`);
  if (f.archived) parts.push("archived");
  return parts.length ? parts.join(", ") : "no filters";
}

export function computeAgeGroup(dob: string | null, season: (SeasonRule & { divisions: Division[] }) | null) {
  if (!season || !dob) return null;
  return ageGroupFor(dob, season, season.divisions);
}
