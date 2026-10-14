import { afterEach, describe, expect, it, vi } from "vitest";
import { isOpenEndedPeriod, sortExperienceByPeriod } from "./period";

describe("isOpenEndedPeriod", () => {
  it("is true only when the text says the period is open", () => {
    expect(isOpenEndedPeriod("2024 \u2013 Present")).toBe(true);
    expect(isOpenEndedPeriod("03/2025 - present")).toBe(true);
    expect(isOpenEndedPeriod("2023 \u2013 G\u00fcn\u00fcm\u00fcz")).toBe(true);
    expect(isOpenEndedPeriod("2023 \u2013 Devam ediyor")).toBe(true);
    expect(isOpenEndedPeriod("2024 \u2013")).toBe(true);
  });

  it("is false for closed ranges, single dates and empty text", () => {
    expect(isOpenEndedPeriod("08/2025 \u2013 10/2025")).toBe(false);
    expect(isOpenEndedPeriod("2021")).toBe(false);
    expect(isOpenEndedPeriod("Presentation 2020")).toBe(false);
    expect(isOpenEndedPeriod("")).toBe(false);
    expect(isOpenEndedPeriod(undefined)).toBe(false);
  });
});

type Job = { id: string; company?: string; period: string };

function ids(items: Job[]): string[] {
  return items.map((item) => item.id);
}

describe("sortExperienceByPeriod", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns an empty array unchanged", () => {
    expect(sortExperienceByPeriod([])).toEqual([]);
  });

  it("puts ongoing roles first", () => {
    const items: Job[] = [
      { id: "closed-new", period: "08/2025 \u2013 10/2025" },
      { id: "ongoing", period: "08/2025 \u2013 Present" },
      { id: "closed-old", period: "10/2023 \u2013 01/2025" },
    ];
    expect(ids(sortExperienceByPeriod(items))).toEqual([
      "ongoing",
      "closed-new",
      "closed-old",
    ]);
  });

  it("orders closed ranges by end date descending", () => {
    const items: Job[] = [
      { id: "lab", period: "10/2023 \u2013 01/2025" },
      { id: "remax", period: "  08/2025   \u2013   10/2025  " },
      { id: "trt", period: "03/2025 \u2013 05/2025" },
    ];
    expect(ids(sortExperienceByPeriod(items))).toEqual(["remax", "trt", "lab"]);
  });

  it("breaks an end-date tie by start date descending", () => {
    const items: Job[] = [
      { id: "earlier-start", period: "01/2024 \u2013 10/2025" },
      { id: "later-start", period: "08/2025 \u2013 10/2025" },
    ];
    expect(ids(sortExperienceByPeriod(items))).toEqual([
      "later-start",
      "earlier-start",
    ]);
  });

  it("parses mixed dash characters the same way", () => {
    const items: Job[] = [
      { id: "hyphen", period: "03/2025 - 05/2025" },
      { id: "em", period: "10/2023 \u2014 01/2025" },
      { id: "en", period: "08/2025 \u2013 10/2025" },
    ];
    expect(ids(sortExperienceByPeriod(items))).toEqual(["en", "hyphen", "em"]);
  });

  it("parses Turkish and English formats", () => {
    const items: Job[] = [
      { id: "years", period: "2021 \u2013 2025" },
      { id: "en-month", period: "March 2026" },
      { id: "tr-ongoing", period: "Mart 2026 \u2013 G\u00fcn\u00fcm\u00fcz" },
      { id: "tr-month", period: "Ocak 2024 \u2013 May\u0131s 2025" },
    ];
    expect(ids(sortExperienceByPeriod(items))).toEqual([
      "tr-ongoing",
      "en-month",
      "tr-month",
      "years",
    ]);
  });

  it("places unparseable values last in original order and warns in development", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const items: Job[] = [
      { id: "bad-a", company: "Unknown Co", period: "soon" },
      { id: "good", period: "08/2025 \u2013 10/2025" },
      { id: "bad-b", company: "Other Co", period: "TBD \u2013 later" },
    ];

    expect(ids(sortExperienceByPeriod(items))).toEqual(["good", "bad-a", "bad-b"]);
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("bad-a / Unknown Co"),
    );
    expect(warnSpy.mock.calls[0]?.[0]).toContain('"soon"');
    expect(warnSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("bad-b / Other Co"),
    );
  });

  it("does not warn about unparseable periods in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    sortExperienceByPeriod([{ id: "bad", company: "Co", period: "soon" }]);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("keeps original order when periods tie (stable sort)", () => {
    const items: Job[] = [
      { id: "first", period: "03/2025 \u2013 05/2025" },
      { id: "second", period: "03/2025 \u2013 05/2025" },
      { id: "third", period: "03/2025 \u2013 05/2025" },
    ];
    expect(ids(sortExperienceByPeriod(items))).toEqual(["first", "second", "third"]);
  });

  it("does not drop items and does not mutate the input", () => {
    const items: Job[] = [
      { id: "b", period: "not a date" },
      { id: "a", period: "08/2025 \u2013" },
    ];
    const copy = [...items];

    const sorted = sortExperienceByPeriod(items);

    expect(ids(sorted)).toEqual(["a", "b"]);
    expect(sorted).toHaveLength(items.length);
    expect(items).toEqual(copy);
    expect(sorted[0]).toBe(items[1]);
  });
});
