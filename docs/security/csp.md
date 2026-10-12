# Content-Security-Policy

Status: **Report-Only.** The browser evaluates the policy and reports violations, and blocks nothing. The switch is one constant, `CSP_MODE` in [`src/lib/csp.ts`](../../src/lib/csp.ts).

## What is sent

Production builds only (the dev server needs `unsafe-eval` and websockets, so it gets no CSP). Set in `headers()` in [`next.config.ts`](../../next.config.ts):

| Source | Header | Policy |
|---|---|---|
| every document except `/content-hub` | `Content-Security-Policy-Report-Only` | `default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| `/content-hub` (Studio) | `Content-Security-Policy-Report-Only` | `frame-ancestors 'none'; object-src 'none'; base-uri 'self'` |

Also sent on every path, unchanged: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. `X-Powered-By` is removed (`poweredByHeader: false`). `X-Frame-Options` keeps protecting against framing while `frame-ancestors` is only reported.

The site entry's `source` is `/((?!content-hub|api/|_next/|images/|favicon\.ico).*)`. The policy is not sent on static assets or API responses: a CSP only governs documents, and on every response it added about 430 uncompressed bytes (measured: +8 KB transferred and a slower simulated-mobile LCP on the first attempt, which sent it on all paths).

Why a static header and not `proxy.ts`: the pages are statically generated and revalidated every 10 minutes. A nonce needs a fresh value per request, which needs dynamic rendering and would give up the static pages and the performance work. Each page carries about 16 inline scripts (the theme boot script plus React Server Component payloads that change at every revalidation), so they cannot be hashed either. That is why `script-src` has `'unsafe-inline'`. It means this policy does **not** stop an injected inline script; there is no injection sink in the site today. What it does enforce is where the page may send data, which origins may script or frame it, and that nothing can embed it or use `<object>` or `<base>`.

### Third-party origins (the only one the browser contacts)

| Origin | Used for | Directive |
|---|---|---|
| `https://challenges.cloudflare.com` | Turnstile script, iframe and requests | `script-src`, `frame-src`, `connect-src` |

The contact email is sent by the server (`/api/contact`), so the browser never contacts EmailJS and `https://api.emailjs.com` is not allowed (removed when the send moved server-side; see [contact.md](contact.md)). Fonts are self-hosted by `next/font`, Sanity images are fetched by the server through `/_next/image`, and Sanity content is fetched on the server. `upgrade-insecure-requests` is deliberately absent: it would break the `http://localhost` end-to-end run, and HSTS at the host does that job in production.

## How to read violations

There is intentionally no report collector endpoint: a public, unauthenticated POST route would be new attack surface for little gain at this size.

- **In a browser:** open DevTools, Console. Report-Only violations appear as `[Report Only] Refused to connect to ... because it violates the following Content Security Policy directive: ...`. Open Network, click the document, and check the response headers for `content-security-policy-report-only`.
- **In the automated suite:** [`e2e/csp.spec.ts`](../../e2e/csp.spec.ts) listens for the `securitypolicyviolation` event while it loads `/en`, `/tr` and a 404 in all four skin/mode combinations, with the real Turnstile widget, a project modal and a mocked send. It fails and prints directive, blocked URI and source line. It also contains a positive control (a deliberately forbidden resource must be reported), so a silent listener cannot pass. If it fails, fix the policy in `src/lib/csp.ts`; do not weaken the test.
- **To collect from real visitors for a while:** add a `report-uri` directive pointing at a hosted collector (for example report-uri.com) in `src/lib/csp.ts` for the soak period, then remove it.

## Checklist before flipping Report-Only to enforced

This is a manual step on a **preview deploy** with production settings. Do not do it from localhost: the automated run uses Cloudflare's test keys, a mocked EmailJS and no Sanity, so it cannot prove the real services.

Preview setup
- [ ] Preview is served over HTTPS with the production environment: real Turnstile keys, the four server-only EmailJS values, Sanity project and dataset set, `NEXT_PUBLIC_SITE_URL` set. (The build fails otherwise; see README, Environment validation.)
- [ ] `curl -sI https://<preview>/en` shows `content-security-policy-report-only` with the exact policy above, and **no** `content-security-policy`. Repeat for `/tr`, a 404 URL and `/content-hub`. Confirm the host did not strip, duplicate or add a CSP header of its own.
- [ ] If the host injects tooling into previews (for example a comments or toolbar overlay), expect violations from it that will not exist in production. Test on the production-like deployment, or note them as host-only.

Browser pass (Chrome, Firefox and Safari; console open, no `[Report Only]` line allowed)
- [ ] `/en` and `/tr`, both skins and both modes. Scroll the whole page.
- [ ] Contact form with the **real** widget: it renders, completes (including a visible challenge if Cloudflare shows one), and a real submission reaches your inbox (sent by the server). In DevTools, Network shows only a POST to `/api/contact`, never a request to `api.emailjs.com`. Do this at least three times.
- [ ] Sanity-driven content: project images, CTF cover images and their modal. They come through `/_next/image` (`img-src 'self'`), so any direct `cdn.sanity.io` request in Network is a finding.
- [ ] Project modal open and close in both skins.
- [ ] A page served after a revalidation (wait over 10 minutes after a content change, or trigger one, then load it): the new RSC payload scripts must run.
- [ ] A 404 URL.
- [ ] `/content-hub`: log in and edit a document. The Studio only has the three origin-free directives, so there must be no report; confirm login and the translate button still work.

Soak
- [ ] Leave it in Report-Only for as long as you are comfortable, with the collector option above if you want real-visitor data. No unexplained violation.

The flip
- [ ] In `src/lib/csp.ts` set `CSP_MODE = "enforce"`.
- [ ] Update the two tests that assert report-only on purpose (`src/lib/csp.test.ts` and the `delivery` block of `e2e/csp.spec.ts`) so they assert the `content-security-policy` header instead, then run the whole pipeline: lint, typecheck, unit, e2e, `perf:budget`.
- [ ] Deploy to the preview again and repeat the browser pass above with enforcement on. This time a violation is a broken feature, not a console line.
- [ ] Rollback is the same one-line change back to `"report-only"`.

## Not covered

- The Studio's real origin set (Sanity API, CDN, websockets, avatars, workers) is not derivable without a logged-in session, so the Studio has no `default-src`/`connect-src`. Deriving it is a separate task.
- HSTS is the host's job; verify it with `curl -sI` after deploy.
