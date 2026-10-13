import { describe, expect, it } from "vitest";
import {
  formatCertDate,
  groupByYear,
  parseCertDate,
  sortByRecency,
} from "./cert-date";

describe("parseCertDate", () => {
  it("reads month names and years", () => {
    expect(parseCertDate("March 2026")).toEqual({ year: 2026, month: 3 });
    expect(parseCertDate("Kas\u0131m 2024")).toEqual({ year: 2024, month: 11 });
    expect(parseCertDate("03/2025")).toEqual({ year: 2025, month: 3 });
  });

  it("keeps a bare year and leaves the month unknown", () => {
    expect(parseCertDate("2024")).toEqual({ year: 2024, month: 0 });
  });

  it("reports unknown for empty or year-less text instead of guessing", () => {
    expect(parseCertDate(undefined)).toEqual({ year: null, month: 0 });
    expect(parseCertDate("")).toEqual({ year: null, month: 0 });
    expect(parseCertDate("Spring")).toEqual({ year: null, month: 0 });
    expect(parseCertDate("Order 12345")).toEqual({ year: null, month: 0 });
  });
});

describe("formatCertDate", () => {
  it("localizes when month and year are known, else returns the text as stored", () => {
    expect(formatCertDate("March 2026", "en")).toBe("March 2026");
    expect(formatCertDate("March 2026", "tr")).toBe("Mart 2026");
    expect(formatCertDate("2024", "tr")).toBe("2024");
    expect(formatCertDate("Spring 2024", "en")).toBe("Spring 2024");
    expect(formatCertDate(undefined, "en")).toBe("");
  });
});

describe("sortByRecency and groupByYear", () => {
  const items = [
    { id: "a", date: "May 2023" },
    { id: "b" },
    { id: "c", date: "March 2026" },
    { id: "d", date: "2024" },
    { id: "e", date: "February 2026" },
    { id: "f", date: "May 2023" },
  ];

  it("orders newest first, stable on ties, undated last", () => {
    expect(sortByRecency(items).map((i) => i.id)).toEqual(["c", "e", "d", "a", "f", "b"]);
  });

  it("groups by year in order and puts undated entries in a final null group", () => {
    const groups = groupByYear(sortByRecency(items));
    expect(groups.map((g) => [g.year, g.items.map((i) => i.id)])).toEqual([
      [2026, ["c", "e"]],
      [2024, ["d"]],
      [2023, ["a", "f"]],
      [null, ["b"]],
    ]);
  });
});
