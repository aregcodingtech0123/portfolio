import type { EnvInput } from "@/lib/env-validation";

/**
 * The environment as the running server sees it, for env-validation.
 *
 * Every NEXT_PUBLIC_* variable is referenced literally, on purpose: the
 * bundler inlines those at build time, so what is read here is the value the
 * visitor's browser got, not whatever the host's runtime environment happens
 * to hold now. The server-only variables are read from the runtime
 * environment. Comparing the two is how a build/runtime mismatch (site key
 * baked in, secret missing at runtime) is detected.
 */
export function runtimeEnvSnapshot(): EnvInput {
  return {
    APP_ENV: process.env.APP_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    TRANSLATE_ENABLED: process.env.TRANSLATE_ENABLED,
    SANITY_API_WRITE_TOKEN: process.env.SANITY_API_WRITE_TOKEN,
  };
}
