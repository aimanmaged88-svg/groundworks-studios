import { describe, expect, it } from "vitest";
import { applyFilters, describeFilters, EMPTY_FILTERS, genderBucket, markDuplicates, sortRows, type MemberRow } from "@/lib/members";

const row = (over: Partial<MemberRow> & { id: string }): MemberRow => ({
  first_name: "Kid",
  last_name: "One",
  dob: "2014-01-01",
  age_group: "U12",
  gender: "Boy",
  school: null,
  has_medical_flag: false,
  photo_consent: true,
  archived_at: null,
  created_at: "2026-09-01T00:00:00Z",
  guardian: { id: "g", first_name: "Pat", last_name: "One", mobile: "0400", email: "pat@x.example", relationship: "Mother" },
  registration: { id: "r", submitted_at: "2026-09-02T00:00:00Z", status: "new", source: "public_form", uniform_size: "Youth M", experience: "Brand new", heard_via: "Instagram", notes: null, possible_duplicate: false, custom: {} },
  fee: { id: "f", status: "owing", amount_cents: 15000 },
  team: null,
  duplicate_of: null,
  ...over,
});

describe("genderBucket", () => {
  it("normalises the usual answers", () => {
    expect(genderBucket("Boy")).toBe("boy");
    expect(genderBucket("male")).toBe("boy");
    expect(genderBucket("Girl")).toBe("girl");
    expect(genderBucket("F")).toBe("girl");
    expect(genderBucket("Non-binary")).toBe("other");
    expect(genderBucket(null)).toBe("unknown");
  });
});

describe("markDuplicates", () => {
  it("flags later rows that share a name and date of birth, case-insensitively", () => {
    const rows = markDuplicates([row({ id: "a" }), row({ id: "b", first_name: "kid", last_name: "ONE" }), row({ id: "c", dob: "2015-01-01" }), row({ id: "d", dob: null })]);
    expect(rows.map((r) => r.duplicate_of)).toEqual([null, "a", null, null]);
  });
});

describe("applyFilters", () => {
  const rows = [
    row({ id: "a" }),
    row({ id: "b", gender: "Girl", has_medical_flag: true, photo_consent: false, age_group: "U14", fee: { id: "f2", status: "paid", amount_cents: 1 } }),
    row({ id: "c", archived_at: "2026-09-03T00:00:00Z" }),
  ];
  it("hides archived rows unless asked", () => {
    expect(applyFilters(rows, EMPTY_FILTERS).map((r) => r.id)).toEqual(["a", "b"]);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, archived: true }).map((r) => r.id)).toEqual(["c"]);
  });
  it("searches across the visible fields", () => {
    expect(applyFilters(rows, { ...EMPTY_FILTERS, q: "pat@x" }).length).toBe(2);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, q: "youth m" }).length).toBe(2);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, q: "nothing" }).length).toBe(0);
  });
  it("filters on each answer", () => {
    expect(applyFilters(rows, { ...EMPTY_FILTERS, gender: "girl" }).map((r) => r.id)).toEqual(["b"]);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, age_group: "U14" }).map((r) => r.id)).toEqual(["b"]);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, medical: "yes" }).map((r) => r.id)).toEqual(["b"]);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, photo: "no" }).map((r) => r.id)).toEqual(["b"]);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, fee: "paid" }).map((r) => r.id)).toEqual(["b"]);
    expect(applyFilters(rows, { ...EMPTY_FILTERS, experience: "Brand new" }).length).toBe(2);
  });
});

describe("sortRows", () => {
  it("sorts by name both ways and by fee status", () => {
    const rows = [row({ id: "a", last_name: "Zed" }), row({ id: "b", last_name: "Abel" })];
    expect(sortRows(rows, "name", 1).map((r) => r.id)).toEqual(["b", "a"]);
    expect(sortRows(rows, "name", -1).map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("describeFilters", () => {
  it("writes the filters out for the audit log", () => {
    expect(describeFilters(EMPTY_FILTERS)).toBe("no filters");
    expect(describeFilters({ ...EMPTY_FILTERS, q: "sam", gender: "girl", medical: "yes" })).toBe('search "sam", gender girl, medical yes');
  });
});
