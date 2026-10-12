# Performance after the three fixes, 2026-10-12

Written for: the site owner. This is the single authoritative record of the performance phase: what each change measured, the experimental flags in use, and the enforced budget.

Follows [baseline-2026-10-12.md](baseline-2026-10-12.md). Every number below was measured on a production build with `scripts/perf` after each commit (en, dark mode, both skins; Lighthouse medians of 5, observer medians of 3). Nothing is an estimate.

> **Status: phase closed.** Sections up to "Cleanups" were written before the close-out round (inlineCss, anchor prefetch, budget tightening) and show the numbers at that point. The final state, the experimental flags and the final budget are in "Close-out round" and after.

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

## Close-out round

Three changes, each its own commit, each measured with the same harness (`npm run perf`, 5 runs per configuration, `median (min-max)`; "applied" rows use `--throttling devtools`).

### inlineCss on (commit d9fb0a1)

The 12.6 KB stylesheet was a render-blocking request, one more round trip before first paint. `experimental.inlineCss` puts it in the HTML. The build runs with both experimental flags and prints no warnings.

**Mobile, Lighthouse applied throttling (real Slow 4G + 4x CPU), before -> after inlineCss:**

| config | score before | score after | FCP before | FCP after | LCP before | LCP after | KB before | KB after | CLS after |
|---|---|---|---|---|---|---|---|---|---|
| en-terminal-dark | 90 (89-90) | 93 (89-93) | 2013 (1901-2027) | 1283 (1251-1295) | 2196 (2168-2360) | 1871 (1862-1919) | 557 | 581 | 0.0027 |
| en-terminal-light | 90 (88-90) | 92 (91-93) | 2003 (1906-2022) | 1275 (1245-1330) | 2198 (2173-2439) | 1892 (1863-1931) | 557 | 581 | 0.0027 |
| en-minimal-dark | 92 (91-92) | 94 (93-95) | 1860 (1852-2038) | 1272 (1240-1276) | 2169 (2120-2381) | 1878 (1874-1924) | 527 | 550 | 0.0001 |
| en-minimal-light | 91 (89-92) | 95 (92-95) | 2020 (1838-2030) | 1275 (1263-1292) | 2381 (2122-2437) | 1892 (1880-1926) | 527 | 550 | 0.0001 |
| tr-terminal-dark | 88 (87-90) | 90 (90-91) | 1884 (1834-1990) | 1219 (1212-1254) | 2184 (2135-2423) | 1880 (1849-1905) | 593 | 616 | 0.0026 |
| tr-terminal-light | 87 (86-89) | 91 (90-91) | 1961 (1878-1998) | 1251 (1220-1270) | 2395 (2179-2451) | 1889 (1837-1904) | 593 | 616 | 0.0026 |
| tr-minimal-dark | 89 (88-90) | 94 (93-94) | 1834 (1771-2071) | 1218 (1204-1269) | 2201 (2138-2408) | 1902 (1888-1920) | 570 | 593 | 0.0001 |
| tr-minimal-light | 90 (89-91) | 94 (93-95) | 1960 (1778-2047) | 1209 (1198-1226) | 2364 (2162-2410) | 1882 (1875-1944) | 570 | 593 | 0.0003 |

**Mobile, Lighthouse simulated, before -> after:**

