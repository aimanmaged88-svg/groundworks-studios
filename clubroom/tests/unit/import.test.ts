import { describe, expect, it } from "vitest";
import { autoMap, buildRow, parseBool, parseCsv, parseDate, splitName } from "@/lib/import";

describe("autoMap", () => {
  it("maps the prototype's export headers without help", () => {
    const headers = ["Player name", "Age", "Date of birth", "Gender", "Uniform size", "School", "Experience", "Parent name", "Relationship", "Parent mobile", "Parent email", "Emergency contact", "Emergency phone", "Medical", "Ambulance cover", "Consent - medical", "Consent - conduct", "Consent - photos", "Notes", "How did you hear", "Registered"];
    const m = autoMap(headers);
    expect(m).toMatchObject({
      player_full_name: "Player name",
      dob: "Date of birth",
      gender: "Gender",
      uniform_size: "Uniform size",
      school: "School",
      experience: "Experience",
      guardian_full_name: "Parent name",
      relationship: "Relationship",
      guardian_mobile: "Parent mobile",
      guardian_email: "Parent email",
      emergency_name: "Emergency contact",
      emergency_phone: "Emergency phone",
      medical: "Medical",
      ambulance_cover: "Ambulance cover",
      consent_medical: "Consent - medical",
      consent_conduct: "Consent - conduct",
      consent_photos: "Consent - photos",
      notes: "Notes",
      heard_via: "How did you hear",
      submitted_at: "Registered",
    });
    expect(m.player_first_name).toBeUndefined();
    expect(Object.values(m)).not.toContain("Age");
  });
  it("prefers first/last columns when they exist and never reuses a header", () => {
    const m = autoMap(["First name", "Last name", "DOB", "Email"]);
    expect(m).toMatchObject({ player_first_name: "First name", player_last_name: "Last name", dob: "DOB", guardian_email: "Email" });
    expect(m.player_full_name).toBeUndefined();
  });
});

describe("parseDate", () => {
  it("reads the formats clubs actually use", () => {
    expect(parseDate("2013-05-04")).toBe("2013-05-04");
    expect(parseDate("04/05/2013")).toBe("2013-05-04"); // day/month/year, Australian
    expect(parseDate("4/5/13")).toBe("2013-05-04");
    expect(parseDate("4 May 2013")).toBe("2013-05-04");
    expect(parseDate("4th May 2013")).toBe("2013-05-04");
    expect(parseDate("May 4, 2013")).toBe("2013-05-04");
    expect(parseDate(41398)).toBe("2013-05-04"); // Excel serial
    expect(parseDate(new Date(Date.UTC(2013, 4, 4)))).toBe("2013-05-04");
    expect(parseDate("2013-05-04T10:00:00Z")).toBe("2013-05-04");
  });
  it("refuses nonsense", () => {
    expect(parseDate("")).toBeNull();
    expect(parseDate("31/02/2013")).toBeNull();
    expect(parseDate("soon")).toBeNull();
    expect(parseDate(12)).toBeNull();
  });
});

describe("parseBool and splitName", () => {
  it("reads consent cells", () => {
    expect(parseBool("Yes")).toBe(true);
    expect(parseBool("y")).toBe(true);
    expect(parseBool(1)).toBe(true);
    expect(parseBool("No")).toBe(false);
    expect(parseBool("")).toBeNull();
    expect(parseBool("maybe")).toBeNull();
  });
  it("splits names on the last space", () => {
    expect(splitName("Mary Anne Smith")).toEqual({ first: "Mary Anne", last: "Smith" });
    expect(splitName("Cher")).toEqual({ first: "Cher", last: "" });
    expect(splitName("  ")).toEqual({ first: "", last: "" });
  });
});

describe("buildRow", () => {
  const mapping = autoMap(["Player name", "Date of birth", "Parent name", "Parent email", "Medical", "Consent - photos", "Registered"]);
  it("builds the registration payload and keeps the consent provenance", () => {
    const r = buildRow({ "Player name": "Sam Synthetic", "Date of birth": "9/3/2015", "Parent name": "Jo Synthetic", "Parent email": "JO@X.EXAMPLE", Medical: "None", "Consent - photos": "Yes", Registered: "2026-09-20T03:00:00Z" }, mapping, 1, "members.xlsx");
    expect(r.problems).toEqual([]);
    expect(r.payload.player).toMatchObject({ first_name: "Sam", last_name: "Synthetic", dob: "2015-03-09" });
    expect(r.payload.guardian).toMatchObject({ first_name: "Jo", last_name: "Synthetic", email: "jo@x.example" });
    expect(r.payload.consents).toEqual([{ key: "photos", granted: true, text_shown: 'Imported from members.xlsx, column "Consent - photos"' }]);
    expect(r.payload.submitted_at).toBe("2026-09-20T03:00:00.000Z");
  });
  it("reports missing and unreadable values", () => {
    const r = buildRow({ "Player name": "", "Date of birth": "soon" }, mapping, 2, "x.csv");
    expect(r.problems).toEqual(["no player name", 'unreadable date of birth "soon"', "no date of birth"]);
  });
});

describe("parseCsv", () => {
  it("handles quotes, escaped quotes and CRLF", () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
    ]);
  });
});
