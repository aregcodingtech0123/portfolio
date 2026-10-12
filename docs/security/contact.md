# Contact form: trust model

The contact email is sent **by the server**, and only after Cloudflare Turnstile has verified the visitor's token. The browser never contacts EmailJS and holds no email credential.

## Why it changed

Before, `/api/contact` only verified the Turnstile token and answered `{ok:true}`. The browser then called EmailJS itself with `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `_TEMPLATE_ID` and `_PUBLIC_KEY`, all of which were in the public bundle. Nothing tied the captcha to the send: anyone could post to EmailJS directly, skip the captcha, spam the inbox and use up the free plan's monthly quota, after which real messages were silently refused.

## How it works now

```
browser                         /api/contact (server)                       outside
-------                         ---------------------                       -------
form + Turnstile token  --->    1. JSON only, 64 KB cap, field rules
(JSON, same origin)             2. honeypot empty, form open >= 3 s
                                3. server configured? (EmailJS + Turnstile)
                                4. verify token  ------------------------>  Cloudflare siteverify
                                   (8 s timeout, hostname + action)
                                5. send email   ------------------------->  EmailJS REST API
                                   (private key, 10 s timeout)              POST /api/v1.0/email/send
       <---  { outcome }
```

- **Send mechanism:** EmailJS's REST API called with `fetch` from the server, with the account's **private key** as `accessToken` ([`src/lib/contact/email-transport.ts`](../../src/lib/contact/email-transport.ts)). `@emailjs/browser` cannot do this: it reads `location` and `navigator` and has no private-key parameter. `@emailjs/nodejs` is a thin wrapper around the same request. No dependency was added, and `@emailjs/browser` was removed.
- **Same template.** The parameters are the names the old form fields had: `from_name`, `reply_to`, `subject`, `message`. Your existing EmailJS template keeps working unchanged. CR/LF are stripped from the single-line fields.
- **Turnstile checks:** token required; Cloudflare's verdict; the `hostname` must be the `NEXT_PUBLIC_SITE_URL` host or its www/apex twin; the `action` must be `contact` (set on the widget). A token is valid for 300 s and can be verified once, so the widget is reset after every attempt.
- **Spam friction:** a honeypot field (`fax_extension`, off-screen, `inert`, `aria-hidden`, untabbable, autocomplete off) and a minimum fill time of 3 s, measured from when the form mounted. Both can be faked by a determined bot; they stop naive ones cheaply. Both refuse **visibly** (a message, not a fake success), so a real person who somehow trips one is never told a message was sent when it was not.
- **Logs** carry the reason, never the visitor's message or address.

### The two settings that make it a real boundary

Code cannot set these. They are in the EmailJS dashboard, **Account > Security**:

1. **Allow EmailJS API for non-browser applications: ON.** Otherwise every server call is refused with 403, and the form shows "unavailable".
2. **Use Private Key: ON.** Otherwise anyone who knows the public key and the ids could still send without going through `/api/contact`. The ids are no longer in the page, but they were in older builds, and they are not secrets.

## What the visitor sees, and what is logged

| Situation | HTTP | `outcome` | Visitor sees (en) | Server log (`[api/contact] ...`) |
|---|---|---|---|---|
| Sent | 200 | `sent` | "Your message was sent successfully!" | `sent: contact email accepted by EmailJS` |
| Token missing, forged, expired, reused, wrong host or action | 403 | `captcha_failed` | "The security check did not go through. Please complete it again and resend." | `captcha_failed:` plus Cloudflare's error code or the mismatch |
| Honeypot filled, or sent under 3 s | 422 | `rejected` | "Your message looked automated, so it was not sent..." | `rejected: honeypot field was filled` / `form sent N ms after it opened` |
| Field rules broken (the browser checks first) | 400 | `invalid` | "Some fields could not be accepted..." | (none) |
| EmailJS rate limit, 5xx, timeout or network | 502 | `send_failed` | "Your message could not be sent just now. Please try again in a few minutes." | `send_failed: EmailJS answered 500: ...` |
| **Misconfigured**: EmailJS values missing, Turnstile secret missing, site key missing from the build, EmailJS refusing the keys or settings or quota (4xx), Cloudflare unreachable or rejecting the secret | 503 | `unavailable` | "The contact form is temporarily unavailable, and nothing you send here would reach me. Please write to me directly:" plus your email and LinkedIn. Send stays disabled. | `unavailable:` plus the exact cause and which variable or setting to fix |
| Wrong content type / body over 64 KB | 415 / 413 | `invalid` | (not reachable from the page) | (none) |

The old silent block (site key set, secret missing, every visitor shown "security check failed" forever) is now the `unavailable` row. It is also caught earlier: the production build fails (`turnstile-site-key-without-secret`), and the server logs it at boot (`src/instrumentation.ts`).

If the build already knows the server cannot send (EmailJS values missing at build time, or a production build without a Turnstile site key), the form shows the "unavailable" notice up front instead of letting someone fill it in for nothing.

## Environment variables

| | Variable | Scope | Notes |
|---|---|---|---|
| **Added** | `EMAILJS_SERVICE_ID` | server | All four or none; required in production |
| **Added** | `EMAILJS_TEMPLATE_ID` | server | |
| **Added** | `EMAILJS_PUBLIC_KEY` | server | Still sent as `user_id`; no longer in the page |
| **Added** | `EMAILJS_PRIVATE_KEY` | server | EmailJS dashboard, Account, API keys. The credential that sends mail |
| **Added (test only)** | `EMAILJS_API_ORIGIN` | server | Points the send at the Playwright stand-in. Honoured only under `APP_ENV=test`; a production build with it set fails |
| **Retired** | `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `_TEMPLATE_ID`, `_PUBLIC_KEY` | (was public) | Ignored. The build warns while they are still set; remove them |
| Unchanged | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | public / server | Both or neither; both in production |

