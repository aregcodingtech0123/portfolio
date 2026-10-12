/**
 * Environment validation. Pure: it receives the environment as a plain object
 * and never reads process.env itself, so every rule is unit-testable and the
 * same function can run at build time (next.config.ts) and at server boot
 * (instrumentation.ts).
 *
 * The aim is to turn "silently broken in front of a visitor" into "loud at
 * build". The worst case is NEXT_PUBLIC_TURNSTILE_SITE_KEY set while
 * TURNSTILE_SECRET_KEY is missing: the widget renders, every submission is
 * rejected by /api/contact, and nothing tells the site owner.
 *
 * Messages name variables, never values.
 *
 * Profiles
 * - production (default whenever the build is a production build): every rule.
 * - test (APP_ENV=test): for the automated E2E and performance builds, which
 *   are production builds served from http://localhost with Cloudflare's test
 *   keys. It relaxes ONLY the localhost-URL rule, the test-key rule and the
 *   write-token rule. The pairing rules (both-or-neither) stay on, so a
 *   half-configured test build still fails. Never set APP_ENV=test on a real
 *   deployment: it exists so CI can build, and it turns the guards off.
 */

export type EnvInput = Readonly<Record<string, string | undefined>>;

export type EnvIssue = {
  severity: "error" | "warning";
  /** Stable identifier, asserted on in tests. */
  code: string;
  vars: readonly string[];
  message: string;
};

export type ValidateOptions = {
  /** True for a production build or a production server. */
  production: boolean;
};

export type Profile = "production" | "test";

const PLACEHOLDER_PATTERN = /^your[_-]|placeholder|change[_-]?me|^x{3,}$/i;
const CLOUDFLARE_TEST_KEY_PATTERN = /^[123]x/;
const SANITY_API_VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"]);

/**
 * The contact email is sent by the server (/api/contact), so every EmailJS
 * value is server-only. None is NEXT_PUBLIC_: the browser never sends mail.
 */
export const EMAILJS_VARS = [
  "EMAILJS_SERVICE_ID",
  "EMAILJS_TEMPLATE_ID",
  "EMAILJS_PUBLIC_KEY",
  "EMAILJS_PRIVATE_KEY",
] as const;

/** The browser-side names used before the send moved to the server. */
export const RETIRED_EMAILJS_VARS = [
  "NEXT_PUBLIC_EMAILJS_SERVICE_ID",
  "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID",
  "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY",
] as const;

/** Empty and whitespace-only values count as unset, like the code that reads them. */
function value(env: EnvInput, name: string): string {
  return env[name]?.trim() ?? "";
}

/**
 * Whether the server has everything it needs to send the contact email. The
 * build bakes this boolean (never a value) into the page, so the form can say
 * "unavailable" up front instead of failing at submit.
 */
export function isContactSendConfigured(env: EnvInput): boolean {
  return EMAILJS_VARS.every((name) => value(env, name) !== "");
}

export function resolveProfile(env: EnvInput): { profile: Profile; unknown?: string } {
  const raw = value(env, "APP_ENV").toLowerCase();
  if (raw === "test") return { profile: "test" };
  if (raw && raw !== "production") return { profile: "production", unknown: raw };
  return { profile: "production" };
}

/**
 * Whether /api/translate answers at all. Off in production unless
 * TRANSLATE_ENABLED is explicitly "true"; on elsewhere unless it is
 * explicitly "false". The route and the validator share this so they cannot
 * disagree.
 */
export function isTranslateEnabled(env: EnvInput, production: boolean): boolean {
  const flag = value(env, "TRANSLATE_ENABLED").toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return !production;
}

