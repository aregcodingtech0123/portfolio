# Rate limiting and access to the API routes

There is no rate limiter in the application, on purpose. On serverless hosting every request can land on a different instance, so an in-memory counter in the route handler counts per instance and stops almost nothing. Rate limiting belongs in front of the app, at the host's firewall or a WAF, where one counter sees all traffic. The application does the cheap checks that do not need shared state: size caps, content-type, cross-site refusal, generic errors, and (for translate) being off in production.

## `/api/translate`

The route has **no authentication** and no Studio session check. A Sanity login protects Sanity, not this Next.js route. So:

- **Default:** off in production. It answers `404 {"error":"Not found"}` unless `TRANSLATE_ENABLED=true`. In development it is on.
- **If you enable it in production,** anyone on the internet can call it and spend your Gemini quota. Do both of these:
  1. Add the rate limit below.
  2. Enable it only while you are editing content, then switch it back off. The flag is read at request time, but on serverless hosts an environment change needs a redeploy to take effect.
- The Studio button explains the 404 to the editor ("Translation is turned off on this deployment...").
- Every call is bounded regardless: 32 KB request body, 5,000 characters of text, 8,192 output tokens, a 30 s upstream timeout. The worst case for one anonymous call is a fixed ceiling; the number of calls is what the rate limit controls.

Why a flag and not a Sanity-session gate: the Studio authenticates to `*.api.sanity.io` with cookies that this origin never receives, so a server-side check would need a token the Studio does not obviously expose, and it cannot be proved to work without a logged-in Studio against the real project. A wrong gate either bricks the button or fails open. If you want a real gate later, that is the place to start, with a live Studio to test against.

### Rule to set

| Field | Value |
|---|---|
| Match | path equals `/api/translate` **and** method equals `POST` |
| Counted per | client IP |
| Limit | **10 requests per 60 seconds** |
| Action | deny / block with `429` for at least 60 seconds |

A person clicking Translate on fields makes a few requests a minute at most; 10 leaves room and stops a loop.

Optionally, if you edit from a stable IP, add a rule above it: when the path is `/api/translate` and the IP is **not** yours, deny. That turns the route into one only you can reach.

### How to enter it

- **Vercel:** Project, Firewall, Add rule. Condition: *Request Path* equals `/api/translate` AND *Method* equals `POST`. Then *Rate Limit*, fixed window, 60 s, 10 requests, key *IP Address*, action *Deny*. (Field labels change between dashboard versions; the values above are what matter.)
- **Cloudflare:** Security, WAF, Rate limiting rules. Expression: `(http.request.uri.path eq "/api/translate" and http.request.method eq "POST")`. Characteristic: IP. 10 requests per 1 minute (the free plan restricts the available period and the number of rules; use the closest it allows). Action: Block, duration 1 minute or more.

## `/api/contact`

The route verifies the Turnstile token and then sends the email itself, from the server ([contact.md](contact.md)). The captcha gates every send, so this rate limit is a second layer: it caps how many solved captchas one IP can turn into emails, and how often anyone can make the server call Cloudflare and EmailJS. That protects the mailbox and the EmailJS monthly quota as well as the route.

| Field | Value |
|---|---|
| Match | path equals `/api/contact` **and** method equals `POST` |
| Counted per | client IP |
| Limit | **5 requests per 10 minutes** |
| Action | deny / block with `429` |

A real visitor submits once or twice. Turnstile tokens are single use, so a retry after a failure needs a new solve anyway.

## Check after deploy

- `for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code} " -X POST https://<host>/api/translate -H 'content-type: application/json' -d '{"text":"hi"}'; done` shows `404` (flag off) all the way through, or `200/503...` then `429` once the limit is hit (flag on).
- `curl -sI -X POST https://<host>/api/contact` shows a `429` after the sixth quick POST in the same window.
- The host's firewall log shows the denied requests.

## Notes for the rule

- Key on the IP the host reports (the verified client address), never on the `X-Forwarded-For` header the client can set. The route's own `x-forwarded-for` use is only a hint passed to Turnstile.
- The host also has a hard request body limit of its own (for example 4.5 MB for a serverless function on some hosts). The route's 32 KB cap is the tighter, application-level one.
