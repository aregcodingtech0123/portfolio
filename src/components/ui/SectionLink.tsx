"use client";

import type { AnchorHTMLAttributes } from "react";
import { useLocale } from "next-intl";

type SectionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** Id of a section of the home page, e.g. "projects". */
  section: string;
};

/**
 * A link to a section of the home page (`/en#projects`).
 *
 * A plain anchor on purpose, not the router's <Link>. Section links point at
 * the page the visitor is usually already on, and a same-document hash change
 * is something the browser does natively: no router, no network, instant.
 * Next 16.2 treated a hash-only <Link> click the same way, so this was free.
 * From 16.3 the router runs a full navigation for it and, with
 * prefetch={false}, fetches the page's RSC payload (about 24 KB with the CSS
 * inlined) on every click (e2e/anchor-links.spec.ts guards this). The hrefs
 * are identical to what <Link> rendered, and from another page (the 404) the
 * anchor simply loads the home page at that section.
 */
export function SectionLink({ section, ...props }: SectionLinkProps) {
  const locale = useLocale();
  return <a href={`/${locale}#${section}`} {...props} />;
}
