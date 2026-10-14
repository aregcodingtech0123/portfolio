import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "tr"],
  defaultLocale: "en",
  localePrefix: "always",
  // No hreflang Link header from the proxy: it is built from the request host
  // (a preview alias or the www/apex twin would leak into it), while the
  // page's own alternates are built from NEXT_PUBLIC_SITE_URL. The page
  // metadata and the sitemap are the single hreflang source
  // (src/lib/seo/site.ts).
  alternateLinks: false,
});
