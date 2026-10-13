import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

/**
 * Computed CSS custom properties on <html> for the terminal skin.
 * The baseline spec compares a live production page against this file.
 * scripts/dump-terminal-tokens.ts writes the same shape.
 */
export const TOKEN_BASELINE_PATH = path.join(
  process.cwd(),
  "e2e",
  "baselines",
  "terminal-tokens.json",
);

export type TokenMap = Record<string, string>;

export type TokenBaseline = {
  skin: "terminal";
  modes: {
    dark: TokenMap;
    light: TokenMap;
  };
};

/** Every custom property on <html>, sorted, so the JSON diff is stable. */
export function dumpCustomProperties(page: Page): Promise<TokenMap> {
  return page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    const entries: [string, string][] = [];
    for (let i = 0; i < style.length; i++) {
      const name = style.item(i);
      if (!name.startsWith("--")) continue;
      entries.push([name, style.getPropertyValue(name).trim()]);
    }
    entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return Object.fromEntries(entries);
  });
}

export function readTokenBaseline(): TokenBaseline {
  return JSON.parse(readFileSync(TOKEN_BASELINE_PATH, "utf8")) as TokenBaseline;
}

export function writeTokenBaseline(baseline: TokenBaseline) {
  mkdirSync(path.dirname(TOKEN_BASELINE_PATH), { recursive: true });
  writeFileSync(TOKEN_BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
}
