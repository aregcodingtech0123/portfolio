import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";
import { expect, seedTheme, test, type Mode, type Skin } from "./fixtures";

const COMBOS: Array<{ skin: Skin; mode: Mode }> = [
  { skin: "terminal", mode: "dark" },
  { skin: "terminal", mode: "light" },
  { skin: "minimal", mode: "dark" },
  { skin: "minimal", mode: "light" },
];

/**
 * Splits violations by severity. Moderate/minor are logged as a warning,
 * never failing the suite. Serious/critical are returned for the caller to
 * assert against directly -- never filtered or suppressed here, including
 * known, already-reported, out-of-scope ones (see the module doc comment
 * at the bottom of this file): a violation that's real doesn't stop being
 * real because it was already found once.
 */
function splitBySeverity(violations: Result[]) {
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const moderateOrMinor = violations.filter(
    (v) => v.impact === "moderate" || v.impact === "minor",
  );
  if (moderateOrMinor.length) {
    console.warn(
      `[axe, not failing] ${moderateOrMinor.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} node(s))`).join("; ")}`,
    );
  }
  return serious;
}

function describeViolations(violations: Result[]): string {
  return violations
    .map(
      (v) =>
        `${v.id} (${v.impact}, ${v.nodes.length} node(s)): ${v.nodes[0]?.failureSummary ?? v.description}`,
    )
    .join("\n\n");
}

for (const locale of ["en", "tr"] as const) {
  for (const { skin, mode } of COMBOS) {
    test(`axe: full page has no serious/critical violations (${locale} ${skin}/${mode})`, async ({
      page,
    }) => {
      await seedTheme(page, { skin, mode });
      await page.goto(`/${locale}`);

      const results = await new AxeBuilder({ page }).analyze();
      const serious = splitBySeverity(results.violations);

      expect(serious, describeViolations(serious)).toEqual([]);
    });
  }
}

for (const skin of ["terminal", "minimal"] as const) {
  test(`axe: the open project modal has no serious/critical violations (${skin})`, async ({
    page,
  }) => {
    await seedTheme(page, { skin });
    await page.goto("/en");
    const card = page.locator('button[aria-label^="View project details"]:visible').first();
    await card.click();
    await page.getByRole("dialog").waitFor({ state: "visible" });

    // Scoped to the dialog itself, not the whole page: the page-level
    // scans above already cover (and report) the rest of the chrome
    // behind it, and scoping keeps this check specific to the modal.
    const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    const serious = splitBySeverity(results.violations);

    expect(serious, describeViolations(serious)).toEqual([]);
  });
}

/**
 * Known, reported, deliberately NOT suppressed or fixed here (out of this
 * task's scope, which only permits the focus-trap fix): axe found three
 * real, serious violations.
 *
 * Two WCAG 2 AA color-contrast violations, present in every skin/mode/
 * locale combination the page-level tests above cover, both light-mode-
 * specific (the same /80-opacity color tokens clear 4.5:1 against the
 * dark-mode background but not the light-mode one):
 *
 *   1. NavSelect's micro-label spans (the "Dil / Language" / "Tema /
 *      Mode" / "Görünüm / Skin" text above each navbar switcher):
 *      text-muted/80 in light mode computes to #88837a on #faf8f4, a
 *      3.55:1 contrast ratio against the required 4.5:1.
 *   2. The terminal skin's numbered nav-link prefixes ("01", "02", ...):
 *      text-accent/80 in light mode computes to #3a9265 on #f4f2ec, a
 *      3.42:1 ratio against the required 4.5:1.
 *
 * One scrollable-region-focusable violation, present in the project
 * modal in both skins (so unrelated to the skin-specific focus-trap fix
 * in this same PR):
 *
 *   3. The modal's scrollable content wrapper
 *      (.min-h-0.flex-1.overflow-y-auto.overscroll-contain, holding the
 *      image/description/highlights) has no way to be reached by
 *      keyboard: it is scrollable but not focusable and has no
 *      focusable descendant guaranteed to be present (e.g. a project
 *      with no technologies/highlights/links has nothing tabbable in
 *      that region at all). A keyboard-only user on a long case study
 *      cannot scroll it.
 *
 * All three fail honestly, on purpose, in the tests above -- that is
 * this suite doing its job, not a bug in the suite.
 */
