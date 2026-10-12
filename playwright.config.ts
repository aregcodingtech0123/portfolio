import { defineConfig, devices } from "@playwright/test";
import {
  MOCK_EMAILJS_ORIGIN,
  MOCK_EMAILJS_PORT,
  MOCK_EMAILJS_PRIVATE_KEY,
} from "./e2e/mock-emailjs/constants";
import { GATE_CLOSED_PORT, SECRET_MISSING_PORT } from "./e2e/servers";

/**
 * E2E runs against a production build (`next build && next start`), not the
 * dev server. Rationale: the ?skin=/?mode= dev query overrides are gated on
 * NODE_ENV==="development" and dead-code-eliminated from a production build,
 * so testing through them would exercise a different runtime than what
 * ships. Every other behavior this suite covers (boot script, persistence,
 * routing, the modal, deep linking, the contact form) is identical in dev
 * and prod, so there is no coverage reason to run dev too. What this
 * deliberately leaves untested: the dev-only query-override convenience
 * feature itself never reaches a real visitor.
 *
 * A dedicated port (3100) avoids colliding with a dev server a developer
 * might already have running on 3000.
 */
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

/** Cloudflare's dummy Turnstile secrets (https://developers.cloudflare.com/turnstile/troubleshooting/testing/). */
const TURNSTILE_SECRET_ALWAYS_PASS = "1x0000000000000000000000000000000AA";
const TURNSTILE_SECRET_ALWAYS_FAIL = "2x0000000000000000000000000000000AA";

/** The environment every app server below shares. */
const appEnv = {
  // This is a production build served from http://localhost with
  // Cloudflare's test keys, which the production env rules would reject
  // (src/lib/env-validation.ts). The test profile relaxes only those
  // rules; the pairing rules still apply to everything below.
  APP_ENV: "test",
  // Blanked so a developer's real .env values can never be loaded into a
  // test build (Next never overrides a variable that is already defined,
  // even as an empty string). Mirrors scripts/perf/env.mjs.
  GEMINI_API_KEY: "",
  SANITY_API_WRITE_TOKEN: "",
  // Unset, so /api/translate is off, as it is on a real deployment
  // (e2e/api-translate.spec.ts). A developer's .env cannot flip it.
  TRANSLATE_ENABLED: "",
  // sanityConfigured=false: every request deterministically serves the
  // real fallback dataset (src/data/migration-portfolio.ts), with no
  // server-side network call for Sanity's content fetch to make at all.
  // See e2e/README or the suite's section-visibility test for why this
  // means that test cannot drive dynamically-empty sections through
  // interception here (Sanity's fetch runs in a Server Component, a
  // separate Node process Playwright's browser-level routing cannot
  // reach) without an application-code change this task's constraints
  // rule out.
  NEXT_PUBLIC_SANITY_PROJECT_ID: "",
  NEXT_PUBLIC_SANITY_DATASET: "",
  // The contact email is sent by the server (server-only values, never
  // in the page). EMAILJS_API_ORIGIN sends it to the local stand-in
  // instead of EmailJS; the override is honoured only under APP_ENV=test,
  // so no automated run can send a real email.
  EMAILJS_SERVICE_ID: "e2e-service",
  EMAILJS_TEMPLATE_ID: "e2e-template",
  EMAILJS_PUBLIC_KEY: "e2e-public-key",
  EMAILJS_PRIVATE_KEY: MOCK_EMAILJS_PRIVATE_KEY,
  EMAILJS_API_ORIGIN: MOCK_EMAILJS_ORIGIN,
  // Cloudflare's documented, fixed Turnstile test keys. The site key is
  // public (baked into the client bundle at build time); the secret is read
  // server-side per request, which is what lets the extra servers below run
  // the same build with a different secret.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: TURNSTILE_SECRET_ALWAYS_PASS,
  NEXT_PUBLIC_SITE_URL: BASE_URL,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "dot" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  // Chromium only, per the task: no WebKit/Firefox, no visual regression.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Started in this order, each awaited before the next, so the two extra
  // app servers reuse the build the main one made.
  webServer: [
    {
      // Stand-in for EmailJS's REST API (e2e/mock-emailjs/server.mjs). The
      // app sends the contact email from the server, which browser routing
      // cannot intercept, so the app is pointed here instead; nothing an
      // automated run does can send a real email.
      command: `node e2e/mock-emailjs/server.mjs`,
      url: `${MOCK_EMAILJS_ORIGIN}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { MOCK_EMAILJS_PORT: String(MOCK_EMAILJS_PORT) },
    },
    {
      command: `npm run build && npm run start -- -p ${PORT}`,
      url: `${BASE_URL}/en`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: appEnv,
    },
    {
      // Same build, Cloudflare's always-FAIL dummy secret: every token is
      // refused by Cloudflare itself. The always-pass dummy secret above
      // accepts any token (verified, despite Cloudflare's testing doc), so
      // this is how the suite proves "refused token, nothing sent" against
      // the real siteverify (e2e/contact-form.spec.ts).
      command: `npm run start -- -p ${GATE_CLOSED_PORT}`,
      url: `http://localhost:${GATE_CLOSED_PORT}/en`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { ...appEnv, TURNSTILE_SECRET_KEY: TURNSTILE_SECRET_ALWAYS_FAIL },
    },
    {
      // Same build, Turnstile secret missing at runtime: the audit's top
      // risk (the site key is baked in, so the widget renders, but the
      // server cannot verify). The visitor must see the honest
      // "unavailable" notice, end to end.
      command: `npm run start -- -p ${SECRET_MISSING_PORT}`,
      url: `http://localhost:${SECRET_MISSING_PORT}/en`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { ...appEnv, TURNSTILE_SECRET_KEY: "" },
    },
  ],
});
