# Bundle report

## First-load JS per route (what the browser downloads)

| route | HTML | scripts | raw KB | gzip KB | brotli KB |
|---|---|---|---|---|---|
| /en | 227.6 KB | 13 | 807.9 | 237.6 | 205.2 |
| /tr | 229.1 KB | 13 | 807.9 | 237.6 | 205.2 |
| /en/this-route-does-not-exist | 10.5 KB | 9 | 509.1 | 146.2 | 125.8 |
| /content-hub | 13.2 KB | 15 | 5864.7 | 1835.3 | 1370.7 |

## /[locale] (public page): client JS by package

Minified bytes per package across every client JS chunk of the route; `first-load` marks chunks present in the HTML.

| package | raw KB | gzip KB (est.) | in first-load chunks |
|---|---|---|---|
| next (client runtime) | 271.1 | 112.9 | yes |
| next (vendored react-dom) | 198.6 | 62.7 | yes |
| next (nomodule polyfill, not downloaded) | 110.0 | 38.5 | no |
| motion-dom | 97.2 | 45.6 | yes |
| (app) src/components/sections | 41.8 | 12.8 | yes |
| framer-motion | 37.6 | 19.0 | yes |
| next (vendored react-server-dom-turbopack) | 23.7 | 7.8 | yes |
| @formatjs/icu-messageformat-parser | 19.7 | 5.3 | yes |
| (app) src/components/layout | 16.1 | 6.4 | yes |
| (app) src/components/projects | 12.2 | 3.8 | yes |
| next (vendored react) | 8.1 | 3.3 | no |
| use-intl | 7.3 | 3.2 | yes |
| @formatjs/icu-skeleton-parser | 6.5 | 2.0 | yes |
| @marsidev/react-turnstile | 6.1 | 2.4 | yes |
| intl-messageformat | 5.7 | 2.0 | yes |
| next-intl | 5.4 | 3.0 | yes |
| (other) /[turbopack]/browser | 5.3 | 2.4 | yes |
| (app) src/components/ui | 5.3 | 2.8 | yes |
| (other) /[turbopack]/shared | 5.1 | 2.2 | yes |
| next (vendored @edge-runtime/cookies) | 4.8 | 1.8 | yes |
| @emotion/is-prop-valid | 4.1 | 2.0 | yes |
| react-icons | 4.0 | 1.8 | yes |
| next (vendored scheduler) | 3.6 | 1.5 | yes |
| (app) src/components/about | 3.5 | 1.5 | yes |
| @emailjs/browser | 2.4 | 1.7 | yes |
| motion-utils | 2.4 | 1.9 | yes |
| next (vendored process) | 2.0 | 0.8 | no |
| (app) src/components/providers | 1.8 | 0.9 | yes |
| lucide-react | 1.6 | 1.3 | yes |
| (app) src/lib | 1.0 | 0.7 | yes |
| @formatjs/fast-memoize | 0.9 | 0.4 | yes |
| (app) src/config | 0.9 | 0.3 | yes |
| @swc/helpers | 0.7 | 0.4 | yes |
| (app) src/i18n | 0.2 | 0.2 | yes |
| @emotion/memoize | 0.1 | 0.1 | yes |
| next | 0.1 | 0.1 | yes |

Total client JS in route: 917.0 KB raw across 14 chunks.

### First-load chunks and what is inside them

| real chunk | raw KB | gzip KB | main contents (raw KB) |
|---|---|---|---|
| 0rwwge57xnfls.js | 198.6 | 62.6 | next (vendored react-dom) 195.1; next (vendored scheduler) 3.6 |
| 09rh3ww0zx3_1.js | 143.6 | 38.6 | next (client runtime) 119.3; next (vendored react-server-dom-turbopack) 23.7; @swc/helpers 0.6 |
| 0.u_2eau_---t.js | 134.9 | 44.7 | motion-dom 96.9; framer-motion 35.5; motion-utils 2.4 |
| 0-bz64fod3k3s.js | 115.3 | 31.0 | (app) src/components/sections 41.8; (app) src/components/layout 16.1; next (client runtime) 14.7; (app) src/components/projects 12.2 |
| 0i.l9589uvx0j.js | 53.5 | 12.6 | next (client runtime) 48.7; next (vendored @edge-runtime/cookies) 4.8 |
| 128aahewwf1we.js | 43.4 | 9.1 | next (client runtime) 43.3 |
| 0robl9a2-4rq7.js | 42.0 | 12.6 | @formatjs/icu-messageformat-parser 19.7; use-intl 7.3; @formatjs/icu-skeleton-parser 6.5; intl-messageformat 5.7 |
| 0wjx1qarcnur7.js | 27.0 | 8.3 | (no analyzer match) |
| 0-w966uza5eby.js | 23.6 | 7.1 | next (client runtime) 23.6 |
| turbopack-08pjk3sk19e4g.js | 10.4 | 4.1 | (other) /[turbopack]/browser 5.3; (other) /[turbopack]/shared 5.1 |
| 0wz8bgo~cvj4l.js | 6.7 | 3.2 | @emotion/is-prop-valid 4.1; framer-motion 1.9; motion-dom 0.3; next-intl 0.2 |
| 067k08~j-8fzt.js | 5.7 | 2.5 | next (client runtime) 5.8 |
| 0x.73w57rn4ou.js | 3.3 | 1.4 | next (client runtime) 3.3 |

