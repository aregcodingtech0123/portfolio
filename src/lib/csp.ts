/**
 * Content-Security-Policy for the site and for the Studio.
 *
 * Delivery mode is a single switch, CSP_MODE. It ships as "report-only": the
 * browser evaluates the whole policy and reports violations (DevTools console,
 * and the `securitypolicyviolation` event the e2e spec listens to) but blocks
 * nothing, so a policy that is wrong for Turnstile or the inline
 * styles cannot break the site. Flip it to "enforce" only after the checklist
 * in docs/security/csp.md has been completed on a preview deploy.
 *
 * Why the policy has 'unsafe-inline' for scripts and styles
 * - Every static page carries ~16 inline scripts: the theme boot script plus
 *   React Server Component payload scripts whose content changes at every
 *   revalidation, so they cannot be hashed.
 * - Nonces need dynamic rendering, which would give up the static pages and
 *   their 10-minute revalidation, and with them the performance work.
 * - experimental.inlineCss puts the stylesheet in a <style> block, and there
 *   are inline style="" attributes.
 * What the policy still does: restricts where the page may send data
 * (connect-src, form-action), which origins may script or frame it, and
 * forbids <object>, <base> hijacking and being framed.
 *
 * Third-party origins, enumerated from the code (the only one the browser
 * contacts):
 * - https://challenges.cloudflare.com: the Turnstile script (script-src), its
 *   iframe (frame-src) and its requests (connect-src).
 * The contact email is sent by the server (/api/contact), so the browser
 * never contacts EmailJS and https://api.emailjs.com is not allowed: a
 * script that tried would be reported (and blocked once enforced).
 * Everything else is same-origin: fonts are self-hosted by next/font, Sanity
 * images are fetched by the server through /_next/image, and Sanity content is
 * fetched on the server.
 *
 * Deliberately absent: upgrade-insecure-requests. It would upgrade the
 * http://localhost requests of the e2e run to https and break them; HSTS at
 * the host does that job in production.
 */

export type CspMode = "report-only" | "enforce";

export const CSP_MODE = "report-only" as CspMode;

export const CSP_HEADER_NAME =
  CSP_MODE === "enforce"
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";

const TURNSTILE = "https://challenges.cloudflare.com";

export type CspDirectives = Readonly<Record<string, readonly string[]>>;

export const SITE_CSP_DIRECTIVES: CspDirectives = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", TURNSTILE],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'"],
  "font-src": ["'self'"],
  "connect-src": ["'self'", TURNSTILE],
  "frame-src": [TURNSTILE],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
};

/**
 * The Studio's full origin set (Sanity API, CDN, websockets, avatars, workers)
 * cannot be derived without running it logged in, so it only gets the
 * directives that need no origin list.
 */
export const STUDIO_CSP_DIRECTIVES: CspDirectives = {
  "frame-ancestors": ["'none'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
};

export function buildCsp(directives: CspDirectives): string {
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}

export const SITE_CSP = buildCsp(SITE_CSP_DIRECTIVES);
export const STUDIO_CSP = buildCsp(STUDIO_CSP_DIRECTIVES);
