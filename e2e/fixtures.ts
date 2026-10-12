import { test as base, expect, type Page } from "@playwright/test";
import { MODE_KEY, SKIN_KEY, type Mode, type Skin } from "../src/lib/theme";
import { MOCK_EMAILJS_ORIGIN } from "./mock-emailjs/constants";

/**
 * Hostnames this suite never allows a real request to reach. Sanity is
 * included defensively even though its actual content fetch happens in a
 * Server Component (a separate Node process this browser-level routing
 * cannot see) -- this still catches any client-side reference (e.g. an
 * image CDN URL) if one is ever added. Gemini is similarly defensive: no
 * E2E flow here calls /api/translate, which is the only thing that reaches
 * it, and that route itself runs server-side too.
 *
 * api.emailjs.com is blocked by default (abort) so a test that never means
 * to touch EmailJS can't accidentally send real mail; a test that exercises
 * the contact form registers its own, more specific route for that host
 * AFTER this fixture applies, which Playwright matches first, overriding
 * the default abort with a controlled mocked response.
 *
 * challenges.cloudflare.com is deliberately NOT in this list: Cloudflare
 * publishes fixed Turnstile test keys designed to be used against the real
 * endpoint in automation (see playwright.config.ts), and that is the
 * sanctioned exception to "never reach the real network" here.
 */
const BLOCKED_HOSTS = [/\.sanity\.io$/, /googleapis\.com$/, /^api\.emailjs\.com$/];

export const test = base.extend<{ blockExternalNetwork: void }>({
  blockExternalNetwork: [
    async ({ page }, use) => {
      const escaped: string[] = [];
      await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (BLOCKED_HOSTS.some((pattern) => pattern.test(url.hostname))) {
          escaped.push(route.request().url());
          await route.abort("failed");
          return;
        }
        await route.continue();
      });
      await use();
      expect(
        escaped,
        `Test let a request escape to a blocked host instead of mocking it: ${escaped.join(", ")}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/**
 * Seeds localStorage with a theme choice BEFORE navigation, via
 * addInitScript, so the inline boot script (which runs before React even
 * exists) reads it on first paint -- exactly how a returning visitor's
 * choice would be read. Setting localStorage after page.goto is too late:
 * the boot script has already run.
 */
export async function seedTheme(
  page: Page,
  values: { mode?: string; skin?: string },
) {
  await page.addInitScript(
    ({ modeKey, skinKey, mode, skin }) => {
      if (mode !== undefined) window.localStorage.setItem(modeKey, mode);
      if (skin !== undefined) window.localStorage.setItem(skinKey, skin);
    },
    { modeKey: MODE_KEY, skinKey: SKIN_KEY, mode: values.mode, skin: values.skin },
  );
}

export async function clearTheme(page: Page) {
  await page.addInitScript(
    ({ modeKey, skinKey }) => {
      window.localStorage.removeItem(modeKey);
      window.localStorage.removeItem(skinKey);
    },
    { modeKey: MODE_KEY, skinKey: SKIN_KEY },
  );
}

export async function readThemeAttributes(page: Page) {
  return page.evaluate(() => ({
    skin: document.documentElement.dataset.skin,
    htmlClass: document.documentElement.className,
    colorScheme: document.documentElement.style.colorScheme,
  }));
}

export type ThemeLogEntry = {
  skin?: string;
  classes: string;
  colorScheme: string;
};

/**
 * Installs a MutationObserver that records every data-skin/class/style
 * mutation on <html>, starting from the earliest possible moment, so a
 * test can tell "correct from the first mutation" apart from "eventually
 * correct after something else fixed it". addInitScript runs before any of
 * the page's own scripts, but document.documentElement does not exist yet
 * at that point (confirmed empirically: it's null) -- the parser hasn't
 * created <html> yet. This observes `document` itself for the childList
 * mutation that adds <html>, then immediately attaches the attribute
 * observer to it, which is early enough to catch the inline boot script's
 * own writes as they happen (it runs synchronously, as soon as <head> is
 * parsed, which is right after <html> exists).
 */
export async function installThemeMutationLog(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __themeLog: ThemeLogEntry[] };
    w.__themeLog = [];
    const record = () => {
      const el = document.documentElement;
      w.__themeLog.push({
        skin: el?.dataset.skin,
        classes: el?.className ?? "",
        colorScheme: el?.style.colorScheme ?? "",
      });
    };
    const attach = () => {
      record();
      new MutationObserver(record).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-skin", "style"],
      });
    };
    if (document.documentElement) {
      attach();
    } else {
      new MutationObserver((_mutations, observer) => {
        if (document.documentElement) {
          observer.disconnect();
          attach();
        }
      }).observe(document, { childList: true, subtree: true });
    }
  });
}

export async function readThemeLog(page: Page): Promise<ThemeLogEntry[]> {
  return page.evaluate(
    () => (window as unknown as { __themeLog: ThemeLogEntry[] }).__themeLog,
  );
}

/** Intercepts EmailJS's send call with a fulfilled success response. */
export async function mockEmailJsSuccess(page: Page) {
  await page.route("**/api.emailjs.com/**", (route) =>
    route.fulfill({ status: 200, body: "OK" }),
  );
}

/** Intercepts EmailJS's send call with a failure response. */
export async function mockEmailJsFailure(page: Page) {
  await page.route("**/api.emailjs.com/**", (route) =>
    route.fulfill({ status: 422, body: "Unprocessable" }),
  );
}

export type { Mode, Skin };

/**
 * The contact emails the EmailJS stand-in accepted whose subject contains
 * `subjectMarker` (e2e/mock-emailjs/server.mjs). Give every test a unique
 * marker: the mock is shared by parallel workers.
 */
export async function sentEmails(
  request: import("@playwright/test").APIRequestContext,
  subjectMarker: string,
): Promise<Array<{ template_params: Record<string, string>; receivedAt: number }>> {
  const res = await request.get(`${MOCK_EMAILJS_ORIGIN}/__sent?subject=${encodeURIComponent(subjectMarker)}`);
  expect(res.ok(), "the EmailJS stand-in is not reachable").toBe(true);
  return res.json();
}