export function validateEnv(env: EnvInput, { production }: ValidateOptions): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const { profile, unknown } = resolveProfile(env);
  const strict = production && profile === "production";

  const add = (
    severity: EnvIssue["severity"],
    code: string,
    vars: readonly string[],
    message: string,
  ) => issues.push({ severity, code, vars, message });

  if (unknown) {
    add(
      "warning",
      "app-env-unknown",
      ["APP_ENV"],
      `APP_ENV="${unknown}" is not recognised (use "test" or leave it unset). Treating this as a production profile.`,
    );
  }

  // --- Site URL -----------------------------------------------------------
  const siteUrl = value(env, "NEXT_PUBLIC_SITE_URL");
  if (strict) {
    if (!siteUrl) {
      add(
        "error",
        "site-url-missing",
        ["NEXT_PUBLIC_SITE_URL"],
        "NEXT_PUBLIC_SITE_URL is required in production. Without it canonical, hreflang and Open Graph URLs point at http://localhost:3000.",
      );
    } else {
      let parsed: URL | null = null;
      try {
        parsed = new URL(siteUrl);
      } catch {
        add("error", "site-url-invalid", ["NEXT_PUBLIC_SITE_URL"], "NEXT_PUBLIC_SITE_URL is not a valid absolute URL.");
      }
      if (parsed) {
        if (parsed.protocol !== "https:") {
          add("error", "site-url-not-https", ["NEXT_PUBLIC_SITE_URL"], "NEXT_PUBLIC_SITE_URL must use https:// in production.");
        }
        const host = parsed.hostname.toLowerCase();
        if (LOCAL_HOSTNAMES.has(host) || host.endsWith(".localhost")) {
          add("error", "site-url-localhost", ["NEXT_PUBLIC_SITE_URL"], "NEXT_PUBLIC_SITE_URL must not point at localhost in production.");
        }
      }
    }
  }

  // --- EmailJS (server-side send): all or none; required in production -----
  const emailjsSet = EMAILJS_VARS.filter((name) => value(env, name));
  const emailjsMissing = EMAILJS_VARS.filter((name) => !value(env, name));
  if (emailjsSet.length > 0 && emailjsMissing.length > 0) {
    add(
      "error",
      "emailjs-partial",
      emailjsMissing,
      `EmailJS is half configured. Set all four of ${EMAILJS_VARS.join(", ")} or none. Missing: ${emailjsMissing.join(", ")}. With any one missing the contact form shows "unavailable" and nothing is sent.`,
    );
  } else if (production && emailjsSet.length === 0) {
    add(
      "error",
      "emailjs-missing",
      EMAILJS_VARS,
      `EmailJS is not configured. In production the contact form could not send anything. Set ${EMAILJS_VARS.join(", ")} (server-only).`,
    );
  }
  if (
    value(env, "EMAILJS_PRIVATE_KEY") &&
    value(env, "EMAILJS_PRIVATE_KEY") === value(env, "EMAILJS_PUBLIC_KEY")
  ) {
    add(
      "error",
      "emailjs-keys-identical",
      ["EMAILJS_PUBLIC_KEY", "EMAILJS_PRIVATE_KEY"],
      "EMAILJS_PUBLIC_KEY and EMAILJS_PRIVATE_KEY have the same value. They are two different keys (EmailJS dashboard, Account, API keys).",
    );
  }
  const retired = RETIRED_EMAILJS_VARS.filter((name) => value(env, name));
  if (retired.length > 0) {
    add(
      "warning",
      "emailjs-retired-vars",
      retired,
      `${retired.join(", ")} ${retired.length > 1 ? "are" : "is"} no longer used: the email is sent from the server now. Remove ${retired.length > 1 ? "them" : "it"} and set ${EMAILJS_VARS.join(", ")} instead.`,
    );
  }
  // The mock-transport override exists only for the Playwright run.
  if (production && profile === "production" && value(env, "EMAILJS_API_ORIGIN")) {
    add(
      "error",
      "emailjs-origin-override",
      ["EMAILJS_API_ORIGIN"],
      "EMAILJS_API_ORIGIN is a test-only override (it points the send at a local mock) and is ignored outside APP_ENV=test. Remove it from this environment.",
    );
  }

  // --- Nothing secret may be NEXT_PUBLIC_ (it would be inlined into the page) --
  const publicSecrets = Object.keys(env).filter(
    (name) => name.startsWith("NEXT_PUBLIC_") && /SECRET|PRIVATE|TOKEN|PASSWORD/.test(name) && value(env, name),
  );
  if (publicSecrets.length > 0) {
    add(
      "error",
      "public-secret",
      publicSecrets,
      `${publicSecrets.join(", ")} looks like a secret but has the NEXT_PUBLIC_ prefix, so its value would be copied into the JavaScript every visitor downloads. Rename it without the prefix.`,
    );
  }

  // --- Turnstile: both or neither; both in production ----------------------
  const siteKey = value(env, "NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  const secretKey = value(env, "TURNSTILE_SECRET_KEY");
  if (siteKey && !secretKey) {
    add(
      "error",
      "turnstile-site-key-without-secret",
      ["TURNSTILE_SECRET_KEY"],
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY is set but TURNSTILE_SECRET_KEY is not. The widget would render and /api/contact would reject every submission, silently blocking every visitor who tries to write to you.",
    );
  } else if (!siteKey && secretKey) {
    add(
      "error",
      "turnstile-secret-without-site-key",
      ["NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
      "TURNSTILE_SECRET_KEY is set but NEXT_PUBLIC_TURNSTILE_SITE_KEY is not. The widget would not render and the form would submit with no captcha at all.",
    );
  } else if (production && !siteKey && !secretKey) {
    add(
      "error",
      "turnstile-missing",
      ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
      "Turnstile is not configured. Production requires both NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.",
    );
  }
  if (siteKey && secretKey) {
    if (siteKey === secretKey) {
      add(
        "error",
        "turnstile-keys-identical",
        ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY have the same value. One of them is wrong, and if it is the secret it is now public.",
      );
    }
    if (siteKey.length >= 33) {
      add(
        "warning",
        "turnstile-site-key-looks-secret",
        ["NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY is as long as a secret key. Check the two values were not swapped: the secret key must never be NEXT_PUBLIC_.",
      );
    }
  }
  if (strict) {
    const testKeyVars = (
      [
        ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", siteKey],
        ["TURNSTILE_SECRET_KEY", secretKey],
      ] as const
    )
      .filter(([, v]) => CLOUDFLARE_TEST_KEY_PATTERN.test(v))
      .map(([name]) => name);
    if (testKeyVars.length > 0) {
      add(
        "error",
        "turnstile-test-key",
        testKeyVars,
        `${testKeyVars.join(" and ")} holds a Cloudflare test key (1x/2x/3x prefix). In production a test key always passes (or always fails), which defeats the captcha. Use the real widget's keys.`,
      );
    }
  }

  // --- Sanity public ids: both or neither ----------------------------------
  const projectId = value(env, "NEXT_PUBLIC_SANITY_PROJECT_ID");
  const dataset = value(env, "NEXT_PUBLIC_SANITY_DATASET");
  if (projectId && !dataset) {
    add("error", "sanity-partial", ["NEXT_PUBLIC_SANITY_DATASET"], "NEXT_PUBLIC_SANITY_PROJECT_ID is set but NEXT_PUBLIC_SANITY_DATASET is not. Sanity would be treated as unconfigured and the site would silently serve the built-in fallback content.");
  } else if (!projectId && dataset) {
    add("error", "sanity-partial", ["NEXT_PUBLIC_SANITY_PROJECT_ID"], "NEXT_PUBLIC_SANITY_DATASET is set but NEXT_PUBLIC_SANITY_PROJECT_ID is not. Sanity would be treated as unconfigured and the site would silently serve the built-in fallback content.");
  } else if (production && !projectId && !dataset) {
    add("warning", "sanity-unconfigured", ["NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET"], "Sanity is not configured. The site will build and serve the built-in fallback content.");
  }
  const apiVersion = value(env, "NEXT_PUBLIC_SANITY_API_VERSION");
  if (apiVersion && !SANITY_API_VERSION_PATTERN.test(apiVersion)) {
    add(
      "error",
      "sanity-api-version-invalid",
      ["NEXT_PUBLIC_SANITY_API_VERSION"],
      "NEXT_PUBLIC_SANITY_API_VERSION must look like YYYY-MM-DD. Sanity rejects anything else and the site would silently fall back to built-in content.",
    );
  }

  // --- Translate / Gemini ---------------------------------------------------
  const geminiKey = value(env, "GEMINI_API_KEY");
  const translateEnabled = isTranslateEnabled(env, production);
  const placeholder = geminiKey !== "" && PLACEHOLDER_PATTERN.test(geminiKey);
  if (placeholder) {
    add(
      production ? "error" : "warning",
      "gemini-placeholder",
      ["GEMINI_API_KEY"],
      "GEMINI_API_KEY still holds a placeholder value. Replace it with a real key or remove it.",
    );
  }
  if (translateEnabled && !geminiKey && production) {
    add("error", "gemini-missing", ["GEMINI_API_KEY"], "TRANSLATE_ENABLED is true but GEMINI_API_KEY is not set, so /api/translate cannot work.");
  }
  if (production && !translateEnabled && geminiKey && !placeholder) {
    add(
      "warning",
      "gemini-unused",
      ["GEMINI_API_KEY"],
      "GEMINI_API_KEY is set but /api/translate is disabled in production (TRANSLATE_ENABLED is not true). Remove the key from this environment.",
    );
  }

  // --- Sanity write token must not exist in production ----------------------
  if (production && value(env, "SANITY_API_WRITE_TOKEN")) {
    add(
      profile === "production" ? "error" : "warning",
      "sanity-write-token-present",
      ["SANITY_API_WRITE_TOKEN"],
      "SANITY_API_WRITE_TOKEN is present in a production environment. It is only for `npm run seed:sanity` on a developer machine; nothing the site runs needs it, and it grants write access to your whole dataset. Remove it from this environment.",
    );
  }

  return issues;
}

export function formatIssues(issues: readonly EnvIssue[]): string {
  return issues
    .map((i) => `  ${i.severity === "error" ? "ERROR  " : "warning"} [${i.code}] ${i.message}`)
    .join("\n");
}