### Largest individual modules in the route

| module | raw KB |
|---|---|
| /[project]/node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js | 194.8 |
| /node_modules/next/dist/build/polyfills/polyfill-nomodule.js | 110.0 |
| /[project]/node_modules/motion-dom/dist/es/projection/node/create-projection-node.mjs | 24.4 |
| /[project]/node_modules/next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-client.browser.production.js | 23.6 |
| /[project]/node_modules/next/dist/server/app-render/dynamic-rendering.js | 20.8 |
| /[project]/node_modules/@formatjs/icu-messageformat-parser/index.js | 19.7 |
| /[project]/node_modules/next/dist/client/components/segment-cache/cache.js | 18.6 |
| /[project]/src/components/sections/Contact.tsx | 11.0 |
| /[project]/node_modules/next/dist/client/components/segment-cache/scheduler.js | 9.8 |
| /[project]/node_modules/next/dist/client/components/router-reducer/ppr-navigations.js | 9.1 |
| /[project]/node_modules/next/dist/server/request/params.js | 7.9 |
| /[project]/node_modules/framer-motion/dist/es/gestures/drag/VisualElementDragControls.mjs | 7.8 |
| /[project]/node_modules/next/dist/compiled/react/cjs/react.production.js | 7.6 |
| /[project]/node_modules/next/dist/server/request/search-params.js | 7.4 |
| /[project]/src/components/projects/ProjectModal.tsx | 7.4 |
| /[project]/node_modules/motion-dom/dist/es/render/VisualElement.mjs | 7.0 |
| /[project]/node_modules/next/dist/server/app-render/instant-validation/instant-samples.js | 6.6 |
| /[project]/src/components/layout/Navbar.tsx | 6.5 |
| /[project]/node_modules/@formatjs/icu-skeleton-parser/index.js | 6.5 |
| /[project]/node_modules/next/dist/lib/constants.js | 6.4 |
| /[project]/node_modules/@marsidev/react-turnstile/dist/index.js | 6.1 |
| /[project]/node_modules/intl-messageformat/index.js | 5.7 |
| /[project]/node_modules/next/dist/client/components/segment-cache/navigation.js | 5.5 |
| /[project]/node_modules/next/dist/client/components/app-router.js | 5.4 |
| /[project]/src/components/sections/Projects.tsx | 5.4 |

### Watched packages in the public route

| package | raw KB | gzip KB (est.) | in first-load | also in /content-hub |
|---|---|---|---|---|
| framer-motion | 37.6 | 19.0 | yes | yes |
| motion-dom | 97.2 | 45.6 | yes | yes |
| motion-utils | 2.4 | 1.9 | yes | yes |
| next-intl | 5.4 | 3.0 | yes | no |
| use-intl | 7.3 | 3.2 | yes | no |
| @marsidev/react-turnstile | 6.1 | 2.4 | yes | no |
| @google/genai | 0 | 0 | no | no |
| @emailjs/browser | 2.4 | 1.7 | yes | no |
| lucide-react | 1.6 | 1.3 | yes | no |
| react-icons | 4.0 | 1.8 | yes | no |
| next-sanity | 0 | 0 | no | yes |
| @sanity/client | 0 | 0 | no | yes |
| @sanity/image-url | 0 | 0 | no | yes |
| @sanity/ui | 0 | 0 | no | yes |
| @sanity/vision | 0 | 0 | no | yes |
| sanity | 0 | 0 | no | yes |
| styled-components | 0 | 0 | no | yes |
| next (vendored react-dom) | 198.6 | 62.7 | yes | yes |
| next (vendored react) | 8.1 | 3.3 | no | yes |
| next (client runtime) | 271.1 | 112.9 | yes | yes |

Studio/Gemini/Sanity packages found in public client chunks: none.
