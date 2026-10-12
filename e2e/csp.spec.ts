import type { Page } from "@playwright/test";
import { CSP_HEADER_NAME, CSP_MODE, SITE_CSP, STUDIO_CSP } from "../src/lib/csp";
import { expect, seedTheme, test, type Mode, type Skin } from "./fixtures";

/*
 * The Content-Security-Policy ships as Report-Only (src/lib/csp.ts). That is
 * only safe to flip to enforcing once the policy is known to cover every
 * resource the site really uses, so this spec loads the site the way a
 * visitor does and asserts the browser reports no violation.
 *
 * Network: the Cloudflare Turnstile widget is loaded for real, from
 * challenges.cloudflare.com, because the policy has to be proved against the
 * real script, iframe and requests (script-src, frame-src, connect-src). That
 * is the one sanctioned exception to "no real network" in this suite and it is
 * confined to this file. /api/contact is fulfilled here, so this spec stays
 * about the browser's policy (the server-side send and its siteverify call are
 * covered by contact-form.spec.ts). The browser no longer contacts EmailJS at
 * all; the shared fixture fails the test if it ever does. Violations inside the
 * Turnstile iframe belong to Cloudflare's own document and policy, not ours.
 *
 * If a violation shows up, the fix is in the policy (src/lib/csp.ts), not in
 * this test.
 */

const COMBOS: Array<{ skin: Skin; mode: Mode }> = [
  { skin: "terminal", mode: "dark" },
  { skin: "terminal", mode: "light" },
  { skin: "minimal", mode: "dark" },
  { skin: "minimal", mode: "light" },
];

type Violation = {
  effectiveDirective: string;
  blockedURI: string;
  sourceFile: string;
  lineNumber: number;
  disposition: string;
  sample: string;
};

async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __cspViolations: unknown[] };
    w.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      w.__cspViolations.push({
        effectiveDirective: e.effectiveDirective,
        blockedURI: e.blockedURI,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber,
        disposition: e.disposition,
        sample: e.sample,
      });
    });
  });
}

async function violations(page: Page): Promise<Violation[]> {
  return page.evaluate(
    () => (window as unknown as { __cspViolations: Violation[] }).__cspViolations,
  );
}

function describeViolations(list: Violation[]) {
  return list
    .map((v) => `${v.effectiveDirective} blocked ${v.blockedURI || "(inline)"} at ${v.sourceFile}:${v.lineNumber} ${v.sample ? `[${v.sample}]` : ""}`)
    .join("\n");
}

async function waitForTurnstileToken(page: Page, sendLabel: string) {
  // The widget renders its iframe inside a closed shadow root, which a CSS
  // locator cannot see, so look for the frame itself.
  await expect
    .poll(() => page.frames().some((f) => f.url().includes("challenges.cloudflare.com")), {
      timeout: 20000,
    })
    .toBe(true);
  // The always-pass test key completes without a click, which enables Send.
  await expect(
    page.getByRole("button", { name: sendLabel }).locator("visible=true"),
  ).toBeEnabled({ timeout: 20000 });
}

