/**
 * Experience entries only store a free-text `period`. There is no end-date or
 * "current" field to read, so an entry counts as ongoing only when the text
 * itself says so: it ends in an open range ("2024 –") or a word such as
 * "Present" / "Günümüz". Anything else is treated as finished, never guessed.
 */
import { parseCertDate } from "@/lib/cert-date";

const OPEN_WORD =
  /(^|[\s\u2013\u2014-])(present|current|ongoing|günümüz|halen|devam(\s+ediyor)?)$/iu;
const OPEN_RANGE = /[\u2013\u2014-]$/u;
/** Hyphen, en dash, em dash: the range separators used in period copy. */
const RANGE_SPLIT = /\s*[\u2013\u2014-]\s*/u;

export function isOpenEndedPeriod(period: string | undefined): boolean {
  const text = (period ?? "").trim();
  if (!text) return false;
  return OPEN_WORD.test(text) || OPEN_RANGE.test(text);
}

type YearMonth = { year: number; month: number };

type ParsedPeriod =
  | { ok: true; start: YearMonth | null; ongoing: true }
  | { ok: true; start: YearMonth; end: YearMonth; ongoing: false }
  | { ok: false };

function parseBound(text: string): YearMonth | null {
  const { year, month } = parseCertDate(text);
  if (year === null) return null;
  return { year, month };
}

function isOpenEndedBound(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return OPEN_WORD.test(trimmed);
}

function parseExperiencePeriod(period: string | undefined): ParsedPeriod {
  const text = (period ?? "").trim();
  if (!text) return { ok: false };

  const parts = text.split(RANGE_SPLIT).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0 || parts.length > 2) return { ok: false };

  if (parts.length === 1) {
    if (isOpenEndedPeriod(text)) {
      if (isOpenEndedBound(parts[0])) return { ok: true, start: null, ongoing: true };
      const start = parseBound(parts[0]);
      if (!start) return { ok: false };
      return { ok: true, start, ongoing: true };
    }
    const bound = parseBound(parts[0]);
    if (!bound) return { ok: false };
    return { ok: true, start: bound, end: bound, ongoing: false };
  }

  const start = parseBound(parts[0]);
  if (!start) return { ok: false };
  if (isOpenEndedBound(parts[1])) return { ok: true, start, ongoing: true };

  const end = parseBound(parts[1]);
  if (!end) return { ok: false };
  return { ok: true, start, end, ongoing: false };
}

function dateKey(bound: YearMonth | null): number {
  if (!bound) return Number.NEGATIVE_INFINITY;
  return bound.year * 12 + bound.month;
}

type ExperienceSortable = {
  period: string;
  company?: string;
  id?: string;
};

function experienceLabel(item: ExperienceSortable): string {
  return [item.id, item.company].filter(Boolean).join(" / ") || "(unknown)";
}

function warnUnparsed(item: ExperienceSortable): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn(
    `[experience] Could not parse period for ${experienceLabel(item)}: ${JSON.stringify(item.period)}`,
  );
}

/**
 * Newest first: ongoing roles, then end date descending, then start date
 * descending. Unparseable periods are never guessed or dropped; they follow
 * parsed items in their original relative order.
 */
export function sortExperienceByPeriod<T extends ExperienceSortable>(
  items: readonly T[],
): T[] {
  return items
    .map((item, index) => {
      const parsed = parseExperiencePeriod(item.period);
      if (!parsed.ok) warnUnparsed(item);
      return { item, index, parsed };
    })
    .sort((a, b) => {
      if (a.parsed.ok !== b.parsed.ok) return a.parsed.ok ? -1 : 1;
      if (!a.parsed.ok || !b.parsed.ok) return a.index - b.index;

      if (a.parsed.ongoing !== b.parsed.ongoing) return a.parsed.ongoing ? -1 : 1;

      if (!a.parsed.ongoing && !b.parsed.ongoing) {
        const endDiff = dateKey(b.parsed.end) - dateKey(a.parsed.end);
        if (endDiff) return endDiff;
      }

      const startDiff = dateKey(b.parsed.start) - dateKey(a.parsed.start);
      if (startDiff) return startDiff;

      return a.index - b.index;
    })
    .map((entry) => entry.item);
}
