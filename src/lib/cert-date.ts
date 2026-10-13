/**
 * Certificate dates are free text ("March 2026", "2024", sometimes missing),
 * not ISO dates. These helpers read what is there and never guess:
 *   - the year is the first standalone 19xx/20xx number in the text;
 *   - the month is an English or Turkish month name, or the "MM/YYYY" form;
 *   - anything else leaves the field unknown (year null, month 0).
 * Entries without a year are shown last, under "Undated".
 */

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  ocak: 1, "\u015fubat": 2, mart: 3, nisan: 4, "may\u0131s": 5, haziran: 6,
  temmuz: 7, "a\u011fustos": 8, "eyl\u00fcl": 9, ekim: 10, "kas\u0131m": 11, "aral\u0131k": 12,
};

export type ParsedCertDate = {
  year: number | null;
  /** 1-12, or 0 when the text has no month. */
  month: number;
};

export function parseCertDate(date: string | undefined): ParsedCertDate {
  const text = (date ?? "").trim();
  if (!text) return { year: null, month: 0 };

  const yearMatch = text.match(/(?<!\d)((?:19|20)\d{2})(?!\d)/);
  if (!yearMatch) return { year: null, month: 0 };
  const year = Number(yearMatch[1]);

  const numeric = text.match(/(?<!\d)(\d{1,2})\s*[./-]\s*(?:19|20)\d{2}(?!\d)/);
  if (numeric) {
    const month = Number(numeric[1]);
    if (month >= 1 && month <= 12) return { year, month };
  }

  // Both lowercasings: Turkish maps "I" to a dotless "ı", which would break "APRIL".
  for (const lowered of [text.toLowerCase(), text.toLocaleLowerCase("tr")]) {
    for (const word of lowered.split(/[^\p{L}]+/u)) {
      const month = MONTHS[word];
      if (month) return { year, month };
    }
  }
  return { year, month: 0 };
}

/**
 * Display text: a localized "March 2026" when the month and year were both
 * read, otherwise the stored text unchanged.
 */
export function formatCertDate(date: string | undefined, locale: string): string {
  const raw = (date ?? "").trim();
  const { year, month } = parseCertDate(raw);
  if (!raw || year === null || month === 0) return raw;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
    locale === "tr" ? "tr-TR" : "en-GB",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
}

export type YearGroup<T> = { year: number | null; items: T[] };

/** Newest first (year, then month); ties and undated entries keep input order. */
export function sortByRecency<T extends { date?: string }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index, ...parseCertDate(item.date) }))
    .sort((a, b) => {
      if (a.year === null && b.year !== null) return 1;
      if (b.year === null && a.year !== null) return -1;
      return (
        (b.year ?? 0) - (a.year ?? 0) || b.month - a.month || a.index - b.index
      );
    })
    .map((entry) => entry.item);
}

/** Groups an already sorted list by year, keeping order; undated entries end up last. */
export function groupByYear<T extends { date?: string }>(items: readonly T[]): YearGroup<T>[] {
  const groups: YearGroup<T>[] = [];
  for (const item of items) {
    const { year } = parseCertDate(item.date);
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.items.push(item);
    else groups.push({ year, items: [item] });
  }
  return groups;
}
