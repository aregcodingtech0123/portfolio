/**
 * Environment for the perf build and server. Mirrors the webServer.env block
 * in playwright.config.ts so measurements run the same code path the e2e
 * suite exercises, and so no real service can be reached:
 *
 * - Sanity ids empty => sanityConfigured=false => the fallback dataset is
 *   served and no Sanity request is ever made (server or browser).
 * - EmailJS values are server-only dummies (the perf run never submits the
 *   form); Turnstile uses Cloudflare's public test keys.
 * - GEMINI_API_KEY and SANITY_API_WRITE_TOKEN are blanked so the real values
 *   in a developer's .env cannot be loaded (Next never overrides a variable
 *   that is already defined, even as an empty string).
 *
 * The browser side is isolated separately, at the network layer: see
 * HOST_RESOLVER_RULES in lighthouse.mjs.
 */
export const PORT = Number(process.env.PERF_PORT ?? 3200);
export const BASE_URL = `http://localhost:${PORT}`;

export const perfEnv = {
  // Production build on localhost with Cloudflare test keys: the test profile
  // of src/lib/env-validation.ts, which relaxes only the localhost-URL and
  // test-key rules. The pairing rules still apply.
  APP_ENV: "test",
  NEXT_PUBLIC_SANITY_PROJECT_ID: "",
  NEXT_PUBLIC_SANITY_DATASET: "",
  SANITY_API_WRITE_TOKEN: "",
  GEMINI_API_KEY: "",
  TRANSLATE_ENABLED: "",
  // Server-only dummies so the form renders as on a configured site. The perf
  // run never submits it, so nothing is ever sent.
  EMAILJS_SERVICE_ID: "e2e-service",
  EMAILJS_TEMPLATE_ID: "e2e-template",
  EMAILJS_PUBLIC_KEY: "e2e-public-key",
  EMAILJS_PRIVATE_KEY: "e2e-private-key",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  NEXT_PUBLIC_SITE_URL: BASE_URL,
  NEXT_TELEMETRY_DISABLED: "1",
};
