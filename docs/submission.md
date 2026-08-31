# Devpost Submission Draft

Target: **Mind the Product — World Product Day: Everyone Ships Now** (Devpost).
Copy each section into the Devpost form. Placeholders in `[brackets]` need
real values before submitting.

---

## Project name

Lume

## Tagline (≤ 60 chars)

Your shelf, graded by your skin.

## Inspiration

Skincare shelves fill up with products bought off TikTok trends, and nobody
can say which ones actually work for *their* skin. Reviews describe someone
else's face. We wanted the opposite: point the camera at your own face and
your own shelf, and let AI connect the two — this ingredient list, these
skin metrics, this verdict.

## What it does

- **Add a product with two photos.** Front photo: background removed
  (Perfect Corp), name/brand/category/shade read by Gemini Vision. Back
  photo: ingredients OCR'd. Threw away the box? Lume searches Open Beauty
  Facts, then falls back to Gemini grounded web search — you never type 30
  ingredient names. Adding a foundation? Lume checks the shade against your
  analyzed skin tone and warns if it runs warm/cool/light/deep for you.
- **One selfie, a full face profile.** Perfect Corp Skin Analysis returns
  13 metrics (wrinkle, pore, acne, moisture, …). The same selfie silently
  yields your skin tone palette, Fitzpatrick skin type (I–VI), and five
  face attributes (face shape, eye shape, eyelid, brow shape, lip shape).
  Blurry photo? AI Photo Enhance cleans it up before analysis.
- **Routines.** Group the products you *actually use* into named routines.
  The active routine is what gets graded — no more verdicts on the serum
  that's been in a drawer for two years.
- **Per-product verdict.** Gemini cross-references your metrics and each
  product's ingredients — aware of your Fitzpatrick type (photosensitivity,
  SPF weight) — and tags every product **works / neutral / skip** with one
  sentence of reasoning.
- **Honest skin previews.** "Preview your skin in 4 weeks" simulates only
  the concerns your works-pile actually targets (Perfect Corp Skin
  Simulation) and tells you which concerns your routine does *not* cover
  yet. A separate "fast forward" card runs AI Aging — labeled clearly as a
  generic simulation, not a routine-conditioned prediction.
- **Build or steal a look.** Describe a vibe and Gemini casts your own
  makeup — with real product colors inferred from shade names, contour and
  brow patterns matched to your analyzed face shape and brow shape, and
  foundation matched to your skin tone — rendered by Perfect Corp Makeup
  VTO. Or upload any makeup photo and **Makeup Transfer** puts that look on
  your face, mapped to the products you own plus a shopping list of gaps.
- **Chrome extension: try before you buy, anywhere.** Right-click any
  product image on the web. Makeup → live virtual try-on: **you | with
  this shade**, your selfie next to the Perfect Corp render. Skincare →
  a **4-week preview personalized to your latest scan**: intensity scaled
  to your actual metric scores, green chips for the concerns it helps,
  and an honest "you don't need this" when it targets concerns you don't
  have (Lume then skips the render entirely). Every skincare product is
  also **clash-checked against your active routine** — severity-ranked
  warnings like retinoid × AHA before it ever reaches your shelf. "Steal
  this look with Lume" transfers the makeup in any photo onto you.

## How we built it

- **Frontend:** Vite + React 19 + TypeScript (strict), Tailwind v4, React
  Router v7, Zustand, TanStack Query. Chrome extension: Manifest V3 + side
  panel, built with @crxjs/vite-plugin.
- **Backend:** Supabase — Postgres with RLS, Auth (magic link + demo
  account), Storage, and 15 Deno Edge Functions.
- **Perfect Corp YouCam API — 10 features over the s2s v2 task pipeline:**
  Skin Analysis HD, Facial Color Tones (skin tone), Fitzpatrick Skin Type,
  Face Attributes, Skin Simulation, Makeup VTO (color-aware `effects`
  payload), Makeup Transfer, AI Aging, Photo Enhance, Background Removal.
- **Google Gemini 2.5 Flash:** vision OCR (labels + product fronts),
  verdict reasoning, look orchestration with per-product color inference,
  routine-coverage analysis, ingredient clash-checking, grounded web
  search for ingredients — every call Zod-validated with a stricter
  retry and a soft-fail path.
- **Open Beauty Facts** for structured ingredient lookup.
- **Novus.ai** auto-instrumented from the repo, so we shipped with product
  analytics flowing from day one.

## Challenges we ran into

- **API contracts are the product.** We audited every Perfect Corp call
  against the YouCam MCP catalog and found two payloads that were silently
  wrong (a nonexistent feature segment; a mis-shaped skin-simulation
  params object). Verification became a mandatory step before every
  integration — and the audit also unlocked the color-aware makeup payload
  and face-shape-matched patterns.
- **AI that fails gracefully.** Every AI call in Lume has a stricter-retry
  and a designed fallback: OCR → Open Beauty Facts → grounded search →
  hand-typing; new VTO dialect → legacy dialect; no verdicts → severity-
  based preview. The user never sees a dead end.
- **Being honest with simulations.** It's tempting to render dramatic
  before/afters. We constrained the 4-week preview to concerns the user's
  routine actually addresses, skip the render entirely when it covers
  nothing, and label the aging card as generic.

## Accomplishments we're proud of

- Ten Perfect Corp features composed into one coherent journey — not a
  feature museum, each call feeds the next (tone → shade check → VTO
  colors; attributes → patterns; verdicts → preview).
- The empty-ingredients dead end is gone end-to-end.
- A verdict → visual-proof loop: the app doesn't just say "this works", it
  shows your face if you stick with it — and admits what's not covered.

## What we learned

- Never assume an API shape; a catalog/MCP check costs minutes and saved
  us from two invisible production bugs.
- Structured output + validator + stricter retry is the minimum viable
  contract for LLM calls in production.
- Stored data you never read is a bug that doesn't crash: skin tone and
  face data sat unused in our DB until an audit put them into every prompt.

## What's next for Lume

- Scan timeline with metric trends per routine — did the 4-week preview
  come true?
- Clash checking at routine-build time (not just from the extension).
- Price-aware advice: "your money might do more elsewhere" with an actual
  cheaper alternative.
- Chrome Web Store release.

## Built with

`react` `typescript` `vite` `tailwindcss` `supabase` `postgresql` `deno`
`perfect-corp` `youcam-api` `gemini` `google-gemini` `zustand`
`tanstack-query` `chrome-extension` `open-beauty-facts` `novus`

---

## Submission checklist

- [ ] **Public URL** (required — judges must be able to click and use it):
      `[https://lume-….vercel.app]`
- [ ] **Novus.ai installed + dashboard screenshot** (required): screenshot
      of the Novus dashboard showing Lume traffic → attach as gallery image
- [ ] **Demo video** (1:35, see `docs/video-script.md` — includes the
      extension's live try-on + personalized preview): `[YouTube link]`
- [ ] **Repo link**: `[https://github.com/phamthanhhang208/lume]` (make
      public or add access note)
- [ ] **Demo access for judges**: on `/sign-in`, click **"login as demo
      user"** — no credentials needed (account is pre-seeded with products,
      a scan, routines, verdicts, and looks)
- [ ] Gallery images: dashboard, verdict + coverage chips, steal-a-look
      side-by-side, extension before|after (`docs/images/extension.png`),
      Novus dashboard
- [ ] Post progress with **#EveryoneShipsNow** tagging **@MindTheProduct**
- [ ] Perfect Corp quota sanity check (< 800/1000 units used) before final
      judge window
