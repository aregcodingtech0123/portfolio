# Dependency audit triage (2026-10-12)

`npm audit` reported 40 vulnerabilities (2 critical, 23 high, 13 moderate, 2 low) on `next@16.2.6`. Counts alone say little here: most of the install tree is Sanity's CLI and the lint/test toolchain, which never run on the host or reach a visitor. Each finding was classified by where the vulnerable code can actually execute, using evidence from the build rather than package names:

- **Browser:** the per-package composition of the public client chunks (`perf-results/.../bundle.json`, from `npm run perf:bundle`).
- **Server runtime:** the Node File Trace manifests Next writes per route (`.next/server/app/**/*.nft.json`, `.next/next-server.js.nft.json`), plus every package bundled into the server chunks (from their source maps).
- **Dev/build only:** everything else, cross-checked against the lockfile's `dev` flag.

| Class | Meaning | Before | After |
|---|---|---|---|
| **A/B** | Ships to the browser, or runs in the server for an anonymous request | 1 critical, 1 high | **0** |
| **C/D** | Studio code, or server-fetch code that only handles the owner's own data | 2 high, 5 moderate | 2 high, 5 moderate |
| **E** | Dev, build, test or CLI tooling, installed but never executed by the deployed site | 1 critical, 20 high, 8 moderate, 2 low | 1 critical, 19 high, 8 moderate, 2 low |

## Visitor-reachable (A/B), fixed by one bump

| Package | Severity | Why it is reachable | Resolved by |
|---|---|---|---|
| `next` | critical | The framework serves every request. 17 advisories, fixed across 16.2.11, 16.3.3, 16.3.6 and 16.3.8. | `next@16.3.8` |
| `sharp` | high | Next's image optimizer (`/_next/image`) calls it for anonymous requests (libvips, libheif, librsvg CVEs, fixed in 0.35.5). | `next@16.3.8` pulls `sharp@0.35.5` |

`postcss` (high) also cleared with the same bump. It was a copy vendored under `next/node_modules` that only the build uses, so it was never a runtime exposure, but the audit tied it to `next` and it went away with it.

### The `next` advisories and how they apply to this app

The applicability notes are from the advisory titles and this app's configuration. They were not tested exploit by exploit; the patched version is what closes them all.

| Advisory topic | Applies to this app? |
|---|---|
| Middleware/Proxy bypass (Turbopack + single locale) | Two locales; `proxy.ts` only routes locales and guards nothing. Unlikely. |
| Server Actions DoS, SSRF, unbounded payload; internal server function disclosure | The app has no Server Actions, no custom server and no Edge routes. |
| SSRF in rewrites | No rewrites are configured. |
| Image Optimization API: SVG DoS, SSRF, RCE with AVIF | The endpoint exists. Mitigations already in place: formats are WebP only, SVG is off, and `remotePatterns` is now scoped to this project's `cdn.sanity.io` path (or empty when Sanity is not configured). Still the strongest reason to upgrade. |
| Cache poisoning of SSG/ISR pages (self-hosted) | The site is static with a 10-minute revalidate, so the surface exists if you self-host. Platform-managed hosting may not be affected. |
| Cache confusion for requests with bodies | `/api/*` are POST route handlers marked dynamic. Patched regardless. |
| RCE on Windows-hosted servers | Only if the production host is Windows. |
| RCE in `next/og` ImageResponse; metadata image route disclosure | Not used. |
| Dev server MCP endpoint disclosure | Development only. |

## Studio and server-fetch (C/D), left alone

`linkify-it` (high), `nanoid` (high), `markdown-it`, `uuid`, `typeid-js`, `sanity`, `next-sanity` and their moderates. These are bundled into the Studio route (`/content-hub`). A visitor can download that JavaScript, but the vulnerable paths (linkifying or parsing text, generating ids) only receive input the logged-in editor types or pastes. No anonymous input reaches them. They clear with a future `sanity` upgrade; do that as a normal maintenance bump, not under pressure.

## Dev, build, test and CLI (E), documented and left alone

The 1 critical (`tar`) and 19 high: `@sanity/cli` and its tree (`tar`, `adm-zip`, `js-yaml`, `form-data`, `undici`, `@sanity/codegen`, `@sanity/runtime-cli`, `globby`, `fast-glob`, `micromatch`, `braces`, `chokidar`, `brace-expansion`, `smol-toml`), ESLint (`eslint-config-next`, `@next/eslint-plugin-next`), `vite`, `browserslist`, `source-map-js`. None are in a route's file trace, a server chunk or a client chunk. They only run on a developer machine or in CI against trusted input.

## `npm audit fix` suggestions that must not be taken

- `eslint-config-next@14.2.35` (to clear `@next/eslint-plugin-next`): a downgrade across two majors of a dev tool.
- `sanity@5.14.1` and `next-sanity@11.6.13`: downgrades that break the Studio.
- Never `npm audit fix --force`.

## What changed

`next` 16.2.6 to 16.3.8 (exact pin kept), plus its dependencies: `sharp` 0.34.5 to 0.35.5 and libvips 1.2.4 to 1.3.4, `postcss` deduplicated to 8.5.23, `nanoid`, `@swc/helpers`, `@emnapi/runtime`, `semver`. `eslint-config-next` stays at 16.2.6 (dev tooling, not part of the exposure).

16.3.8 over 16.2.12: the newest 16.2.x does not fix the RCE-class and cache-poisoning advisories (they need 16.3.3 to 16.3.8) and still declares the vulnerable `sharp` and `postcss`. 16.3.8 over 16.4.0: it clears every `next` finding on its own, and 16.4.0 behaved identically on the one regression found (below).

### The one regression, and the fix

Next 16.3 changed how a hash-only link click is handled: `/en` to `/en#projects` now runs the full router navigation and, with `prefetch={false}`, fetches the page's RSC payload (`/en?_rsc=...`, about 24 KB) on every click. 16.2.6 scrolled with no request. `e2e/anchor-links.spec.ts` caught it. The in-page links (Hero, Navbar, Footer) are now plain anchors via `src/components/ui/SectionLink.tsx`, which renders the same `/en#projects` hrefs and lets the browser do the same-document scroll natively.

## Keeping it triaged

CI runs `npm audit` as a non-blocking report. To re-run this classification: `npm audit --json`, then check each finding against the three evidence sources above before ranking it. A scanner line is not a visitor-facing vulnerability until it is in the browser bundle or a route's server trace.
