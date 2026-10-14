import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl, homeLanguageAlternates } from "@/lib/seo/site";

/**
 * /sitemap.xml: the two localized home pages, each with the same hreflang set
 * as the page metadata (en, tr, x-default). Generated at build time.
 *
 * No lastmod: the content has no trustworthy modification date to give, and
 * a build timestamp would claim changes that did not happen. No ?project=
 * URLs: they render the same page and canonicalize to it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    Object.entries(homeLanguageAlternates()).map(([lang, path]) => [lang, absoluteUrl(path)]),
  );
  return routing.locales.map((locale) => ({
    url: absoluteUrl(`/${locale}`),
    alternates: { languages },
  }));
}
