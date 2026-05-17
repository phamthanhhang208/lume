# Design integration inventory (Phase 6)

This is the realistic accounting of what was ported from `/design/` into the
live codebase and what's still TODO. Phase 6 was scoped as best-effort
non-interactive porting; full per-screen pixel-perfect adaptation is deferred
because it needs visual iteration on a real device.

## Done

### Design tokens (Tailwind v4 `@theme`)

All colors from `LUME` in `lume-shared.jsx` are available as Tailwind utilities
(`bg-cream`, `text-ink`, `border-rose-deep`, etc.). See `src/styles/global.css`.

Verdict palette (chip variant) wired as semantic tokens:
- `bg-verdict-works-bg` / `text-verdict-works-fg` / `border-verdict-works-border`
- same pattern for `neutral` and `skip`

### Typography

Fonts loaded from Google Fonts in `index.html`:
- Instrument Serif (regular + italic) — for headings via `font-serif` / `font-display`
- Caveat — handwriting accent, available as `font-hand`
- Courier Prime — monospace, available as `font-mono`
- Inter — body, default

Base CSS rules:
- `body` uses Inter
- `h1` / `h2` / `h3` use Instrument Serif, `h1` is italic

### Primitives ported to `src/components/ui/`

- `LumeMark` — the wordmark (italic serif)
- `VerdictTag` — the chip variant of the design's `VerdictTag`

### Applied to live routes

- Dashboard: shows `LumeMark` in header, uses `VerdictTag` on product cards
- ProductDetail: uses `VerdictTag` next to the latest-verdict heading
- /verdict summary: uses `VerdictTag` per product row

### Infrastructure

- `public/manifest.webmanifest` for PWA install (no icons yet)
- `<meta theme-color>` in index.html
- `scripts/seed-demo.ts` to insert a small demo product set + mock scan

## Deferred — needs visual iteration on a phone

The design package is aesthetic-heavy: hand-drawn SVG decorations, washi tape,
paper textures, scattered sticker layouts, speech bubbles, polaroid-tilted
product cards. Each of these needs to be ported AND positioned/composed against
real data, then visually verified against `/design/screenshots/`. That is
hours-to-days of iteration that can't happen without a device + visual feedback.

### Primitives not yet ported

From `design/lume-shared.jsx` (in order of likely demo value):
- `PaperBg` — page background with grid/dotgrid/notebook variants
- `WashiTape` — torn-paper-edge decorative tape strips
- `StickerCard` — tilted/shadowed card frame
- `ProductSticker` — full product card with SVG placeholder + brand name
- `EditorialTitle` — large serif headline (currently approximated by `h1`)
- `SpeechBubble` and `ChatBubble` (for any annotation copy in the design)
- `HighlighterMark` — yellow swipe behind text
- `Sparkle`, `Star`, `Heart`, `Underline`, `Arrow`, `Squiggle`, `PenArrow` — decorative SVG dingbats
- `NumberTag` — corner number badges
- `SelfiePlaceholder` — friendly placeholder for the scan screen
- `ProductBottleA`, `ProductTube`, `ProductCompact`, `ProductLipstick`,
  `ProductJar`, `ProductMascara`, `ProductSpray`, `ProductSheet` — characterful
  product silhouettes (could replace real sticker images for demo seed data)
- `StripedSlot` — image placeholder

### Per-screen porting not done

Each design screen file is currently a pure presentational component using
mock data. Adapting them into the live routes was scoped per `phases.md` step
7 but is the bulk of Phase 6 by volume:

- `design/lume-dashboard.jsx` → `src/routes/Dashboard.tsx`
- `design/lume-add-product.jsx` → `src/routes/AddProduct.tsx` + the wizard step components
- `design/lume-skin.jsx` → `src/routes/Scan.tsx`
- `design/lume-verdict.jsx` → `src/routes/Verdict.tsx`
- `design/lume-look.jsx` → `src/routes/Look.tsx`
- `design/lume-profile.jsx` → `src/routes/Profile.tsx` (route exists but is the original placeholder)

For each: copy the presentational JSX, swap mock data for our existing
TanStack Query hooks (which all exist now), check loading/empty/error states
against the design's intent, and verify against the matching screenshot.

### PWA icons

`manifest.webmanifest` declares `icons: []`. Need 192×192 and 512×512 PNGs
in `public/` and reference them in the manifest for installability.

### Demo seed limitations

`scripts/seed-demo.ts` inserts rows but uses placeholder storage paths. The
UI will render "loading image" for those products. To make demo screens look
real, the script needs to also upload one image per product to Storage (and
real sticker PNGs would need to come from somewhere — design SVGs rendered
to PNG would work).

### Things in `/docs/flows.md` the design doesn't appear to cover

- The OCR editable-ingredient list step in the add-product flow
- Per-step camera/preview/retake UI inside the wizard (the design shows the
  finished card; the in-flow capture states aren't explicit)
- Error states beyond the happy path

### Things in the design that don't have a flow

- The mocked annotations / handwritten chat-bubble copy may need finalized
  microcopy per `conventions.md` ("Naming user-facing strings ... defer to Jen")

## Risks worth knowing

- **Fonts**: Instrument Serif and Caveat add ~150KB to first paint. Acceptable
  for hackathon scope; consider self-hosting + subsetting for production.
- **Bundle size**: production JS is ~540KB ungzipped. Vite already flags this.
  Code-splitting per route is a Phase 6 polish item not done here.
- **No tests**: per `conventions.md` we don't write tests for hackathon scope,
  so visual regression is on the human reviewer.
