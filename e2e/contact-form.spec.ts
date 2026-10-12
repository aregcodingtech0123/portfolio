import type { APIRequestContext, Page, TestInfo } from "@playwright/test";
import { HONEYPOT_FIELD, MIN_FILL_MS } from "../src/lib/contact/rules";
import { expect, sentEmails, test } from "./fixtures";
import { GATE_CLOSED_URL, SECRET_MISSING_URL } from "./servers";

/*
 * The contact email is sent by the server, after it has verified the
 * Turnstile token. In this run:
 * - Turnstile is Cloudflare's real service with its documented dummy keys
 *   (the always-pass site key issues the dummy token XXXX.DUMMY.TOKEN.XXXX,
 *   and the dummy secret accepts only that token), the one sanctioned use of
 *   the real network in this suite.
 * - EmailJS is the local stand-in (e2e/mock-emailjs/server.mjs). Nothing an
 *   automated run does can send a real email.
 * - Cloudflare's always-pass dummy secret accepts ANY token (checked against
 *   the real siteverify; its testing doc says otherwise). So "a refused token
 *   sends nothing" is proved on a second server from the same build running
 *   the always-fail dummy secret, and "the secret is missing" on a third
 *   (e2e/servers.ts, playwright.config.ts).
 * The fixture also fails any test whose browser contacts api.emailjs.com.
 */

const DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

/** A subject unique to this test, so the shared mock's record can be filtered. */
function marker(testInfo: TestInfo) {
  return `e2e-${testInfo.testId}-${testInfo.repeatEachIndex}-${testInfo.retry}`;
}

async function fillContactForm(page: Page, subject: string, origin = "") {
  await page.goto(`${origin}/en#contact`);
  await page.getByLabel("Full Name", { exact: true }).fill("Test Visitor");
  await page.getByLabel("Email Address", { exact: true }).fill("visitor@example.com");
  await page.getByLabel("Subject", { exact: true }).fill(subject);
  await page.getByLabel("Message", { exact: true }).fill("This is an end-to-end test message.");
}

function sendButton(page: Page) {
  return page.getByRole("button", { name: "Send message" }).locator("visible=true");
}

async function submit(page: Page) {
  // Cloudflare's always-pass test widget completes on its own.
  await expect(sendButton(page)).toBeEnabled({ timeout: 20000 });
  // The server refuses a form sent implausibly fast. The browser starts that
  // clock when the form mounts, which an enabled Send button proves has
  // happened, so waiting the minimum from here is always enough.
  await page.waitForTimeout(MIN_FILL_MS + 300);
  await sendButton(page).click();
}

function emailjsRequests(page: Page) {
  const hits: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).hostname.endsWith("emailjs.com")) hits.push(r.url());
  });
  return hits;
}

