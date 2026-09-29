import { describe, expect, it } from "vitest";
import cases from "../fixtures/age-cases.json";
import { ageAt, ageGroupFor, divisionsFromDefaults, describeDivision, type AgeRuleMode } from "@/lib/age-rule";

describe("ageAt", () => {
  it("counts whole years, birthday on the day counts", () => {
    expect(ageAt("2014-12-31", "2026-12-31")).toBe(12);
    expect(ageAt("2015-01-01", "2026-12-31")).toBe(11);
    expect(ageAt("2012-02-29", "2026-02-28")).toBe(13);
    expect(ageAt("2012-02-29", "2026-03-01")).toBe(14);
  });
});

describe("ageGroupFor (shared fixture)", () => {
  for (const rule of cases.rules) {
    for (const c of rule.cases) {
      it(`${rule.name}: born ${c.dob} → ${c.expect ?? "none"}`, () => {
        expect(ageGroupFor(c.dob, { age_rule_mode: rule.mode as AgeRuleMode, age_cutoff_date: rule.cutoff }, rule.divisions)).toBe(c.expect);
      });
    }
  }
  it("returns null without a date of birth", () => {
    expect(ageGroupFor(null, { age_rule_mode: "birth_year" }, cases.rules[2].divisions)).toBeNull();
  });
});

describe("divisionsFromDefaults", () => {
  const defaults = [
    { name: "U10", max_age: 9 },
    { name: "U12", min_age: 10, max_age: 11 },
  ];
  it("keeps ages for age_at_date", () => {
    expect(divisionsFromDefaults(defaults, "age_at_date", 2026)).toEqual([
      { name: "U10", sort: 1, min_age: null, max_age: 9 },
      { name: "U12", sort: 2, min_age: 10, max_age: 11 },
    ]);
  });
  it("converts to birth years for birth_year", () => {
    expect(divisionsFromDefaults(defaults, "birth_year", 2026)).toEqual([
      { name: "U10", sort: 1, born_from: 2017, born_to: null },
      { name: "U12", sort: 2, born_from: 2015, born_to: 2016 },
    ]);
  });
  it("describes bounds in plain words", () => {
    expect(describeDivision({ name: "U12", sort: 1, min_age: 10, max_age: 11 }, "age_at_date")).toBe("ages 10–11");
    expect(describeDivision({ name: "U10", sort: 1, max_age: 9 }, "age_at_date")).toBe("up to 9");
    expect(describeDivision({ name: "U12", sort: 1, born_from: 2015, born_to: 2016 }, "birth_year")).toBe("born 2015–2016");
    expect(describeDivision({ name: "S", sort: 1, born_to: 2008 }, "birth_year")).toBe("born 2008 or earlier");
  });
});
