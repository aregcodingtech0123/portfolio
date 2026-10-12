import { describe, expect, it } from "vitest";
import {
  formatIssues,
  isTranslateEnabled,
  resolveProfile,
  validateEnv,
  type EnvInput,
} from "@/lib/env-validation";

/** A complete, correct production environment. Each case below breaks one thing. */
const GOOD: Record<string, string> = {
  NEXT_PUBLIC_SITE_URL: "https://portfolio.example.dev",
  NEXT_PUBLIC_EMAILJS_SERVICE_ID: "service_abc",
  NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: "template_abc",
  NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: "pk_abc",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAAkg0s2VIOD34y5",
  TURNSTILE_SECRET_KEY: "0x4AAAAAAAAkg0s2VIOD34y5_secret_value",
  NEXT_PUBLIC_SANITY_PROJECT_ID: "abc123xy",
  NEXT_PUBLIC_SANITY_DATASET: "production",
  NEXT_PUBLIC_SANITY_API_VERSION: "2025-01-01",
};

function env(overrides: Record<string, string | undefined> = {}): EnvInput {
  return { ...GOOD, ...overrides };
}

function errorCodes(e: EnvInput, production = true) {
  return validateEnv(e, { production })
    .filter((i) => i.severity === "error")
    .map((i) => i.code);
}

function warningCodes(e: EnvInput, production = true) {
  return validateEnv(e, { production })
    .filter((i) => i.severity === "warning")
    .map((i) => i.code);
}

describe("a correct production environment", () => {
  it("has no errors and no warnings", () => {
    expect(validateEnv(env(), { production: true })).toEqual([]);
  });
});

describe("NEXT_PUBLIC_SITE_URL", () => {
  it.each([
    ["is missing", undefined, "site-url-missing"],
    ["is blank", "   ", "site-url-missing"],
    ["is not a URL", "not a url", "site-url-invalid"],
    ["uses http", "http://portfolio.example.dev", "site-url-not-https"],
    ["points at localhost", "https://localhost:3000", "site-url-localhost"],
    ["points at 127.0.0.1", "https://127.0.0.1", "site-url-localhost"],
    ["points at a .localhost host", "https://app.localhost", "site-url-localhost"],
  ])("errors in production when it %s", (_label, url, code) => {
    expect(errorCodes(env({ NEXT_PUBLIC_SITE_URL: url }))).toContain(code);
  });

  it("is not checked outside production", () => {
    expect(errorCodes(env({ NEXT_PUBLIC_SITE_URL: undefined }), false)).toEqual([]);
    expect(errorCodes(env({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }), false)).toEqual([]);
  });
});

describe("EmailJS: all three or none, required in production", () => {
  const vars = [
    "NEXT_PUBLIC_EMAILJS_SERVICE_ID",
    "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID",
    "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY",
  ];

  it.each(vars)("is a half-configured error when only %s is missing", (missing) => {
    const issues = validateEnv(env({ [missing]: undefined }), { production: true });
    const partial = issues.find((i) => i.code === "emailjs-partial");
    expect(partial?.severity).toBe("error");
    expect(partial?.vars).toEqual([missing]);
  });

  it("treats a whitespace-only value as missing", () => {
    expect(errorCodes(env({ NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: "  " }))).toContain("emailjs-partial");
  });

  it("errors in production when none of the three are set", () => {
    const e = env({ ...Object.fromEntries(vars.map((v) => [v, undefined])) });
    expect(errorCodes(e)).toContain("emailjs-missing");
  });

  it("allows none outside production, but a half-set state is still an error", () => {
    const none = env({ ...Object.fromEntries(vars.map((v) => [v, undefined])) });
    expect(errorCodes(none, false)).toEqual([]);
    expect(errorCodes(env({ NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: undefined }), false)).toContain(
      "emailjs-partial",
    );
  });
});

