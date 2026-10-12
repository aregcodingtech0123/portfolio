import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import createNextIntlPlugin from "next-intl/plugin";
import { CSP_HEADER_NAME, SITE_CSP, STUDIO_CSP } from "./src/lib/csp";
import { formatIssues, validateEnv } from "./src/lib/env-validation";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const NEWLINE = "\n";

/** Hero portrait, relative to public/. Keep in step with the file you ship. */
const HERO_PORTRAIT = "/images/profilephoto.jpeg";

const nextConfig: NextConfig = {
  // Do not advertise the framework (X-Powered-By: Next.js).
  poweredByHeader: false,
  env: {
    // Decided once per build (empty string = no photo, so the hero shows its
    // empty frame). See src/lib/portrait.ts.
    HERO_PORTRAIT_SRC: existsSync(path.join(process.cwd(), "public", HERO_PORTRAIT))
      ? HERO_PORTRAIT
      : "",
  },
  experimental: {
    // The site and the Studio are separate root layouts (no app/layout.tsx), so
    // unmatched URLs are served from app/global-not-found.tsx.
    globalNotFound: true,
    // Inline the (render-blocking) stylesheet into the HTML instead of linking it,
    // which removes one network round trip from the critical path. Measured
    // effect: scripts/perf, docs/performance/after-fixes-2026-10-12.md. The
    // performance budget assumes this is on.
    inlineCss: true,
  },
  transpilePackages: ["next-sanity", "sanity"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async headers() {
    const baseline = {
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    };

    // The dev server needs 'unsafe-eval' and websockets for HMR, so the policy
    // is a production-build concern only. Delivery mode (report-only vs
    // enforce) is CSP_MODE in src/lib/csp.ts; see docs/security/csp.md.
    if (process.env.NODE_ENV !== "production") return [baseline];

    return [
      baseline,
      // The site: every document except the Studio. A static page cannot carry
      // a per-request nonce, which is why this is a config header and not
      // proxy.ts. Static assets, images and API responses are excluded: a CSP
      // only governs documents, and on those responses it was ~430 uncompressed
      // bytes each (measured: +8 KB transferred, slower simulated-mobile LCP).
      {
        source: "/((?!content-hub|api/|_next/|images/|favicon\\.ico).*)",
        headers: [{ key: CSP_HEADER_NAME, value: SITE_CSP }],
      },
      // The Studio: only the directives that need no origin list.
      {
        source: "/content-hub/:path*",
        headers: [{ key: CSP_HEADER_NAME, value: STUDIO_CSP }],
      },
    ];
  },
};

/**
 * Configuration as a function so the build phase is known. A production build
 * with a missing or inconsistent environment fails here, before anything is
 * compiled, instead of shipping a site whose contact form silently blocks
 * visitors. Rules and rationale: src/lib/env-validation.ts. Dev only warns;
 * the running production server is checked in src/instrumentation.ts, which
 * logs and never throws.
 */
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_DEVELOPMENT_SERVER) {
    const production = phase === PHASE_PRODUCTION_BUILD;
    const issues = validateEnv(process.env, { production });
    const errors = issues.filter((i) => i.severity === "error");
    if (issues.length > 0) {
      const report = formatIssues(issues);
      if (production && errors.length > 0) {
        throw new Error(
          [
            "",
            `Environment validation failed (${errors.length} error(s)). Refusing to build a site that would break in front of visitors:`,
            report,
            "",
            "Local or CI build that is not a real deployment? Set APP_ENV=test (see src/lib/env-validation.ts).",
            "",
          ].join(NEWLINE),
        );
      }
      // Next loads this file in several processes per build; the marker is
      // inherited by the children, so the warnings print once.
      if (!process.env.ENV_VALIDATION_REPORTED) {
        process.env.ENV_VALIDATION_REPORTED = "1";
        console.warn(
          ["", `[env] ${issues.length} configuration issue(s):`, report, ""].join(NEWLINE),
        );
      }
    }
  }
  return withNextIntl(nextConfig);
}
