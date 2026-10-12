import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";
import { expect, seedTheme, test, type Mode, type Skin } from "./fixtures";

const COMBOS: Array<{ skin: Skin; mode: Mode }> = [
  { skin: "terminal", mode: "dark" },
  { skin: "terminal", mode: "light" },
  { skin: "minimal", mode: "dark" },
  { skin: "minimal", mode: "light" },
];

// Scan under reduced motion. The entrance reveals are hidden only for
// motion-OK browsers (globals.css), so with prefers-reduced-motion every
// section renders fully visible at once -- no scrolling, no waiting on a
// fade, nothing half-faded or skipped-as-invisible. The at-rest colours and
// layout axe checks are identical to the motion build, so this loses no
// coverage. Crucially, it is no longer this scan's job to make hidden
// content appear: that the reveal never leaves content permanently hidden
// (reduced motion, no/slow JS) is proved directly by e2e/reduced-motion
// .spec.ts, so a visibility regression surfaces there, not masked here.
test.use({ reducedMotion: "reduce" });

/**
 * Splits violations by severity and returns the ones that fail the suite.
 * The threshold is critical + serious + MODERATE: it was raised to include
 * moderate once the only moderate findings (the project modal's duplicate
 * banner/contentinfo landmarks) were fixed, so a future moderate regression
 * now fails CI. Only minor is logged as a non-failing warning. Nothing is
 * filtered or suppressed, including known or out-of-scope findings: a real
 * violation does not stop being real because it was found before.
 */
function failingViolations(violations: Result[]) {
  const failing = violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious" || v.impact === "moderate",
  );
  const minor = violations.filter((v) => v.impact === "minor");
  if (minor.length) {
    console.warn(
      `[axe, not failing] ${minor.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} node(s))`).join("; ")}`,
    );
  }
  return failing;
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
 * Settles the page before scanning. Under reduced motion the content is
 * already all visible (see the note by COMBOS), so there is nothing to
 * scroll or reveal -- this only waits out the two state changes that would
 * otherwise race the scan:
 *   - the skin/mode switchers are disabled until the theme mounts;
 *   - the contact submit button is disabled (dimmed via disabled:opacity-50)
 *     until the real Cloudflare Turnstile test token arrives, and axe once
 *     caught it fading back in at 3.29:1.
 */
async function settlePage(page: import("@playwright/test").Page) {
  await expect(
    page.locator('button[aria-haspopup="listbox"]:visible:disabled'),
  ).toHaveCount(0);
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
}

for (const locale of ["en", "tr"] as const) {
  for (const { skin, mode } of COMBOS) {
    test(`axe: full page has no critical, serious or moderate violations (${locale} ${skin}/${mode})`, async ({
      page,
    }) => {
      await seedTheme(page, { skin, mode });
      await page.goto(`/${locale}`);
      await settlePage(page);

      const results = await new AxeBuilder({ page }).analyze();
      const failing = failingViolations(results.violations);

      expect(failing, describeViolations(failing)).toEqual([]);
    });
  }
}

for (const skin of ["terminal", "minimal"] as const) {
  test(`axe: the open project modal has no critical, serious or moderate violations (${skin})`, async ({
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
    const failing = failingViolations(results.violations);

    expect(failing, describeViolations(failing)).toEqual([]);
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
 * Later, the project modal's only moderate findings --
 * landmark-no-duplicate-banner / -contentinfo, from its <header>/<footer>
 * being exposed as a second banner/contentinfo beside the page's own --
 * were fixed by making those plain <div>s. With moderate then at zero, the
 * failure threshold was raised to include moderate (see failingViolations),
 * so a future moderate regression fails CI rather than only being logged.
 */
