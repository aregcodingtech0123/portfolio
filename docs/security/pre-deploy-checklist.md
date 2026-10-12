# Pre-deploy checklist

The manual steps code cannot do: host settings, provider dashboards, and checks that need the real services. Tick them before the first production deploy, and revisit the starred ones whenever a key is rotated.

## Host environment

Set every variable in the host's **build** environment as well as at runtime: `NEXT_PUBLIC_*` values are baked in at build time, and a production build with an invalid environment fails on purpose (README, Environment validation).

- [ ] `NEXT_PUBLIC_SITE_URL` = the canonical https URL. The Turnstile hostname check derives from it: if the site is also reachable on the www or apex twin, make the host redirect one to the other.
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`: the real widget's keys, not Cloudflare's 1x/2x/3x test keys.
- [ ] ★ `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`, all server-only, with **no** `NEXT_PUBLIC_` prefix.
- [ ] Remove the retired `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `_TEMPLATE_ID` and `_PUBLIC_KEY` (the build warns while they exist).
- [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`.
- [ ] Not set in production: `SANITY_API_WRITE_TOKEN`, `APP_ENV`, `EMAILJS_API_ORIGIN`, and `GEMINI_API_KEY`/`TRANSLATE_ENABLED` unless you intend to translate in production ([rate-limiting.md](rate-limiting.md)).
- [ ] After the first deploy, read the server log at boot: `src/instrumentation.ts` prints `[env] ...` if anything is wrong. No `[env]` line means the configuration passed.

## EmailJS dashboard ([contact.md](contact.md))

- [ ] ★ Account > Security: **Allow EmailJS API for non-browser applications** is ON. Without it, every send fails and the form shows "unavailable".
- [ ] ★ Account > Security: **Use Private Key** is ON. Without it, anyone holding the public key and the ids can send without the captcha.
- [ ] ★ Run the bypass check in [contact.md](contact.md), step 5: a call with only the public key must be refused.
- [ ] Check the plan's monthly quota and turn on the dashboard's usage notification if it offers one. A used-up quota shows visitors "unavailable" and logs `EmailJS answered 4xx`.
- [ ] The template still uses `{{from_name}}`, `{{reply_to}}`, `{{subject}}`, `{{message}}`, with double braces (escaped), not triple (raw HTML).

## Cloudflare Turnstile

- [ ] The widget's allowed hostnames: the production hostname (and its www/apex twin if both are served), plus the preview hostname while testing.

## Host firewall / WAF ([rate-limiting.md](rate-limiting.md))

- [ ] `/api/contact` POST: 5 per 10 minutes per IP. This now protects the mailbox itself, since the server sends.
- [ ] `/api/translate` POST: 10 per minute per IP, if translate is ever enabled in production.

## Sanity

- [ ] CORS origins: only the production origin (with credentials for the Studio), plus `http://localhost:3000` for local editing.
- [ ] The write token lives in `.env.seed` on your machine only, and is rotated if it was ever shared.

## Preview deploy, with real services

- [ ] ★ One real contact message arrives ([contact.md](contact.md), steps 3 and 6). DevTools Network shows only the POST to `/api/contact`, nothing to `api.emailjs.com`.
- [ ] The "unavailable" path is honest: temporarily set a wrong `EMAILJS_PRIVATE_KEY` on the preview, submit, see "temporarily unavailable... write to me directly", find `[api/contact] unavailable: EmailJS answered 403` in the log, then restore the key.
- [ ] CSP: the browser pass in [csp.md](csp.md). The policy stays Report-Only until that checklist is complete; switching to enforcing is a separate, later step.
- [ ] `curl -sI https://<host>/en` shows HSTS, `content-security-policy-report-only`, no `x-powered-by`.
