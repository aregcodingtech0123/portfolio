import { defineConfig, devices } from "@playwright/test";

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
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `${BASE_URL}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
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
      // Non-empty so emailjsConfigured is true (the form renders enabled);
      // the real send call is always intercepted in the browser, never real.
      NEXT_PUBLIC_EMAILJS_SERVICE_ID: "e2e-service",
      NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: "e2e-template",
      NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: "e2e-public-key",
      // Cloudflare's documented, fixed Turnstile test keys: always pass.
      // Site key is public (baked into the client bundle at build time);
      // secret key is read server-side at request time, so a test that
      // needs the server to see a *missing* secret mocks /api/contact's
      // response directly instead of rebuilding with a different env.
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      NEXT_PUBLIC_SITE_URL: BASE_URL,
    },
  },
});
