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

/**
 * Brings the page to the state a reader actually sees before scanning.
 * Sections fade in once on entering the viewport (Framer Motion, inline
 * opacity 0 -> 1). Scanning straight after load raced the hero's entrance
 * (axe measured half-faded text, e.g. 1.45:1) and skipped every section
 * below the fold as invisible. So: once hydrated (Framer's observers only
 * exist from then on), scroll through to reveal everything, return to the
 * top, and wait until no rendered element's inline opacity is in flight.
 * The inactive skin's markup is display:none and never animates, so
 * checkVisibility() leaves it out.
 *
 * Likewise the contact form's submit button is disabled (and dimmed via
 * disabled:opacity-50) until the Turnstile token arrives, which can land
 * mid-scan; axe then caught it fading back in (3.29:1). So also wait for
 * that token and for every finite CSS transition/animation to finish.
 */
async function revealAllSections(page: import("@playwright/test").Page) {
  // The skin/mode switchers are disabled until mounted.
  await expect(
    page.locator('button[aria-haspopup="listbox"]:visible:disabled'),
  ).toHaveCount(0);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = page.viewportSize()!.height / 2;
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    // Frames for the IntersectionObserver to see this position.
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  // Real Cloudflare test endpoint (see e2e/fixtures.ts), so allow it time.
  await expect(page.locator('#contact button[type="submit"]:visible')).toBeEnabled({
    timeout: 15_000,
  });
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          document
            .getAnimations()
            .filter(
              (a) =>
                a.playState === "running" &&
                a.effect?.getComputedTiming().iterations !== Infinity,
            )
            .map((a) => (a as CSSTransition).transitionProperty ?? a.constructor.name),
        ),
      { message: "every finite transition/animation should have finished" },
    )
    .toEqual([]);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>("[style*=opacity]"))
            .filter((el) => el.checkVisibility() && el.style.opacity !== "1")
            .map((el) => `${el.tagName.toLowerCase()} opacity=${el.style.opacity}`),
        ),
      { message: "every entrance animation should have finished at opacity 1" },
    )
    .toEqual([]);
}

for (const locale of ["en", "tr"] as const) {
  for (const { skin, mode } of COMBOS) {
    test(`axe: full page has no serious/critical violations (${locale} ${skin}/${mode})`, async ({
      page,
    }) => {
      await seedTheme(page, { skin, mode });
      await page.goto(`/${locale}`);
      await revealAllSections(page);

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
 * History: when this suite was introduced, it failed on three real,
 * serious violations, which were then fixed at the source rather than
 * suppressed here:
 *
 *   1-2. color-contrast: text colored with opacity modifiers
 *        (text-muted/80 on NavSelect's micro-labels, text-accent/80 on the
 *        terminal skin's nav-link numbers) fell under 4.5:1. Replaced by
 *        solid --subtle / --accent-subtle tokens (src/app/globals.css).
 *   3.   scrollable-region-focusable: ProjectModal's scrollable content
 *        could not be reached by keyboard. It is now a focusable,
 *        labelled region.
 *
 * Still reported at moderate (logged, not failing, per the threshold
 * above): landmark-no-duplicate-banner / -contentinfo in the project
 * modal, whose <header>/<footer> are not inside a sectioning element and
 * so are exposed as a second banner/contentinfo next to the page's own.
 */
