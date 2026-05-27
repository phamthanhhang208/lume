# Lume

A beauty and skincare collection app: log makeup and skincare products with one photo each, get AI-powered analysis of which products actually work for your skin, and generate makeup looks using only what you own.

Built for the **DevNetwork AI/ML Hackathon 2026** (Perfect Corp track).

## What it does

- **Add a product in two photos.** Snap the front; Lume removes the background, reads name, brand, subcategory, and shade in parallel. Snap the back; it OCRs the ingredients list. If the box was tossed and OCR comes up empty, Lume searches Open Beauty Facts and falls back to a grounded web search so you don't have to hand-type 30 ingredients.
- **Skin scan.** Take a selfie; Perfect Corp's Skin Analysis returns 14 metrics (wrinkle, pore, acne, redness, moisture, dark circle, firmness, radiance, …). Skin tone and face shape get extracted in the background and saved to your profile.
- **Per-product verdict.** Gemini cross-references your skin metrics against each product's ingredients and tags every product as **works**, **neutral**, or **skip** with one sentence of reasoning anchored to a specific metric.
- **Preview your skin in 4 weeks.** From the verdict screen, Lume calls Perfect Corp's Skin Simulation on your top concerns and renders a before/after — a visual of where your routine is taking you.
- **Build me a look.** Describe a vibe ("soft glam date night"); Gemini picks the right subset of your owned makeup, assigns slots, considers your face shape, then Perfect Corp's Makeup VTO renders it onto your selfie.
- **Chrome extension (stretch).** Right-click any product image on the web → instantly try it on your selfie (makeup VTO) or simulate it on your skin (skincare).

## Tech stack

- **Frontend:** Vite + React 19 + TypeScript (strict), Tailwind v4, React Router v7 (data routes), Zustand for client state, TanStack Query for server state.
- **Backend:** Supabase — Postgres + Auth + Storage + Edge Functions (Deno).
- **AI / ML:**
  - **Perfect Corp YouCam API** — Skin Analysis V2.1, Skin Tone Analysis, Face Analyzer, Skin Simulation, Background Removal, Makeup VTO.
  - **Google Gemini 2.5 Flash** — vision OCR on ingredient labels and product fronts, verdict reasoning, look orchestration, grounded web search for ingredient lookup.
- **Ingredient data:** Open Beauty Facts (free, open) with Gemini grounded search fallback.

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in Supabase URL + anon key
pnpm dev
```

Open <http://localhost:5173>. You'll need a Supabase project with the migrations in `supabase/migrations/` applied, the storage buckets from `20260517_002_storage_buckets.sql` created, and the edge functions in `supabase/functions/` deployed. Server-side secrets (`PERFECTCORP_API_KEY`, `GEMINI_API_KEY`) go into Supabase Edge Function secrets — see `.env.example` for the exact commands.

### Scripts

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Vite dev server                    |
| `pnpm typecheck` | `tsc -b --noEmit`                  |
| `pnpm lint`      | ESLint                             |
| `pnpm build`     | typecheck + production build       |
| `pnpm preview`   | preview the production build       |
| `pnpm format`    | Prettier write                     |

## Project layout

```
src/
  routes/            # one file per route (AddProduct, Scan, Verdict, Look, …)
  features/          # feature-scoped api hooks, components, utils
    auth/
    products/
    scans/
    verdicts/
    looks/
    profile/
  stores/            # Zustand stores (draft product, …)
  lib/               # supabase client, etc.
  types/             # database row types
supabase/
  migrations/        # SQL migrations (chronological)
  functions/         # Deno edge functions
    _shared/         # cors, perfectcorp client, gemini client, prompts, schemas
    analyze-skin/        # Perfect Corp Skin Analysis V2.1
    analyze-skin-tone/   # Perfect Corp Skin Tone Analysis
    analyze-face/        # Perfect Corp Face Analyzer
    extract-front-info/  # Gemini vision: name + brand + subcategory + shade
    extract-ingredients/ # Gemini vision: OCR back-of-package
    search-ingredients/  # Open Beauty Facts + Gemini grounded fallback
    remove-background/   # Perfect Corp Photo Background Removal
    generate-verdict/    # Gemini: per-product verdict reasoning
    generate-look/       # Gemini orchestration + Perfect Corp Makeup VTO
    simulate-skin/       # Perfect Corp Skin Simulation
    try-from-web/        # Chrome extension entry point
docs/                # architecture, data model, flows, conventions, phases
design/              # design system source (Figma exports, tokens)
```

## Docs

The `docs/` folder is the source of truth. Start with:

- `docs/architecture.md` — system overview, data flow, API surface
- `docs/data-model.md` — Supabase schema and TypeScript types
- `docs/flows.md` — user flows in detail (add product, scan, verdict, look)
- `docs/api-integration.md` — Perfect Corp + Gemini integration patterns
- `docs/conventions.md` — code style, naming, file organization
- `docs/phases.md` — phased build plan and exit criteria
- `docs/design-system.md` — using the design tokens in `design/`
- `docs/chrome-extension.md` — extension architecture (stretch)

## For Claude Code

Read `CLAUDE.md` first, then everything in `docs/` before writing code.
