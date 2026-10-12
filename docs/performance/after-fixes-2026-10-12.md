# Performance after the three fixes, 2026-10-12

Written for: the site owner, to see what each fix measured and what the enforced budget is.

Follows [baseline-2026-10-12.md](baseline-2026-10-12.md). Every number below was measured on a production build with `scripts/perf` after each commit (en, dark mode, both skins; Lighthouse medians of 5, observer medians of 3). Nothing is an estimate.

## Two ways of measuring mobile, and why they disagree

| method | what it is | terminal | minimal |
|---|---|---|---|
| **Lighthouse, simulated** (default, what PageSpeed Insights uses) | loads unthrottled, then models Slow 4G + 4x CPU | score 80, LCP 5.1 s | score 88, LCP 3.8 s |
| **Lighthouse, applied** (`throttlingMethod: devtools`) | really throttles the browser | score 90, LCP 2.2 s | score 91, LCP 2.2 s |
| **Observer** (CDP throttling, browser's own LCP) | really throttles, reads the PerformanceObserver | LCP 1.49 s | LCP 1.46 s |

The simulated model charges the LCP for every byte the page asks for before the LCP, so it stays near 5 s even though the browser paints the portrait in 1.5 s. The applied and observer numbers agree with each other and with how a throttled phone actually behaves, so **the budget gates mobile on applied throttling** and keeps the simulated numbers as a wide tripwire. This matters for one of your floors: **on the simulated (PageSpeed-style) basis the mobile score is 80-88 and LCP 3.8-5.1 s, which does not meet "score >= 90, LCP <= 3.0 s". On the applied basis it does.** See "Open decisions".

## Fix 1: portrait on the server (commit 4834914)

Cause: `PortraitFrame` rendered the `<Image>` only after hydration and a client `HEAD` probe, so the file could not start downloading until about 3.7 s of JavaScript had run, and its preload never reached the HTML. Now the image, a preload and its intrinsic size are in the first HTML; whether a photo exists is decided on the server (`lib/portrait.ts`, later moved to build time), the empty frame still renders when there is none, and a photo that later fails still falls back to the empty frame.

| (observer, applied Slow 4G + 4x CPU) | before | after |
|---|---|---|
| mobile LCP, terminal | 4932 ms | **2256 ms** (-54%) |
| mobile LCP, minimal | 4924 ms | **2232 ms** (-55%) |
| desktop LCP, minimal | 1248 ms | 824 ms |
| CLS, mobile terminal / minimal | 0.0006 / 0.0001 | 0.0006 / 0.0001 (unchanged) |
| CLS, desktop minimal | 0.0167 | 0.0030 |
| `HEAD /images/profilephoto.jpeg` requests | 2 per visit | 0 |

Lighthouse simulated mobile LCP moved only 6143 -> 5967 ms, which is the disagreement above. Behavior confirmed by tests added in this commit: the `<img>` and its `<link rel=preload>` are in the server HTML (e2e fetches `/en` without a browser); with JavaScript disabled the portrait is visible, loaded and 3:4; no `HEAD` request and zero layout shifts on the portrait in both skins; unit tests for the photo, the empty frame (aria-hidden, no `<img>`) and the error fallback.

## Fix 2: About photo (commit 8465c42)

Cause: a raw 1200x1600 JPEG (197,077 B) shown in a 160 px box, eager, and fetched even in the minimal skin where its block is `display: none`. Now `next/image` with `sizes="160px"`, lazy.

| | before | after |
|---|---|---|
| the photo, terminal, desktop (visible) | 197,077 B | **13,138 B** (w=256) |
| the photo, terminal, phone (below the fold) | 197,077 B | 0 B until scrolled near |
| the photo, minimal (hidden) | 197,077 B | **0 B** |
| mobile transferred (Lighthouse, every config) | 870 KB | **677 KB** (-193 KB, -22%) |

e2e added: terminal never requests the raw original and each optimized variant is under 60 KB; minimal requests only the hero portrait's optimized URL. (A hidden image shares the hero's already-loaded 384 px variant when the browser picks it, so "one URL" is the correct outcome there.)