describe("Turnstile: both or neither, both in production", () => {
  it("site key without secret is an error naming the secret (the worst half-state)", () => {
    const issues = validateEnv(env({ TURNSTILE_SECRET_KEY: undefined }), { production: true });
    const issue = issues.find((i) => i.code === "turnstile-site-key-without-secret");
    expect(issue?.severity).toBe("error");
    expect(issue?.vars).toEqual(["TURNSTILE_SECRET_KEY"]);
  });

  it("is an error outside production too", () => {
    expect(errorCodes(env({ TURNSTILE_SECRET_KEY: undefined }), false)).toContain(
      "turnstile-site-key-without-secret",
    );
  });

  it("secret without site key is an error", () => {
    expect(errorCodes(env({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined }))).toContain(
      "turnstile-secret-without-site-key",
    );
  });

  it("neither is an error in production and fine outside it", () => {
    const none = env({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined, TURNSTILE_SECRET_KEY: undefined });
    expect(errorCodes(none)).toContain("turnstile-missing");
    expect(errorCodes(none, false)).toEqual([]);
  });

  it.each(["1x00000000000000000000AA", "2x00000000000000000000AB", "3x00000000000000000000FF"])(
    "rejects the Cloudflare test site key %s in production",
    (key) => {
      expect(errorCodes(env({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: key }))).toContain("turnstile-test-key");
    },
  );

  it.each(["1x0000000000000000000000000000000AA", "2x0000000000000000000000000000000AA", "3x0000000000000000000000000000000AA"])(
    "rejects the Cloudflare test secret key %s in production",
    (key) => {
      expect(errorCodes(env({ TURNSTILE_SECRET_KEY: key }))).toContain("turnstile-test-key");
    },
  );

  it("accepts test keys outside production", () => {
    const e = env({
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    });
    expect(errorCodes(e, false)).toEqual([]);
  });

  it("errors when both keys are the same value", () => {
    expect(
      errorCodes(env({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0xSAME", TURNSTILE_SECRET_KEY: "0xSAME" })),
    ).toContain("turnstile-keys-identical");
  });

  it("warns when the site key is as long as a secret", () => {
    expect(
      warningCodes(env({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAAkg0s2VIOD34y5_looks_like_secret" })),
    ).toContain("turnstile-site-key-looks-secret");
  });
});

describe("Sanity public ids: both or neither", () => {
  it("errors when the project id is set without the dataset", () => {
    expect(errorCodes(env({ NEXT_PUBLIC_SANITY_DATASET: undefined }))).toContain("sanity-partial");
  });

  it("errors when the dataset is set without the project id", () => {
    expect(errorCodes(env({ NEXT_PUBLIC_SANITY_PROJECT_ID: undefined }))).toContain("sanity-partial");
  });

  it("only warns when neither is set (the fallback content is a supported mode)", () => {
    const none = env({ NEXT_PUBLIC_SANITY_PROJECT_ID: undefined, NEXT_PUBLIC_SANITY_DATASET: undefined });
    expect(errorCodes(none)).toEqual([]);
    expect(warningCodes(none)).toContain("sanity-unconfigured");
  });

  it.each(["v2025", "2025-1-1", "latest", "2025/01/01"])("errors on the invalid API version %s", (v) => {
    expect(errorCodes(env({ NEXT_PUBLIC_SANITY_API_VERSION: v }))).toContain("sanity-api-version-invalid");
  });
});

describe("Gemini key and the translate flag", () => {
  it("translate is off in production and on elsewhere by default", () => {
    expect(isTranslateEnabled({}, true)).toBe(false);
    expect(isTranslateEnabled({}, false)).toBe(true);
  });

  it.each([
    ["true", true, true],
    ["1", true, true],
    ["TRUE", true, true],
    ["false", false, false],
    ["0", false, false],
  ])("honours TRANSLATE_ENABLED=%s", (flag, inProd, inDev) => {
    expect(isTranslateEnabled({ TRANSLATE_ENABLED: flag }, true)).toBe(inProd);
    expect(isTranslateEnabled({ TRANSLATE_ENABLED: flag }, false)).toBe(inDev);
  });

  it("does not require a key while translate is disabled in production", () => {
    expect(errorCodes(env())).toEqual([]);
  });

  it("requires a key when translate is enabled in production", () => {
    expect(errorCodes(env({ TRANSLATE_ENABLED: "true" }))).toContain("gemini-missing");
  });

  it("accepts a real key when translate is enabled", () => {
    expect(errorCodes(env({ TRANSLATE_ENABLED: "true", GEMINI_API_KEY: "AIzaSyRealLookingKey1234567890" }))).toEqual([]);
  });

  it.each(["your_gemini_api_key_here", "your-key", "PLACEHOLDER", "changeme", "xxxxxxxx"])(
    "rejects the placeholder %s in production",
    (key) => {
      expect(errorCodes(env({ TRANSLATE_ENABLED: "true", GEMINI_API_KEY: key }))).toContain("gemini-placeholder");
    },
  );

  it("only warns about a placeholder outside production", () => {
    const e = env({ GEMINI_API_KEY: "your_gemini_api_key_here" });
    expect(errorCodes(e, false)).toEqual([]);
    expect(warningCodes(e, false)).toContain("gemini-placeholder");
  });

  it("warns about a real key sitting in a production env where translate is disabled", () => {
    expect(warningCodes(env({ GEMINI_API_KEY: "AIzaSyRealLookingKey1234567890" }))).toContain("gemini-unused");
  });
});

describe("SANITY_API_WRITE_TOKEN", () => {
  it("is an error in production", () => {
    expect(errorCodes(env({ SANITY_API_WRITE_TOKEN: "sk_write" }))).toContain("sanity-write-token-present");
  });

  it("is fine outside production", () => {
    expect(validateEnv(env({ SANITY_API_WRITE_TOKEN: "sk_write" }), { production: false })).toEqual([]);
  });
});

describe("the test profile (APP_ENV=test)", () => {
  const TEST_PROFILE = env({
    APP_ENV: "test",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    NEXT_PUBLIC_SANITY_PROJECT_ID: "",
    NEXT_PUBLIC_SANITY_DATASET: "",
  });

  it("builds with a localhost URL and Cloudflare test keys", () => {
    expect(errorCodes(TEST_PROFILE)).toEqual([]);
  });

  it("downgrades the write token to a warning (a developer's .env always carries it)", () => {
    const e = { ...TEST_PROFILE, SANITY_API_WRITE_TOKEN: "sk_write" };
    expect(errorCodes(e)).toEqual([]);
    expect(warningCodes(e)).toContain("sanity-write-token-present");
  });

  it.each([
    ["Turnstile site key without secret", { TURNSTILE_SECRET_KEY: undefined }, "turnstile-site-key-without-secret"],
    ["Turnstile secret without site key", { NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined }, "turnstile-secret-without-site-key"],
    ["a half-set EmailJS config", { NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: undefined }, "emailjs-partial"],
    ["a half-set Sanity config", { NEXT_PUBLIC_SANITY_PROJECT_ID: "abc123xy" }, "sanity-partial"],
  ])("still fails on %s", (_label, override, code) => {
    expect(errorCodes({ ...TEST_PROFILE, ...override })).toContain(code);
  });

  it("is not triggered by APP_ENV values other than test", () => {
    expect(resolveProfile({ APP_ENV: "TEST" }).profile).toBe("test");
    expect(resolveProfile({ APP_ENV: "staging" })).toEqual({ profile: "production", unknown: "staging" });
    expect(resolveProfile({})).toEqual({ profile: "production" });
    const e = env({ APP_ENV: "staging", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" });
    expect(errorCodes(e)).toContain("site-url-localhost");
    expect(warningCodes(e)).toContain("app-env-unknown");
  });
});

describe("messages never contain a value", () => {
  it("formats variable names and rules only", () => {
    const secret = "SECRET-VALUE-MUST-NOT-APPEAR";
    const issues = validateEnv(
      env({
        TURNSTILE_SECRET_KEY: secret,
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: secret,
        GEMINI_API_KEY: secret,
        SANITY_API_WRITE_TOKEN: secret,
        NEXT_PUBLIC_SITE_URL: "http://" + secret + ".example.dev",
        TRANSLATE_ENABLED: "true",
      }),
      { production: true },
    );
    expect(issues.length).toBeGreaterThan(0);
    expect(formatIssues(issues)).not.toContain(secret);
  });
});
