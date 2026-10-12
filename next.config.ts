import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Hero portrait, relative to public/. Keep in step with the file you ship. */
const HERO_PORTRAIT = "/images/profilephoto.jpeg";

const nextConfig: NextConfig = {
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
    return [
      {
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
      },
    ];
  },
};

export default withNextIntl(nextConfig);