## Fix 3: fonts (commit 1b2e890)

Bricolage Grotesque, Source Serif 4 and JetBrains Mono now have `preload: false`; Inter (both skins' body font) stays preloaded. Their `@font-face` rules and `display: swap` are unchanged, so each is fetched when the active skin first paints with it.

| per visit | before | after |
|---|---|---|
| en, terminal | 342,356 B (8 files) | **215,420 B** (4 files, -37%) |
| en, minimal | 342,356 B (8 files) | **184,656 B** (3 files, -46%) |
| tr, terminal | 342,356 B | 249,364 B (6 files) |
| tr, minimal | 342,356 B | 226,696 B (4 files) |

Applied-throttling mobile: LCP 2204 -> **1464 ms** (terminal), 2224 -> **1460 ms** (minimal); FCP 1296 -> 1048 / 1248 -> 1012 ms. Mobile transfer 677 -> 551 / 520 KB. Runtime switching verified by a new e2e (`fonts.spec.ts`): in each skin the other skin's heading family is `unloaded` before the switch, the heading stays visible during it, and the family loads on demand afterwards. Costs, measured: Lighthouse-simulated mobile FCP rises 905 -> 1508 ms (terminal) because the fonts now start after the CSS; terminal CLS 0.0006 -> 0.0027 (the heading font swap). Preloading the terminal fonts as well was tried and measured worse on both throttling methods (applied score 86-87 vs 90-92), so only Inter is preloaded.

## Cleanups

- **NodeGraph.tsx deleted** (commit 5c27073): no reference anywhere in `src`, `e2e`, `scripts`, `messages` or config.
- **`/[locale]` is now static with 10-minute revalidation** (commit 2628b18). Build output before: `ƒ /[locale]` (dynamic, `Cache-Control: private, no-cache, no-store`). After: `● /[locale]` with `/en` and `/tr`, `Revalidate 10m`, `Expire 1y`, `Cache-Control: s-maxage=600, stale-while-revalidate=31535400`. Cause isolated by build experiments: the root layout's `getLocale()` reads request headers; adding `setRequestLocale` to the page alone changed nothing, removing `getLocale()` from the root layout made it static. So `app/layout.tsx` is gone: the site and the Studio are separate root layouts sharing `app/root-shell.tsx`, `lang` comes from the route param, unmatched URLs are served from `app/global-not-found.tsx` (needs `experimental.globalNotFound`, the one experimental flag now in use), and `app/page.tsx` was dropped because the proxy already redirects `/`. Measured: TTFB 13 -> 6 ms (mobile), 12 -> 6 ms (desktop) locally; main-thread long tasks in a throttled mobile load 503 -> 184 ms (terminal), 479 -> 204 ms (minimal); LCP unchanged. A new `not-found.spec.ts` pinned 404, redirect and `lang` behavior and passed both before and after.
  - **Regression found and fixed**: on a prerendered page, `router.replace()` back to the bare path does nothing when the visitor arrived through a `?project=` link, so a deep-linked modal could not be closed (the existing deep-linking e2e caught it). `Projects` now uses `history.replaceState`, which the App Router syncs into `useSearchParams`.
  - **Hazard avoided**: the portrait's existence is checked once per build in `next.config.ts`, not with `fs` while rendering. A render-time check would have dropped the photo the first time a host without `public/` in its server bundle regenerated the page.
  - **Not verifiable offline**: how the page behaves against the live Sanity project (build-time fetch, 10-minute regeneration). The fetch code already catches errors and falls back to the bundled content, so a Sanity outage at build bakes fallback copy until the next regeneration.

## Totals (Lighthouse simulated, mobile, en dark, median of 5)

| | baseline | now |
|---|---|---|
| transferred | 871 KB | **558 KB** terminal / **527 KB** minimal (-36% / -39%) |
| mobile score, applied throttling | 66 / 69 | **90 / 91** |
| mobile LCP, applied throttling (Lighthouse) | 7.58 s | **2.2 s** |
| mobile LCP, observer | 4.93 s | **1.49 s** |
| mobile score, simulated | 76 / 77 | 80 / 88 |
| desktop score, simulated | 97 / 97 | 98 / 99 |
| first-load JS gzip | 237.6 KB | 238.6 KB (unchanged) |

## The budget (`scripts/perf/budget.json`, enforced by `npm run perf:budget`, two CI steps)

| check | measured | limit | notes |
|---|---|---|---|
| first-load JS gzip, `/en`, `/tr` | 238.6 KB | **245 KB** | floor was 250; tightened to the measured value + ~3% |
| not-found first-load JS gzip | 143.8 KB | 150 KB | |
| first-load JS raw, `/en` | 810.8 KB | 830 KB | |
| preloaded fonts | 130.6 KB | 140 KB | catches a re-preloaded family |
| Studio / `@sanity/*` / `next-sanity` / `@google/genai` in public chunks | none | none | module-level, `/[locale]` and not-found |
| `/en` cacheable | `s-maxage=600` | not `no-store` | catches a slide back to dynamic |
| mobile (applied) score | 90 / 91 | **>= 90** | at the floor, see below |
| mobile (applied) LCP | 2.15-2.47 s | **2.8 s** | floor was 3.0 s |
| mobile (applied) FCP / TBT / CLS | 1.9-2.0 s / 260-325 ms / <= 0.003 | 2.4 s / 350 ms / 0.01 | |
| mobile transferred | 558 / 527 KB | **590 KB** | floor was 650 |
| largest image | 24.6 KB | 40 KB | |
| desktop minimal (simulated) | score 99, LCP 1.04 s | >= 95, 1.4 s | |
| mobile terminal (simulated) tripwire | score 80, LCP 4.9-5.2 s | >= 74, 5.8 s | wide on purpose; not the floors |

**Cheap vs slow:** the bundle step (about a minute, no timing, deterministic) runs on every push as its own step. The Lighthouse step (about four minutes) also runs on every push but on a reduced matrix: mobile in both skins, desktop in the minimal skin (the only place the portrait can be the desktop LCP), and one simulated config. Locale and colour mode are left out because the baseline showed them within noise of each other. The Lighthouse stage uses medians of 5, calibrates the CPU slowdown only on a clearly slower host, and re-measures once before failing on a timing-only breach.

**Proof it bites:** a tightened copy of the budget (`/en` JS 200 KB, a forbidden-package pattern that matches `motion-dom`, mobile LCP 1.5 s, score 97) exited 1 with exactly those rows failing (`first-load JS gzip, /en: 238.6 KB > 200`, `public chunks: motion-dom`, score, LCP; plus TBT 359 ms > 350 on that single noisy run). The real budget then passed on the fixed build: `Performance budget passed: 7 checks` (bundle) and `28 checks` (Lighthouse).

## Open decisions and what is still weak

1. **Terminal mobile score sits at the floor.** Applied-throttling single runs were 87-91 (medians of 5: 90.0, 90.0, 91.0), so the `>= 90` gate will occasionally fail even with the retry. Measured option, not applied: `experimental.inlineCss: true` took the applied score to 92/93, FCP 2.0 -> 1.27 s and LCP 2.2 -> 1.9 s, for +23 KB transfer and a second experimental flag. The alternative is to lower the gate to 88. Both are your call; I did neither.
2. **The PageSpeed-style (simulated) basis fails the floors** (80-88, 3.8-5.1 s), as explained at the top. Closing that gap means sending fewer bytes before the LCP, i.e. the marginal items the baseline said not to do.
3. **Four RSC prefetches instead of one** now run after load (about 12 KB, low priority, off the LCP path): the in-page `#projects` / `#contact` links prefetch the now-static route. `prefetch={false}` on those links would remove them; not done.
4. **The Lighthouse step has not run on a GitHub runner.** It was written to calibrate for a slower host and to disable Chromium's sandbox there (`CI`), but both are untested; expect to adjust `referenceBenchmarkIndex` or TBT after the first CI run.