Also new in [`src/lib/env-validation.ts`](../../src/lib/env-validation.ts): any `NEXT_PUBLIC_` variable whose name contains SECRET, PRIVATE, TOKEN or PASSWORD is an error, and so are identical public and private EmailJS keys. The page receives exactly one bit about the send, `CONTACT_SEND_CONFIGURED`, a boolean baked in by `next.config.ts`.

## How it is tested (no real email, ever)

- **Unit** ([`route.test.ts`](../../src/app/api/contact/route.test.ts), [`email-transport.test.ts`](../../src/lib/contact/email-transport.test.ts), [`turnstile-server.test.ts`](../../src/lib/turnstile-server.test.ts), [`Contact.test.tsx`](../../src/components/sections/Contact.test.tsx)): every outcome, the body cap and content type, the honeypot and timing, verification strictly before the send, a refused token never reaching the transport, the request EmailJS receives (private key included), and the client's mapping of every outcome. Siteverify and EmailJS are mocked at their boundaries.
- **End to end** ([`e2e/contact-form.spec.ts`](../../e2e/contact-form.spec.ts)): the app sends to a local EmailJS stand-in ([`e2e/mock-emailjs/server.mjs`](../../e2e/mock-emailjs/server.mjs)), which refuses a request without the private key and records what it accepted, so a test asserts real delivery, not just a 200. Turnstile is Cloudflare's real service with its dummy keys. Covered: success; provider outage; EmailJS refusing the settings; and, on extra servers from the same build, a token Cloudflare refuses (always-fail dummy secret) and a missing secret, each asserting that nothing was sent. Every spec fails if the browser contacts `api.emailjs.com`.
- **Finding:** Cloudflare's always-pass dummy secret accepts *any* token, not only the dummy token its testing doc names (checked against the real siteverify). That is why the "refused token sends nothing" case runs on a separate server with the always-fail secret.
- **Built output:** the client chunks and prerendered HTML contain no EmailJS key, id, origin or SDK.

## Manual end-to-end test (one real email)

Automated runs never send mail. To confirm a real email arrives, do this once locally, then again on the preview deploy.

**1. EmailJS dashboard**
- Account > Security: turn ON "Allow EmailJS API for non-browser applications" and "Use Private Key".
- Account > API keys: copy the Public Key and the Private Key. Your service id and template id are unchanged.

**2. `.env.local`** (remove any `NEXT_PUBLIC_EMAILJS_*` lines)
```
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxx
EMAILJS_PUBLIC_KEY=<public key>
EMAILJS_PRIVATE_KEY=<private key>
# Cloudflare's always-pass dummy keys: fine in development, refused by a production build.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**3. Send one**
- `npm run dev`, open http://localhost:3000/en#contact, fill in the form, wait a few seconds, and press Send.
- **Success looks like this:** a green "Your message was sent successfully!", the fields clear, the dev terminal prints `[api/contact] sent: contact email accepted by EmailJS`, and the email arrives with your name, reply-to address, subject and message. In DevTools, Network shows one POST to `/api/contact` and nothing to `api.emailjs.com`.
- The same without a browser:
  ```bash
  curl -i -X POST http://localhost:3000/api/contact -H 'content-type: application/json' \
    -d '{"name":"Manual Test","email":"you@example.com","subject":"Manual end-to-end test","message":"Sent by the server.","token":"XXXX.DUMMY.TOKEN.XXXX","fax_extension":"","elapsedMs":10000}'
  ```
  Expect `HTTP/1.1 200` and `{"outcome":"sent"}`.

**4. Each failure, deliberately** (restart `npm run dev` after each env change)

| Change | Expect (HTTP, page) | Expect in the terminal |
|---|---|---|
| `EMAILJS_PRIVATE_KEY=wrong` | 503; "temporarily unavailable... write to me directly" with your email and LinkedIn; Send disabled | `unavailable: EmailJS answered 403: ...` |
| Turn OFF "Allow EmailJS API for non-browser applications" | 503, the same notice | `unavailable: EmailJS answered 403: API calls are disabled for non-browser applications` |
| Remove `TURNSTILE_SECRET_KEY` (keep the site key) | 503, the same notice | `unavailable: Turnstile verification could not run: TURNSTILE_SECRET_KEY is not set` |
| `TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA` | 403; "The security check did not go through..." | `captcha_failed: siteverify rejected the token: invalid-input-response` |
| curl with `"fax_extension":"x"` | 422 `{"outcome":"rejected"}` | `rejected: honeypot field was filled` |

**5. Prove the provider-side bypass is closed.** With "Use Private Key" ON, the old browser-style call, with the public key and no private key, must now be refused:
```bash
curl -i -X POST https://api.emailjs.com/api/v1.0/email/send -H 'content-type: application/json' \
  -d '{"service_id":"service_xxxxxxx","template_id":"template_xxxxxxx","user_id":"<public key>","template_params":{"from_name":"bypass test","reply_to":"x@example.com","subject":"should not arrive","message":"x"}}'
```
Expect a 4xx refusal and **no email**. If this one arrives, "Use Private Key" is not on and the bypass is still open at the provider.

**6. On the preview deploy** with the real Turnstile keys: `NEXT_PUBLIC_SITE_URL` must be the preview's own URL, and the preview hostname must be in the Turnstile widget's allowed hostnames. Otherwise the hostname check refuses the token (`captcha_failed: token was issued for hostname ...`). Send one message and confirm it arrives.