test.describe("the visitor's view of the server-side send", () => {
  test("happy path: the server verifies the captcha and sends; the visitor sees success; the browser never contacts EmailJS", async ({
    page,
    request,
  }, testInfo) => {
    const subject = marker(testInfo);
    const browserToEmailjs = emailjsRequests(page);

    await fillContactForm(page, subject);
    await submit(page);

    await expect(page.getByRole("status")).toHaveText(/sent successfully/i);

    // A real delivery to the provider, not just a 200: the stand-in received
    // exactly this message, through the private-key path it insists on.
    const sent = await sentEmails(request, subject);
    expect(sent).toHaveLength(1);
    expect(sent[0].template_params).toEqual({
      from_name: "Test Visitor",
      reply_to: "visitor@example.com",
      subject,
      message: "This is an end-to-end test message.",
    });
    expect(browserToEmailjs).toEqual([]);
  });

  test("a provider outage: the visitor is told the message was not sent and to try again later; nothing was sent", async ({
    page,
    request,
  }, testInfo) => {
    const subject = `${marker(testInfo)} [mock:fail-500]`;
    await fillContactForm(page, subject);
    await submit(page);

    await expect(
      page.getByRole("alert").filter({ hasText: /could not be sent just now/i }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    expect(await sentEmails(request, subject)).toHaveLength(0);
  });

  test("misconfigured server (EmailJS refuses the account settings): an honest 'unavailable, write to me directly', not a retry loop", async ({
    page,
    request,
  }, testInfo) => {
    // Replaces the old assertion that a generic captcha error was acceptable.
    const subject = `${marker(testInfo)} [mock:misconfigured]`;
    await fillContactForm(page, subject);
    await submit(page);

    const notice = page.getByRole("alert").filter({ hasText: /temporarily unavailable/i });
    await expect(notice).toBeVisible();
    await expect(notice.getByRole("link", { name: "LinkedIn" })).toBeVisible();
    // Not presented as a captcha problem the visitor could fix by retrying.
    await expect(page.getByText(/security check/i)).toHaveCount(0);
    await expect(sendButton(page)).toBeDisabled();
    await expect(page.getByRole("status")).toHaveCount(0);
    expect(await sentEmails(request, subject)).toHaveLength(0);
  });

  test("Turnstile secret missing at runtime (the audit's silent-block case): the visitor sees the honest 'unavailable' notice, end to end", async ({
    page,
    request,
  }, testInfo) => {
    // A real server from the same build with no secret: the widget renders and
    // passes (the site key is baked in), the server cannot verify. This used
    // to show a generic "security check failed" forever.
    const subject = marker(testInfo);
    await fillContactForm(page, subject, SECRET_MISSING_URL);
    await submit(page);

    const notice = page.getByRole("alert").filter({ hasText: /temporarily unavailable/i });
    await expect(notice).toBeVisible();
    await expect(notice.getByRole("link", { name: "LinkedIn" })).toBeVisible();
    await expect(page.getByText(/security check/i)).toHaveCount(0);
    await expect(sendButton(page)).toBeDisabled();
    expect(await sentEmails(request, subject)).toHaveLength(0);
  });
});

test.describe("the captcha gate cannot be skipped (direct requests, no browser)", () => {
  function body(subject: string, overrides: Record<string, unknown> = {}) {
    return {
      name: "Bot",
      email: "bot@example.com",
      subject,
      message: "Direct POST that tries to skip the captcha.",
      token: DUMMY_TOKEN,
      [HONEYPOT_FIELD]: "",
      elapsedMs: 15000,
      ...overrides,
    };
  }

  async function postContact(request: APIRequestContext, data: unknown) {
    return request.post("/api/contact", { data });
  }

  test("no token: refused, and nothing is sent", async ({ request }, testInfo) => {
    const subject = marker(testInfo);
    const res = await postContact(request, body(subject, { token: "" }));
    expect(res.status()).toBe(403);
    expect(await res.json()).toEqual({ outcome: "captcha_failed" });
    expect(await sentEmails(request, subject)).toHaveLength(0);
  });

  test("a token Cloudflare refuses (forged, expired, reused): nothing is sent", async ({ request }, testInfo) => {
    // On the always-fail server, Cloudflare's real siteverify refuses every
    // token, the dummy one included: the same refusal a forged token gets
    // in production.
    const subject = marker(testInfo);
    for (const token of ["forged.token.value", DUMMY_TOKEN]) {
      const res = await request.post(`${GATE_CLOSED_URL}/api/contact`, { data: body(subject, { token }) });
      expect(res.status(), token).toBe(403);
      expect(await res.json()).toEqual({ outcome: "captcha_failed" });
    }
    expect(await sentEmails(request, subject)).toHaveLength(0);
  });

  test("a filled honeypot or an instant submission: refused, and nothing is sent", async ({ request }, testInfo) => {
    const subject = marker(testInfo);
    for (const overrides of [{ [HONEYPOT_FIELD]: "https://spam.example" }, { elapsedMs: 200 }]) {
      const res = await postContact(request, body(subject, overrides));
      expect(res.status()).toBe(422);
      expect(await res.json()).toEqual({ outcome: "rejected" });
    }
    expect(await sentEmails(request, subject)).toHaveLength(0);
  });

  test("a non-JSON post (a plain cross-site form): refused with 415", async ({ request }, testInfo) => {
    const res = await request.post("/api/contact", {
      headers: { "content-type": "text/plain" },
      data: JSON.stringify(body(marker(testInfo))),
    });
    expect(res.status()).toBe(415);
  });

  test("control: the identical request with the token Cloudflare's widget issued is sent", async ({ request }, testInfo) => {
    // Only the token differs from the refused cases above, so the token is
    // what decides. (The dummy token is accepted only because this run uses
    // Cloudflare's dummy secret; a production secret rejects it.)
    const subject = marker(testInfo);
    const res = await postContact(request, body(subject));
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ outcome: "sent" });
    expect(await sentEmails(request, subject)).toHaveLength(1);
  });
});
