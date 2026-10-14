/**
 * Writes e2e/baselines/terminal-tokens.json: the computed CSS custom
 * properties on <html> for the terminal skin, in dark and in light.
 *
 * The site must already be running. Use the same production server the
 * Playwright suite uses when you want the file to match what
 * e2e/terminal-baseline.spec.ts compares (port 3100). A dev server on
 * 3000 also works for a manual dump; do not commit that output unless
 * you have confirmed it matches the production build.
 *
 *   BASE_URL=http://localhost:3100 npx tsx scripts/dump-terminal-tokens.ts
 *
 * Skin is seeded in localStorage before navigation, which is what the
 * boot script reads. The ?skin= / ?mode= query override only exists in
 * development, so this script does not use it.
 */
import { chromium, type Browser } from "@playwright/test";
import { seedTheme } from "../e2e/fixtures";
import {
  dumpCustomProperties,
  writeTokenBaseline,
  type TokenBaseline,
} from "../e2e/terminal-tokens";

const baseURL = process.env.BASE_URL ?? "http://localhost:3100";

async function collect(browser: Browser, mode: "dark" | "light") {
  const page = await browser.newPage({
    colorScheme: mode,
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 900 },
  });
  await seedTheme(page, { skin: "terminal", mode });
  await page.goto(new URL("/en", baseURL).href, { waitUntil: "load" });
  const skin = await page.locator("html").getAttribute("data-skin");
  const className = await page.locator("html").getAttribute("class");
  if (skin !== "terminal" || !className?.split(/\s+/).includes(mode)) {
    throw new Error(
      `Expected terminal/${mode} on <html>, got skin=${skin} class=${className}`,
    );
  }
  const tokens = await dumpCustomProperties(page);
  await page.close();
  return tokens;
}

async function main() {
  const browser = await chromium.launch();
  try {
    const baseline: TokenBaseline = {
      skin: "terminal",
      modes: {
        dark: await collect(browser, "dark"),
        light: await collect(browser, "light"),
      },
    };
    for (const mode of ["dark", "light"] as const) {
      const count = Object.keys(baseline.modes[mode]).length;
      if (count < 20) {
        throw new Error(`Refusing to write an empty ${mode} dump (${count} properties).`);
      }
    }
    writeTokenBaseline(baseline);
    console.log(
      `Wrote terminal token baseline (${Object.keys(baseline.modes.dark).length} dark, ${Object.keys(baseline.modes.light).length} light) from ${baseURL}`,
    );
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
