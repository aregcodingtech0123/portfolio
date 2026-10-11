/**
 * Public Turnstile site key (inlined at build time via NEXT_PUBLIC_*).
 * Server-side verification lives in `@/lib/turnstile-server`.
 */
export const turnstileSiteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export const turnstileConfigured = turnstileSiteKey.length > 0;

/** Dev-only hint; uses warn so Next.js does not surface a console-error overlay. */
export function reportTurnstileMissing() {
  if (turnstileConfigured || process.env.NODE_ENV === "production") return;
  console.warn(
    "[Contact] Turnstile keys are unset. CAPTCHA is skipped until NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are configured.",
  );
}
