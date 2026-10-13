import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * /robots.txt, generated at build time from NEXT_PUBLIC_SITE_URL.
 *
 * Policy (owner decision): every crawler is allowed, AI crawlers included,
 * both the live-search ones (OAI-SearchBot, Claude-SearchBot, PerplexityBot)
 * and the training ones (GPTBot, ClaudeBot, CCBot, Google-Extended,
 * Applebot-Extended). To opt out of training only, add a rule per training
 * user agent with `disallow: "/"` and keep the search agents allowed.
 *
 * /content-hub is deliberately NOT disallowed: it carries a noindex meta tag,
 * and a crawler blocked by robots.txt never sees it. Robots.txt is outside
 * the locale proxy (its matcher skips paths with a dot, src/proxy.ts).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
