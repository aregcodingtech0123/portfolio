Bilingual (EN/TR) personal portfolio for Arda Ege Tunç, built on Next.js 16 (App Router) with a Sanity-backed CMS and a code fallback dataset, so the site always renders even with no CMS content configured.

## Stack

- **Next.js 16** (App Router, Turbopack) — note: this build renames `middleware.ts` to [`src/proxy.ts`](src/proxy.ts) (exports `proxy`, not `middleware`); everything else about routing is standard
- **React 19**
- **Tailwind CSS v4** — no `tailwind.config.*`; every color/radius/spacing value is a CSS custom property in [`src/app/globals.css`](src/app/globals.css)
- **next-intl** for EN/TR, locale-prefixed routes (`/en`, `/tr`)
- **Sanity** — Studio mounted in-app at `/content-hub` (not `/studio`), with a typed fallback dataset so every section degrades gracefully to seed content
- **Framer Motion** for section/motion transitions
- **EmailJS** for the contact form
- **Google Gemini** for an EN→TR translate-assist button inside Sanity Studio

## Features

- **Two visual skins** (`terminal`, `minimal`) × **two modes** (`dark`, `light`), switchable at runtime from the navbar and persisted to `localStorage`; an inline boot script sets both before first paint to avoid a flash of the wrong theme
- **Content-driven sections** (Hero, About, Projects, Experience, Education, Skills, Certificates, CTF write-ups, Contact) that hide themselves — and their nav/footer links — when they have no content (see [`src/config/sections.ts`](src/config/sections.ts))
- **Shared project case-study modal** used by both skins: keyboard-trapped focus, Esc/backdrop to close, focus returns to the triggering card, and `?project=<code>` deep linking
- **Contact form** via EmailJS that hides itself behind one honest line instead of a form when no real address is configured
- **CMS with a safety net**: every field falls back to [`src/data/migration-portfolio.ts`](src/data/migration-portfolio.ts) when Sanity has nothing for it, so the site is never blank

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in what you need, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/en` or `/tr` based on your browser's locale.

## Environment variables

See [`.env.example`](.env.example) for the full, commented list. Summary:

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` / `_TEMPLATE_ID` / `_PUBLIC_KEY` | Contact form | Without these the form renders disabled with a dev-only notice |
| `NEXT_PUBLIC_SITE_URL` | Metadata, Sanity preview links | Defaults to `http://localhost:3000` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `_DATASET` / `_API_VERSION` | Sanity Studio + content fetch | Without a project ID the site runs entirely on the fallback dataset |
| `SANITY_API_WRITE_TOKEN` | `npm run seed:sanity` only | Server-only, never prefix with `NEXT_PUBLIC_` |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | `/api/translate` (Studio's EN→TR button) | Server-only; optional if you don't need auto-translate |

## Content model & Sanity Studio

- Studio UI: run the app and open `/content-hub` (configured in [`sanity.config.ts`](sanity.config.ts), schemas in [`sanity/schemaTypes/`](sanity/schemaTypes)).
- `npm run seed:sanity` — pushes [`src/data/migration-portfolio.ts`](src/data/migration-portfolio.ts) into your Sanity dataset (projects, experience, education, certificates, skills). Re-running replaces those document types; it does not delete CTF entries or hand-edited site settings. Needs `SANITY_API_WRITE_TOKEN`.
- `npm run sanity:types` — regenerates the Sanity schema extract and typed query results.
- [`src/sanity/fetch.ts`](src/sanity/fetch.ts) merges live Sanity data with the fallback dataset field-by-field, and throws in development if a known placeholder value (e.g. a `*@example.com` address) ever reaches the page.

## Internationalization

- Message catalogs: [`messages/en.json`](messages/en.json), [`messages/tr.json`](messages/tr.json).
- Routing config: [`src/i18n/routing.ts`](src/i18n/routing.ts) — locales are always prefixed (`/en/...`, `/tr/...`).
- `npm run check:copy` (also run as part of `npm run lint`) fails the build if copy in the message files, the fallback data, the seed script, or Sanity schema descriptions contains an em dash or a `TODO` / `[TODO` placeholder.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint, then the copy guard |
| `npm run check:copy` | Copy guard on its own |
| `npm run sanity:types` | Regenerate Sanity schema/types |
| `npm run seed:sanity` | Seed Sanity from the fallback dataset |
| `npm run perf` | Lighthouse baseline against a production build (also `perf:bundle`, `perf:observe`, `perf:inspect`; see [scripts/perf/README.md](scripts/perf/README.md)) |

## Deploy

Deploy like any Next.js app — e.g. the [Vercel Platform](https://vercel.com/new). Set the environment variables above in your hosting provider; without the Sanity ones the site still builds and serves the fallback content.