test.describe("delivery", () => {
  test("the site and the Studio carry the Report-Only policy, nothing enforces, and X-Powered-By is gone", async ({
    request,
  }) => {
    expect(CSP_MODE).toBe("report-only");

    for (const path of ["/en", "/tr", "/en/this-route-does-not-exist"]) {
      const res = await request.get(path);
      const h = res.headers();
      expect(h[CSP_HEADER_NAME.toLowerCase()], path).toBe(SITE_CSP);
      expect(h["content-security-policy"], `${path} must not enforce yet`).toBeUndefined();
      expect(h["x-powered-by"], path).toBeUndefined();
      // The pre-existing baseline is untouched.
      expect(h["x-frame-options"]).toBe("DENY");
      expect(h["x-content-type-options"]).toBe("nosniff");
      expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(h["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
    }

    const studio = await request.get("/content-hub");
    expect(studio.headers()[CSP_HEADER_NAME.toLowerCase()]).toBe(STUDIO_CSP);
    expect(studio.headers()["content-security-policy"]).toBeUndefined();
    expect(studio.headers()["x-powered-by"]).toBeUndefined();
  });

  test("the policy rides on documents only: static assets and API responses do not carry it", async ({
    request,
  }) => {
    // A CSP only governs documents. Sending it on every asset cost ~430
    // uncompressed bytes per response and measurably slowed simulated mobile.
    for (const path of ["/favicon.ico", "/api/contact"]) {
      const res = await request.get(path);
      expect(res.headers()[CSP_HEADER_NAME.toLowerCase()], path).toBeUndefined();
    }
  });

  test("the pages stay cacheable: the policy is a static header, not a per-request nonce", async ({
    request,
  }) => {
    const res = await request.get("/en");
    expect(res.headers()["cache-control"] ?? "").not.toMatch(/no-store|private/);
  });
});

test.describe("the violation listener is live (positive control)", () => {
  test("a resource the policy forbids is reported", async ({ page }) => {
    await recordViolations(page);
    await page.goto("/en");
    // data: images are not in img-src. No network request is involved.
    await page.evaluate(() => {
      const img = new Image();
      img.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      document.body.appendChild(img);
    });
    await expect.poll(async () => (await violations(page)).length).toBeGreaterThan(0);
    const [first] = await violations(page);
    expect(first.effectiveDirective).toBe("img-src");
    // Report-only: reported, not blocked.
    expect(first.disposition).toBe("report");
  });
});

for (const { skin, mode } of COMBOS) {
  test.describe(`${skin} / ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await seedTheme(page, { skin, mode });
      await recordViolations(page);
    });

    for (const [path, copy] of [
      ["/en", { send: "Send message", sent: /sent successfully/i, card: "View project details" }],
      ["/tr", { send: "Mesaj Gönder", sent: /başarıyla iletildi/i, card: "Proje detaylarını gör" }],
    ] as const) {
      test(`${path}: the whole page, the real Turnstile widget, a project modal and a send produce no violation`, async ({
        page,
      }) => {
        // Fulfilled here so the server never reaches Cloudflare's siteverify
        // from this spec. The widget itself (browser to Cloudflare) is real.
        await page.route("**/api/contact", (route) =>
          route.fulfill({ status: 200, contentType: "application/json", body: '{"outcome":"sent"}' }),
        );

        await page.goto(path);
        await expect(page.locator("main")).toBeVisible();

        // Scroll the whole page so every lazy image, reveal animation and
        // below-the-fold section has actually loaded and run.
        await page.evaluate(async () => {
          const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
          for (let y = 0; y <= document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 40));
          }
        });

        // A project modal: next/image through /_next/image, Framer Motion.
        const card = page.locator(`button[aria-label^="${copy.card}"]:visible`).first();
        await card.scrollIntoViewIfNeeded();
        await card.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();

        // The contact form: the real Turnstile script and iframe, then a send
        // (the same-origin POST to /api/contact, answered above).
        await page.locator("#contact").scrollIntoViewIfNeeded();
        await page.locator('input[name="name"]:visible').fill("CSP Visitor");
        await page.locator('input[name="email"]:visible').fill("visitor@example.com");
        await page.locator('input[name="subject"]:visible').fill("Policy check");
        await page.locator('textarea[name="message"]:visible').fill("Checking the policy.");
        await waitForTurnstileToken(page, copy.send);
        await page.getByRole("button", { name: copy.send }).locator("visible=true").click();
        await expect(page.getByRole("status")).toHaveText(copy.sent);

        // Give late reports a moment to arrive before asserting none did.
        await page.waitForTimeout(500);
        const found = await violations(page);
        expect(found, `CSP violations on ${path}:\n${describeViolations(found)}`).toEqual([]);
      });
    }

    test("the 404 page produces no violation", async ({ page }) => {
      await page.goto("/en/this-route-does-not-exist");
      await expect(page.locator("main, body")).toBeVisible();
      await page.waitForTimeout(500);
      const found = await violations(page);
      expect(found, `CSP violations on the 404 page:\n${describeViolations(found)}`).toEqual([]);
    });
  });
}