| config | score before | score after | FCP before | FCP after | LCP before | LCP after | KB before | KB after | CLS after |
|---|---|---|---|---|---|---|---|---|---|
| en-terminal-dark | 80 (80-85) | 80 (79-81) | 1507 (1506-1517) | 1505 (1504-1512) | 5142 (4304-5218) | 5210 (4990-5359) | 558 | 581 | 0.0006 |
| en-terminal-light | 80 (79-85) | 80 (80-85) | 1508 (1506-1511) | 1504 (1504-1507) | 5173 (4285-5209) | 5193 (4377-5202) | 558 (557-558) | 581 | 0.0001 |
| en-minimal-dark | 82 (82-88) | 86 (81-88) | 1207 (1206-1210) | 1205 (1204-1207) | 4839 (3844-4843) | 4137 (3933-4976) | 527 | 550 | 0.0000 |
| en-minimal-light | 82 | 87 (81-88) | 1208 (1207-1209) | 1205 (1204-1206) | 4842 (4822-4850) | 3989 (3937-4978) | 527 | 550 | 0.0001 |
| tr-terminal-dark | 78 (78-80) | 78 (78-84) | 1808 (1807-1810) | 1805 (1804-1806) | 5507 (5064-5526) | 5514 (4430-5587) | 593 | 616 | 0.0007 |
| tr-terminal-light | 78 (77-79) | 78 (78-84) | 1807 (1807-1809) | 1804 (1804-1807) | 5502 (5429-5550) | 5512 (4429-5583) | 593 | 616 | 0.0007 |
| tr-minimal-dark | 86 (85-86) | 85 (85-86) | 1507 (1506-1509) | 1504 (1504-1506) | 4141 (4137-4304) | 4362 (4141-4385) | 570 | 593 | 0.0002 |
| tr-minimal-light | 86 | 85 (84-86) | 1507 (1507-1509) | 1505 (1504-1506) | 4137 (4136-4140) | 4234 (4137-4393) | 570 | 593 | 0.0005 |

**Desktop, simulated, before -> after:**

| config | score before | score after | FCP before | FCP after | LCP before | LCP after | KB before | KB after | CLS after |
|---|---|---|---|---|---|---|---|---|---|
| en-terminal-dark | 98 (98-99) | 98 | 407 (406-409) | 404 (365-406) | 1077 (833-1081) | 1097 (1058-1101) | 558 (557-558) | 581 (581-594) | 0.0002 |
| en-terminal-light | 98 | 98 | 407 (407-411) | 405 (404-406) | 1077 (1077-1085) | 1100 (1097-1101) | 558 (557-558) | 581 | 0.0002 |
| en-minimal-dark | 99 | 98 (98-99) | 328 (326-329) | 325 (324-326) | 1038 (1034-1039) | 1071 (1005-1078) | 527 | 550 | 0.0001 |
| en-minimal-light | 99 (98-99) | 98 | 329 (327-332) | 324 (324-326) | 1038 (1037-1046) | 1071 (1062-1076) | 527 | 550 | 0.0001 |
| tr-terminal-dark | 98 | 98 | 448 (446-448) | 445 (444-446) | 1119 (1117-1127) | 1155 (1153-1158) | 593 | 616 | 0.0003 |
| tr-terminal-light | 98 | 98 | 448 (447-448) | 445 | 1120 (1060-1122) | 1160 (1154-1163) | 593 | 616 | 0.0003 |
| tr-minimal-dark | 98 (98-99) | 99 (98-99) | 407 (406-409) | 405 (404-405) | 1076 (831-1078) | 878 (873-1118) | 570 | 593 | 0.0020 |
| tr-minimal-light | 98 (98-99) | 99 (98-99) | 407 (407-409) | 405 (404-406) | 1077 (835-1082) | 874 (872-1120) | 570 | 593 | 0.0020 |

