/**
 * Age groups from date of birth. Mirrors public.age_group_for() in SQL; the
 * two share tests/fixtures/age-cases.json so they cannot drift.
 */

export type AgeRuleMode = "birth_year" | "age_at_date";

export type Division = {
  name: string;
  sort: number;
  gender?: string | null;
  born_from?: number | null;
  born_to?: number | null;
  min_age?: number | null;
  max_age?: number | null;
};

export type SeasonRule = { age_rule_mode: AgeRuleMode; age_cutoff_date?: string | null };

/** Whole years between a date of birth and a reference date (both YYYY-MM-DD). */
export function ageAt(dob: string, at: string) {
  const [by, bm, bd] = dob.split("-").map(Number);
  const [ay, am, ad] = at.split("-").map(Number);
  let age = ay - by;
  if (am < bm || (am === bm && ad < bd)) age -= 1;
  return age;
}

export function ageGroupFor(dob: string | null | undefined, season: SeasonRule, divisions: Division[]): string | null {
  if (!dob) return null;
  const sorted = [...divisions].sort((a, b) => a.sort - b.sort);
  if (season.age_rule_mode === "birth_year") {
    const year = Number(dob.slice(0, 4));
    return sorted.find((d) => (d.born_from == null || year >= d.born_from) && (d.born_to == null || year <= d.born_to))?.name ?? null;
  }
  if (!season.age_cutoff_date) return null;
  const age = ageAt(dob, season.age_cutoff_date);
  return sorted.find((d) => (d.min_age == null || age >= d.min_age) && (d.max_age == null || age <= d.max_age))?.name ?? null;
}

export type DivisionDefault = { name: string; min_age?: number | null; max_age?: number | null };

/**
 * Turns a sport's default age bands into divisions for a season. For the
 * birth-year mode the bands are converted using the year the season is
 * played in (age as at 31 December of that year).
 */
export function divisionsFromDefaults(defaults: DivisionDefault[], mode: AgeRuleMode, seasonYear: number): Division[] {
  return defaults.map((d, i) => {
    if (mode === "birth_year") {
      return {
        name: d.name,
        sort: i + 1,
        born_from: d.max_age == null ? null : seasonYear - d.max_age,
        born_to: d.min_age == null ? null : seasonYear - d.min_age,
      };
    }
    return { name: d.name, sort: i + 1, min_age: d.min_age ?? null, max_age: d.max_age ?? null };
  });
}

/** Human label for a division's bounds. */
export function describeDivision(d: Division, mode: AgeRuleMode) {
  if (mode === "birth_year") {
    if (d.born_from != null && d.born_to != null) return d.born_from === d.born_to ? `born ${d.born_from}` : `born ${d.born_from}–${d.born_to}`;
    if (d.born_from != null) return `born ${d.born_from} or later`;
    if (d.born_to != null) return `born ${d.born_to} or earlier`;
    return "any year";
  }
  if (d.min_age != null && d.max_age != null) return d.min_age === d.max_age ? `age ${d.min_age}` : `ages ${d.min_age}–${d.max_age}`;
  if (d.min_age != null) return `age ${d.min_age}+`;
  if (d.max_age != null) return `up to ${d.max_age}`;
  return "any age";
}
