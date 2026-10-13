import { expect, seedTheme, test, type Mode } from "./fixtures";
import {
  dumpCustomProperties,
  readTokenBaseline,
  writeTokenBaseline,
  type TokenBaseline,
} from "./terminal-tokens";

/**
 * Safety net for the terminal skin. Run this after every minimal-skin
 * redesign phase. It must stay green without updating snapshots.
 *
 * Skin is applied by seeding localStorage before navigation (see
 * e2e/fixtures.ts seedTheme), which is what the inline boot script reads.
 * The ?skin= / ?mode= query override is dev-only and is compiled out of the
 * production build this suite serves (playwright.config.ts), so it cannot
 * drive these checks.
 *
 * Pixel snapshots are OS-specific (font rasterization). The ones committed
 * with this spec were captured on Windows. The token JSON is not: computed
 * custom properties are compared on every OS.
 */

const VIEWPORT_HEIGHT = 900;
const WIDTHS = [390, 768, 1440] as const;
const LOCALES = ["en", "tr"] as const;
const MODES = ["dark", "light"] as const;

// Terminal palette, authored in src/app/globals.css. Guards against dumping
// the minimal skin by mistake. Compared case-insensitively because engines
// may hand hex back unchanged.
const TERMINAL_BACKGROUND = { dark: "#0a0c0f", light: "#f4f2ec" } as const;
const TERMINAL_ACCENT = { dark: "#5bf29b", light: "#0b7a43" } as const;

test.use({ reducedMotion: "reduce" });

test.describe("terminal token baseline", () => {
  test("computed custom properties on html match the committed baseline", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);
    const baseURL = testInfo.project.use.baseURL;
    expect(baseURL, "playwright baseURL").toBeTruthy();

    const actual: TokenBaseline = {
      skin: "terminal",
      modes: { dark: {}, light: {} },
    };

    for (const mode of MODES) {
      const context = await browser.newContext({
        baseURL,
        colorScheme: mode,
        reducedMotion: "reduce",
        viewport: { width: 1440, height: VIEWPORT_HEIGHT },
      });
      const page = await context.newPage();
      await seedTheme(page, { skin: "terminal", mode });
      await page.goto("/en");
      await expect(page.locator("html")).toHaveAttribute("data-skin", "terminal");
      await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${mode}\\b`));
      actual.modes[mode] = await dumpCustomProperties(page);
      await context.close();
    }

    for (const mode of MODES) {
      const tokens = actual.modes[mode];
      expect(Object.keys(tokens).length).toBeGreaterThan(20);
      expect(tokens["--background"]?.toLowerCase()).toBe(TERMINAL_BACKGROUND[mode]);
      expect(tokens["--accent"]?.toLowerCase()).toBe(TERMINAL_ACCENT[mode]);
    }

    if (process.env.UPDATE_TERMINAL_TOKENS === "1") {
      writeTokenBaseline(actual);
    }

    const expected = readTokenBaseline();
    expect(actual).toEqual(expected);
  });
});

test.describe("terminal pixel baseline", () => {
  test.describe.configure({ timeout: 120_000 });

  for (const locale of LOCALES) {
    for (const mode of MODES) {
      for (const width of WIDTHS) {
        test(`full page ${locale} ${mode} ${width}px`, async ({ page }) => {
          // Font rasterization differs per OS. Comparing a Windows PNG on
          // Linux fails even when the CSS is unchanged, so this check runs
          // where the baselines were captured. Token drift is still checked
          // above, on every OS.
          test.skip(
            process.platform !== "win32",
            "Pixel baselines were captured on Windows (win32). Recapture with --update-snapshots on that OS.",
          );

          await prepareTerminalPage(page, { locale, mode, width });

          // Sections use content-visibility: auto (globals.css), so the browser
          // skips rendering the ones far from the viewport, and a full-page
          // capture would show them as empty space. A visitor never sees that:
          // each section renders as it scrolls into view. Render all of them
          // for the capture, so the baseline compares the skin's real pixels.
          // e2e/content-visibility.spec.ts checks the rule itself is shipped.
          await page.addStyleTag({ content: "main > section { content-visibility: visible !important; }" });

          await expect(page).toHaveScreenshot(`terminal-${locale}-${mode}-${width}.png`, {
            fullPage: true,
            animations: "disabled",
            caret: "hide",
            scale: "css",
            // The Turnstile iframe is a third-party widget. Mask it so its
            // pixels cannot fail a terminal-skin check. Its box is pinned
            // to a fixed height in prepareTerminalPage so it cannot shift
            // the layout either.
            mask: [page.locator("#contact iframe")],
          });
        });
      }
    }
  }
});

async function prepareTerminalPage(
  page: import("@playwright/test").Page,
  options: { locale: (typeof LOCALES)[number]; mode: Mode; width: (typeof WIDTHS)[number] },
) {
  const { locale, mode, width } = options;
  await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: mode });
  await seedTheme(page, { skin: "terminal", mode });
  await page.goto(`/${locale}`);

  await expect(page.locator("html")).toHaveAttribute("data-skin", "terminal");
  await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${mode}\\b`));

  // Same settle as e2e/accessibility.spec.ts: theme controls stay disabled
  // until mount, and the contact submit stays disabled until Turnstile
  // returns a token. Both must be done before a pixel compare.
  await expect(page.locator('button[aria-haspopup="listbox"]:visible:disabled')).toHaveCount(0);
  await expect(page.locator('#contact button[type="submit"]:visible')).toBeEnabled({
    timeout: 20_000,
  });

  await page.evaluate(async () => {
    await document.fonts.ready;
    const heading = document.querySelector("h1");
    if (heading) {
      await document.fonts.load(getComputedStyle(heading).font, heading.textContent ?? "");
    }
    await document.fonts.ready;
  });

  // Lazy images below the fold stay blank in a full-page capture unless
  // they have been in view once. Scroll the document, then return to the
  // top so the navbar is back in its unscrolled state.
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight - 80, 400);
    const height = document.documentElement.scrollHeight;
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });

  await expect(page.locator("header")).toHaveClass(/bg-background\/80/);
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("img")]
        .filter((img) => img.getClientRects().length > 0)
        .every((img) => img.complete && img.naturalWidth > 0),
    undefined,
    { timeout: 15_000 },
  );

  await page.addStyleTag({
    content:
      "#contact iframe{visibility:hidden!important;height:65px!important;min-height:65px!important;max-height:65px!important;}",
  });
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
      }),
  );
}