(KB "after" includes inlineCss's +23 KB; the anchor-prefetch change below takes it back.) Observer, real throttling, en dark: mobile FCP 1072 -> **744 ms** and LCP 1484 -> **1028 ms** (terminal); 1020 -> 732 and 1476 -> 1008 ms (minimal); long tasks 192 -> 146 ms.

- **The terminal score now clears the floor with margin.** Applied, en dark, terminal: 90 (89-90) -> 93 (89-93). Over a later 15-run sample, single runs are 91-93 (median 92), where before they were 86-90 across 20 runs. The remaining spread is why the gate uses the median of 5.
- **Simulated mode does not move at all** (terminal score 80 -> 80, FCP 1507 -> 1505 ms, LCP unchanged within its bimodal spread). The gain exists only under real throttling, which is why the budget gates on that.
- **Are the font-change regressions absorbed?** Measured with a 2x2 experiment on terminal, mobile, 5 runs each (fonts preloaded or not, inlineCss off or on). Simulated FCP: preloaded 907 ms, not preloaded 1507 ms, and inlineCss changes neither (1024 with preloaded fonts, 1505 without). So the simulated FCP "regression" is **not** absorbed: it is the price of not preloading, a modelling effect of the fonts starting after the CSS. Under applied throttling there never was an FCP regression: 2102 ms with fonts preloaded and 2013 ms without, and inlineCss takes both to about 1280 ms (-0.8 s). **CLS is not absorbed either**: applied terminal CLS is 0.0027 with or without preloading and with or without inlineCss, so it was not caused by the font change; it stays well inside the 0.005 limit. The font change itself is worth about +8 score points under applied throttling (fonts preloaded 82-84, not preloaded 90-93).
- **Nothing visible broke.** `e2e/inline-css.spec.ts` (new): the HTML carries its CSS and links no stylesheet; in all four skin and mode combinations the page is styled at first paint with every script and font held back for 3 s (background follows the mode, heading at the CSS's size). I also looked at the first-paint screenshots of terminal/dark and minimal/light. The existing no-JS and reduced-motion visibility specs and the theme-boot spec (no flash of the wrong theme) all pass. The suite went from 69 to 76 e2e tests (5 inline-CSS, 2 anchor-link) and all 76 pass.
- **Costs:** +23 KB transferred (the CSS is inlined once in the HTML and again inside each RSC payload), and a second experimental flag.

### In-page anchor prefetch off (commit eb653f8)

The hero, nav and footer links (`/#projects`, `/#contact`, `/`) point into the current route, so `next/link` prefetched the page you were on: **4 RSC requests, 23.4 KB** per page view (12 KB before inlineCss). Measured with them off, en, 5 runs:

| | prefetch on | prefetch off |
|---|---|---|
| RSC requests / KB | 4 / 23.4 | **0 / 0** |
| transferred, terminal / minimal | 581 / 550 KB | **558 / 527 KB** (-4%) |
| applied terminal: FCP, LCP, TBT | 1283, 1871, 318 ms | 1302, 1886, 346 ms |
| applied minimal: FCP, LCP, TBT | 1272, 1878, 268 ms | 1257, 1876, 257 ms |
| simulated mobile terminal: score, FCP | 80, 1505 ms | 80, 1506 ms |

Verdict: applied, because it removes a deterministic 23 KB and 4 requests with no cost to navigation. It does not speed anything up: the timing differences are inside run-to-run noise. `e2e/anchor-links.spec.ts` pins that there is no `_rsc` request on load and that clicking an in-page link scrolls to the section and fetches nothing, in both skins.

### Budget tightened (commit bb4c2a4)

See "The budget" below.

## Final state

| mobile, applied throttling, en dark (15 runs) | terminal | minimal |
|---|---|---|
| score | 92 (91-93) | 94 (93-95) |
| LCP | 1.87 s (1.83-1.92) | 1.89 s (1.85-1.97) |
| FCP | 1.29 s (1.27-1.32) | 1.27 s (1.23-1.30) |
| TBT | 328 ms (303-358) | 269 ms (244-279) |
| CLS | 0.0027 | 0.0001 |
| transferred | 558 KB | 527 KB |

Baseline in this mode: score 66 / 69, LCP 7.58 s, 871 KB. Observer (real throttling, browser's own LCP): about 1.0 s. Lighthouse simulated, which the budget only tracks: terminal 79-80 (LCP 5.2 s), minimal about 87 (LCP 4.0 s); desktop 98, LCP 1.07 s. First-load JS 238.6 KB gzip, unchanged by this phase.

## Experimental flags in use

| flag | why | what removing it costs |
|---|---|---|
| `experimental.globalNotFound` | the site and the Studio are separate root layouts (no `app/layout.tsx`), which is what lets `/en` and `/tr` be static; Next then needs `app/global-not-found.tsx` for unmatched URLs | the build fails (no layout to compose a 404 from), or the pages go back to dynamic |
| `experimental.inlineCss` | removes the render-blocking stylesheet request: applied mobile FCP about -0.7 s, LCP about -0.3 s, score +2 to +3 | applied terminal score falls to 88-90 and the budget fails, including a dedicated check that the CSS is inline |

Both carry upgrade risk on a Next version bump; `perf:budget`, `e2e/not-found.spec.ts` and `e2e/inline-css.spec.ts` are what would show a change in behavior.

## The budget (`scripts/perf/budget.json`, `npm run perf:budget`, two CI steps)

Assumes: the production build with both flags above on, hero/nav/footer anchors not prefetched, only Inter preloaded, and `/en` and `/tr` static.

| check | measured | limit | headroom |
|---|---|---|---|
| mobile (applied) score | terminal 91-93, minimal 93-95 | **>= 91** | one point under the terminal median; a median of 5 never fell below 91 in 20,000 resamples of the 15 runs, and the build without inlineCss scores 88-90, so removing it fails |
| mobile (applied) LCP | 1.83-1.97 s | **<= 2.1 s** | about +10% over the worst run; without inlineCss 2.2 s fails |
| mobile (applied) FCP | 1.23-1.32 s | **<= 1.6 s** | +20%; without inlineCss 1.9 s fails |
| mobile (applied) TBT | terminal 303-358 ms | <= 350 ms | none to spare, **not tightened**: CPU-bound and already at the noise limit; the score check carries it |
| mobile CLS | 0.0027 / 0.0001 | **<= 0.005** | deterministic |
| mobile transferred | 558 / 527 KB | **<= 575 KB** | deterministic, +3% |
| largest image | 24.6 KB | <= 30 KB | |
| preloaded fonts | 130.6 KB | <= 135 KB | |
| first-load JS gzip, `/en` and `/tr` / not-found | 238.6 / 143.8 KB | <= 242 / 150 KB | +1.4% |
| first-load JS raw, `/en` | 810.9 KB | <= 830 KB | |
| `/en` cacheable | `s-maxage=600` | not `no-store` | |
| assumption: inlineCss is on | 0 linked stylesheets, 68 KB inline | 0 linked | |
| Studio / `@sanity/*` / `next-sanity` / `@google/genai` in public chunks | none | none | |
| desktop minimal (simulated) | score 98, LCP 1.07 s, FCP 0.32 s, TBT 0 | >= 97, <= 1.25 s, <= 0.5 s, <= 30 ms | |
| mobile terminal (simulated) tripwire | score 79-80, LCP 4.4-5.2 s, FCP 1.505 s | >= 77, <= 5.6 s, <= 1.7 s | wide on purpose: its LCP is bimodal |

The brief's floors (score 90, LCP 3.0 s, 250 KB JS, 650 KB transferred) are all beaten by these limits; no limit was loosened in this round. How the headroom was chosen: the byte and CLS checks are deterministic, so they sit 3% over; the timing checks move by about one score point and 5% under applied throttling, which a median of 5 plus one automatic re-measure absorbs, so the limits sit a point or about 10% beyond what was seen. Ordinary variance passes; a regression the size of one of the flags above does not.

**Proof it bites:** a tightened copy of the budget exited 1 on exactly the tightened rows (JS 238.6 > 200 KB; score 91 and 94 < 96; LCP 1.85 and 1.87 s > 1.5 s). A real build with `inlineCss` removed failed 9 checks: the assumption row, terminal score 88 and minimal 90 (< 91), LCP 2.22 and 2.17 s, FCP 1.93 and 1.89 s, TBT 387 ms, and simulated transfer 583 KB. The real budget passes on the final build: 8 bundle checks and 28 Lighthouse checks.

**Cheap vs slow in CI** (unchanged): the bundle step (about a minute, deterministic) and the Lighthouse step (about four minutes, median of 5 on a reduced matrix, CPU slowdown calibrated only for a clearly slower host, one automatic re-measure for timing-only breaches) are separate steps after e2e.

## Still open

- **The simulated (PageSpeed-style) basis does not meet the original floors** (terminal 79-80 / LCP 5.2 s; minimal about 87 / 4.0 s). Under real throttling the site is at 92-94 and 1.9 s. Closing the simulated gap needs fewer bytes before the LCP, which is the excluded work.
- **The Lighthouse CI step has not run on a GitHub runner**; the CPU calibration and the CI-only sandbox flags are untested. Expect to adjust `referenceBenchmarkIndex` or the TBT limit after the first CI run.
- **Terminal TBT (about 330 ms) is the main drag on the terminal score**; it is hydration work, outside this phase.
- Desktop minimal CLS read 0.0027 in the observer after inlineCss (0.0001 before): still inside the 0.005 limit, 3 runs, not investigated.
