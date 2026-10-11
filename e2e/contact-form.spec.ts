import { expect, mockEmailJsSuccess, test } from "./fixtures";

async function fillContactForm(page: import("@playwright/test").Page) {
  await page.goto("/en#contact");
  await page.getByLabel("Full Name", { exact: true }).fill("Test Visitor");
  await page.getByLabel("Email Address", { exact: true }).fill("visitor@example.com");
  await page.getByLabel("Subject", { exact: true }).fill("Hello");
  await page
    .getByLabel("Message", { exact: true })
    .fill("This is an end-to-end test message.");
}

function sendButton(page: import("@playwright/test").Page) {
  return page.getByRole("button", { name: "Send message" }).locator("visible=true");
}

test("happy path: with EmailJS and Turnstile fully configured, a valid submission succeeds", async ({
  page,
}) => {
  await mockEmailJsSuccess(page);
  await fillContactForm(page);

  // Cloudflare's documented always-pass Turnstile test key (see
  // playwright.config.ts) completes on its own, without a click --
  // designed for exactly this kind of automation. Wait for it rather than
  // asserting an exact timing.
  await expect(sendButton(page)).toBeEnabled({ timeout: 15000 });

  await sendButton(page).click();

  await expect(page.getByRole("status")).toHaveText(/sent successfully/i);
});

test("silent-failure risk: Turnstile secret missing on the server surfaces a clear error, not a dead form", async ({
  page,
}) => {
  // This reproduces the single highest-ranked risk from the earlier audit:
  // NEXT_PUBLIC_TURNSTILE_SITE_KEY present (so the widget renders and the
  // client believes a captcha token was obtained) but TURNSTILE_SECRET_KEY
  // missing server-side, so /api/contact's isTurnstileSecretConfigured()
  // returns false and it responds 503. Mocked directly rather than
  // rebuilding with a different server env: the client-side code path
  // under test (handling a 503 from /api/contact) is identical regardless
  // of why the server returned it.
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Turnstile is not configured on the server" }),
    }),
  );

  await fillContactForm(page);
  await expect(sendButton(page)).toBeEnabled({ timeout: 15000 });
  await sendButton(page).click();

  // Next.js's own route announcer also has role="alert", so this filters
  // by text rather than relying on role alone to find a unique match.
  await expect(
    page.getByRole("alert").filter({ hasText: /security check failed/i }),
  ).toBeVisible();
  // The visitor's message was never sent; the form must say so, not just
  // sit there looking like it worked.
  await expect(page.getByRole("status")).toHaveCount(0);
});
