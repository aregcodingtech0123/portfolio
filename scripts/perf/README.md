# Performance measurement

Repeatable, offline performance measurement of the **production build** in Chromium. Nothing here is wired into CI yet; the budget comes after the first round of fixes.

| Command | What it does | Output |
|---|---|---|
| `npm run perf` | `next build`, `next start`, then Lighthouse 13 (performance category) over every locale x skin x mode x form factor, 5 runs each | `perf-results/summary.md`, `runs.json`, `raw/*.json` (full Lighthouse reports) |
| `npm run perf:bundle` | Runs `next experimental-analyze --output`, then reports first-load JS per route (raw, gzip, brotli) and client JS by package | `perf-results/bundle.md`, `bundle.json` |
| `npm run perf:observe` | Real-browser loads with *applied* Slow 4G / 4x CPU throttling: every LCP candidate, layout-shift sources, long tasks, event timing for scripted interactions (INP ingredients) | `perf-results/observe.json` |
| `npm run perf:inspect` | Fonts used vs fetched, image sizes vs display boxes, CSS split by skin and coverage, duplicated DOM, JS coverage, a CPU profile of a throttled load | `perf-results/inspect.json` |

Useful flags (after `--`): `--runs 3`, `--skip-build` (reuse `.next`), `--form mobile|desktop`, `--locale en`, `--skin terminal`, `--mode dark`, `--out dir`. The server runs on port 3200 (`PERF_PORT` to change), so it does not collide with the e2e server on 3100 or `next dev` on 3000.

Run order for a full baseline: `npm run perf`, then `npm run perf:observe -- --skip-build`, `npm run perf:inspect -- --skip-build`, `npm run perf:bundle`. Close other heavy programs first; the CPU-bound metrics (TBT) are the first thing a busy machine distorts.

## How a given skin and mode is forced

The `?skin=` / `?mode=` overrides are compiled out of production builds, so they cannot be used. Instead, before every navigation the harness registers a script (Puppeteer `evaluateOnNewDocument` for Lighthouse, Playwright `addInitScript` for the others) that writes `skin` and `theme` into `localStorage` on the site's origin. It runs before the inline boot script in `<head>`, which is exactly how a returning visitor's saved choice is read. Lighthouse still clears storage and the HTTP cache before loading, so every run is a cold first visit, and the seed is applied at document creation, after that reset. After each run the harness reads `<html data-skin>` and the `dark`/`light` class back and flags the run if they differ from what was requested (`verified` in `runs.json`).

## Never touching the real network

- Chromium is launched with `--host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE localhost"`. Every hostname except localhost fails at the resolver, so Turnstile, EmailJS, Sanity, Gemini and Google Fonts cannot be reached whatever the page does. Attempted requests still show up as failed entries (`challenges.cloudflare.com` does, because the contact form mounts the Turnstile widget).
- The server is built and started with the same env block as `playwright.config.ts` (empty Sanity ids so the fallback dataset is served, dummy EmailJS ids, Cloudflare's public test keys) plus blank `GEMINI_API_KEY` and `SANITY_API_WRITE_TOKEN`, so real values in a developer's `.env` are never loaded. See `env.mjs`.
- `next build` itself downloads the Google fonts (`next/font/google`) unless they are cached in `.next/cache`. That is a build-time step, not a measurement run.

## What the numbers are, and are not

- **Lighthouse** uses its default *simulated* throttling (load unthrottled, then model Slow 4G + 4x CPU for mobile; 10 Mbps, no CPU slowdown for desktop). That is what PageSpeed Insights uses, so scores are comparable, but the simulation can disagree with a throttled real load; `perf:observe` is the cross-check.
- The CPU slowdown is a fixed multiplier. Lighthouse records a `BenchmarkIndex` for the host; a fast desktop (index well above ~1500) makes mobile TBT optimistic.
- Treat single runs as noise. `summary.md` reports `median (min-max)`; a wide range means the metric is not trustworthy at that precision.
- Not measurable offline: the Turnstile script and iframe (third party, blocked by design), EmailJS, Sanity-hosted project screenshots (the fallback dataset has none), Brotli transfer sizes (`next start` serves gzip; production hosting usually serves Brotli, `bundle.md` reports both).
