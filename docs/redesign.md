# Minimal skin redesign

The Terminal skin is guarded by `e2e/terminal-baseline.spec.ts`. After each redesign phase, run `npx playwright test e2e/terminal-baseline.spec.ts` from the repo root. It must pass with no snapshot update. The spec checks two things: full-page screenshots of the terminal skin in light and dark, for `/en` and `/tr`, at widths 390, 768 and 1440 (viewport height 900), and the computed CSS custom properties on `<html>` against `e2e/baselines/terminal-tokens.json`. Pixel snapshots were captured on Windows and are compared only on that OS, because font rasterization differs elsewhere. The token check runs everywhere. Skin is seeded in localStorage, not via `?skin=`, because the production build this suite serves compiles that override out. To recapture on purpose, run `UPDATE_TERMINAL_TOKENS=1 npx playwright test e2e/terminal-baseline.spec.ts --update-snapshots`, or dump tokens against an already running site with `BASE_URL=http://localhost:3100 npx tsx scripts/dump-terminal-tokens.ts`.

## Simple design system

Simple is `data-skin="minimal"` on `<html>`. It is monochrome in both modes: black, white and neutral greys. The only hue is `--danger`, a muted red for form errors. Type is Source Serif 4 for headings (`--heading-face`), Inter for body, and JetBrains Mono for labels (`font-code`, or the literal `var(--font-jetbrains)` in plain CSS). In this skin `font-mono` resolves to Inter, so do not use it for code.

Every Simple rule in `src/app/globals.css` is prefixed with `[data-skin="minimal"]` and sits outside `@layer`, so it beats Tailwind utilities. Do not edit `:root`, `.dark`, `.light`, `@theme`, `@layer base`, keyframes, `.decor`, `.reveal-*` or `.profile-duotone`. Those are shared with Terminal.

### Tokens

Layout and rhythm, on `[data-skin="minimal"]`:

| Token | Role |
| --- | --- |
| `--page-max` | Content box, 70rem (1120px) |
| `--gutter` | Side padding |
| `--measure` | Cap for running text, 68ch |
| `--space-section` | Gap before a major section |
| `--space-section-minor` | Gap before a section that continues the previous topic |
| `--space-header` | Gap between the eyebrow and the heading |
| `--space-group` | Gap between a heading and its content |
| `--nav-h` | Navbar height, used by sticky labels |
| `--r-sm` / `--r-md` | 6px corners for controls, 12px for cards |

Palette, on `[data-skin="minimal"]` and `[data-skin="minimal"].light`. Dark is the default.

| Token | Role |
| --- | --- |
| `--background`, `--surface`, `--surface-strong` | Page, card, emphasis. Dark mode gets lighter as it steps up; light mode gets darker |
| `--border` / `--border-strong` | Soft hairline, and the near-full-contrast rule for cards, inputs and section tops |
| `--foreground`, `--muted`, `--subtle` | Text steps. Each clears WCAG AA 4.5:1 on all three surfaces |
| `--danger` | Form errors only |
| `--inv-*` | The other mode's values. Only `.band-invert` reads them |

### Utilities

Compose these. Do not re-state their font, size or colour with Tailwind.

| Class | Use |
| --- | --- |
| `.m-container` | The page grid. Navbar, sections and footer |
| `.m-measure` | Caps a paragraph without moving its left edge |
| `.m-section` | Top gap and scroll-margin. Set `--section-gap` for the minor step |
| `.m-section-mark` | 2px rule above the eyebrow |
| `.m-display`, `.m-h2`, `.m-h3`, `.m-h2-statement` | Serif display, section heading, card title, long sentence used as a heading |
| `.m-eyebrow`, `.m-meta`, `.m-lead` | Mono label, secondary line, intro paragraph |
| `.m-card`, `.m-border-strong`, `.m-bg-surface-strong` | Card surface. `.m-card-empty` is the dashed empty state |
| `.m-pop` / `.m-lift` | Hard-shadow lift. `.m-pop` lifts on hover and focus; `.m-lift` is the static raise |
| `.m-btn`, `.m-btn-primary`, `.m-btn-ghost`, `.m-btn-sm` | Buttons. Primary and ghost swap fill on hover |
| `.m-chip`, `.m-tag`, `.m-pill` | Outlined chips, skill tags, status pill |
| `.m-field` | 1px strong field with a 2px focus ring |
| `.m-error` | Error text plus a drawn "!". Pair with `role="alert"` |
| `.m-success` | Filled confirmation. Pair with `role="status"` |
| `.m-wipe` | Underline that wipes in on hover. No travel when reduced motion is on, or when the device has no hover |
| `.m-stagger` | Children fade in as they enter, each a step after the last. First four are staggered; the rest share one delay |
| `.band-invert` | Swaps the palette for one region. Do not nest one band inside another |

### Section header

`Section` renders `SimpleSectionMark`, which reads `sectionNumbers()` from `src/config/sections.ts`. The mark is a 2px rule and a mono eyebrow, "01 / About", and it is `aria-hidden` because the heading below it is the name. The `h2` uses `.m-h2`, or `.m-h2-statement` when the heading is a full sentence. Home is not numbered. A section with no rendered header (the empty scoreboard strip) is skipped, so numbers never have a gap.

### Motion

Button fill inversion and the card lift (`.m-pop`) are colour and a hard shadow. Travel on the card, the image scale, the link wipe and the list stagger run only inside `prefers-reduced-motion: no-preference`. The stagger also needs `animation-timeline: view()`. Everywhere else the content is visible immediately. No animation library is involved. The global reduced-motion rule still collapses any leftover transition.

### Adding a Simple section

1. Add the id to `SectionId` and `sections` in `src/config/sections.ts`, with `isVisible` returning false when there is nothing to show. `sectionNumbers()` will number it. Add the `Nav` label to both message files.
2. Render it from `renderSection` in `src/app/[locale]/page.tsx` inside `<Section id="...">`. Put the heading in an `h2` with `.m-h2`. Wrap the inner content in `.m-container` if `Section` does not already provide one through the mark; the mark is a sibling, so the section body keeps its own `.m-container`.
3. Style only with `[data-skin="minimal"]` rules or `minimal:` utilities. If Terminal needs the same component, give it its own branch (`minimal:hidden` on the Terminal tree, `hidden minimal:block` on the Simple tree). Never change an unprefixed class on an element both skins show.
4. New copy goes in both `messages/en.json` and `messages/tr.json`. No em dashes, no TODO strings.
5. Run the Terminal baseline with no snapshot update before considering it done.
