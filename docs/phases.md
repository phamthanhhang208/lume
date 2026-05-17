# Build Phases

This is the phased plan. Do not skip ahead. At the end of each phase, summarize and ASK for approval before starting the next phase.

## Phase 0: Project setup (current)

**Goal:** Empty, working Vite + React + TS project with all dependencies installed, routing skeleton, Supabase client stub, and clean dev experience. No features, no UI styling.

**Tasks:**

1. `pnpm create vite lume --template react-ts` (or equivalent)
2. Install dependencies (see list below)
3. Configure Tailwind v4 with the Vite plugin
4. Set up path alias `@/` → `src/`
5. Create folder structure per `architecture.md`
6. Create Supabase client stub in `src/lib/supabase.ts`
7. Create TanStack Query client in `src/lib/queryClient.ts`
8. Create `cn()` helper in `src/lib/cn.ts`
9. Set up React Router v7 with placeholder routes:
   - `/` → redirects to `/dashboard`
   - `/sign-in`
   - `/dashboard`
   - `/scan`
   - `/look`
   - `/products/:id`
10. Each placeholder route renders just its name as plain text — no styling
11. Create `.env.example` and gitignored `.env`
12. Verify `pnpm dev` runs, all routes render, no console errors, `pnpm tsc --noEmit` passes

**Dependencies to install:**

```
react react-dom react-router
@supabase/supabase-js
@tanstack/react-query
zustand
clsx tailwind-merge
lucide-react
zod
```

Dev:

```
typescript
@types/react @types/react-dom @types/node
vite @vitejs/plugin-react
tailwindcss @tailwindcss/vite
prettier prettier-plugin-tailwindcss
eslint (Vite default)
```

**Exit criteria:**

- `pnpm dev` runs, http://localhost:5173 shows the dashboard placeholder
- All routes navigable
- `pnpm tsc --noEmit` clean
- `pnpm build` succeeds
- `.env.example` documents required vars
- `.gitignore` excludes `.env`, `node_modules`, `dist`

**Do not:**

- Add any colors, fonts, or design tokens
- Build any UI components beyond plain-text placeholders
- Connect to a real Supabase project
- Install any UI library
- Configure PWA

**At completion:** Summarize what was done. Wait for approval.

---

## Phase 1: Auth + Supabase schema

**Goal:** User can sign up, sign in, sign out. Database schema deployed. Profile row auto-created on first sign-in.

**Tasks:**

1. Create a real Supabase project (Jen will provide URL and anon key)
2. Write SQL migrations for `profiles`, `products`, `scans`, `verdicts`, `looks` tables (see `data-model.md`)
3. Write RLS policies — user can only see their own rows
4. Write Storage bucket setup migration (selfies, products, looks buckets) with policies
5. Build auth flow:
   - `/sign-in` route with email input, magic link send
   - Auth callback handler at `/auth/callback`
   - `useAuth` hook that exposes `user`, `loading`, `signIn`, `signOut`
   - Route protection: unauthenticated users redirect to `/sign-in`
   - On first sign-in, insert a `profiles` row (use a Postgres trigger on `auth.users` insert)
6. Set up TanStack Query with auth context

**Exit criteria:**

- Sign in with email works end to end
- New users get a `profiles` row automatically
- Unauthenticated users can't access protected routes
- Sign out works and redirects to sign-in
- All routes still render their placeholders

**Do not:**

- Style the sign-in screen beyond functional
- Build features in other routes

---

## Phase 2: Add product flow

**Goal:** User can photograph a product, get it background-removed via Perfect Corp, OCR ingredients from the back, and save it to their collection. Collection grid on dashboard shows real products.

**Tasks:**

1. Set up Supabase Edge Function infrastructure (shared utilities)
2. Build `remove-background` Edge Function (calls Perfect Corp Background Removal)
3. Build `extract-ingredients` Edge Function (calls Gemini Vision)
4. Build the add-product wizard:
   - Category picker
   - Camera capture (use `getUserMedia` or a file input with `capture="environment"`)
   - Preview and retake
   - Background removal API call
   - Back-of-product capture
   - Ingredient OCR with editable result
   - Name and brand input
   - Save to `products`
5. Use Zustand for wizard state
6. Build `useProducts` and `useAddProduct` TanStack Query hooks
7. Render product grid on dashboard (still unstyled — just functional list)
8. Build product detail route (still unstyled)

**Exit criteria:**

- User can add a product end to end
- Sticker image (background removed) shows in the grid
- Ingredients are saved and visible in detail view
- Edge Function logs show successful Perfect Corp and Gemini calls
- Errors are handled and don't leave half-saved products

---

## Phase 3: Skin analysis

**Goal:** User can take a selfie, get full skin analysis via Perfect Corp, see results. Selfie is reusable.

**Tasks:**

1. Build `analyze-skin` Edge Function with task polling
2. Build `analyze-skin-tone` Edge Function (silent first run if profile missing tone data)
3. Selfie capture component (reusable for Phase 4)
4. "Use saved photo" vs "Take new" decision UI
5. Skin analysis route flow:
   - Show selfie source choice if saved exists
   - Capture or load
   - Trigger analysis (long-running, show progress UI)
   - Save scan, navigate to results
6. Results screen: 14 metrics, skin age, overall score (unstyled, functional)
7. `useLatestScan` query hook

**Exit criteria:**

- User can run skin analysis end to end
- Scan row saved with all metrics
- Profile updates with selfie URL and skin tone data
- Re-running with saved selfie skips the camera

---

## Phase 4: Routine verdict

**Goal:** User taps "Analyze my routine", gets per-product verdicts from Gemini, sees tags on product cards.

**Tasks:**

1. Build `generate-verdict` Edge Function (Gemini + structured output + Zod validation + insert verdicts in transaction)
2. "Analyze my routine" button on dashboard (handle precondition checks)
3. Precondition UI: "You need at least one skin scan and one product"
4. Verdict generation trigger and result display
5. Update product grid to show verdict tags from latest scan's verdicts
6. Update product detail to show full reasoning
7. `useLatestVerdicts` query hook

**Exit criteria:**

- Verdict generation runs end to end
- Verdicts saved correctly
- Product cards show their verdict from latest scan
- Detail view shows reasoning
- Malformed Gemini responses retry once, then fail gracefully

---

## Phase 5: Build me a look

**Goal:** User types a prompt, Gemini picks products, Perfect Corp renders a VTO preview, user sees the look.

**Tasks:**

1. Build `generate-look` Edge Function:
   - Gemini call for product picking + slot assignment
   - Map products to VTO effect payloads
   - Call Perfect Corp Makeup VTO
   - Save result image and `looks` row
2. Look prompt input with suggestion chips
3. Loading screen for the long VTO call
4. Result display: preview image + product breakdown + gaps explained
5. Looks history (basic list, can be styled later)

**Exit criteria:**

- Look generation works end to end
- Result image saved and rendered
- Product breakdown is accurate
- Gracefully handles "no matching products in collection"

---

## Phase 6: Polish + design integration

**Goal:** App is visually finished per Jen's design package. Demo-ready.

The design package in `/design/` contains full React/JSX implementations of every screen. Phase 6 is primarily about adapting and wiring these into the live app, not building UI from scratch.

**Tasks:**

1. Read `/docs/design-system.md` in full
2. Read `/design/README.md` and `/design/project/lume-shared.jsx`
3. Produce the inventory deliverable described in `/docs/design-system.md` step 2
4. Extract design tokens into Tailwind config (colors, fonts, spacing, shadows, radii)
5. Set up global styles and font loading
6. Port primitives from `lume-shared.jsx` into `src/components/ui/`
7. For each route, adapt the matching design screen:
   - Copy presentational JSX from `/design/project/lume-{screen}.jsx`
   - Replace mock data with real TanStack Query hooks built in earlier phases
   - Replace stub event handlers with real mutations
   - Verify the screen renders correctly against `/design/project/screenshots/`
8. Verify loading, empty, and error states across every screen
9. PWA configuration (manifest, service worker, install prompt)
10. Demo seed data script
11. Record demo video
12. Write Devpost submission

**Stretch goal:** Chrome extension. Build only if Phase 6 finishes early. See /docs/chrome-extension.md for the full plan, scope, architecture, and stretch sub-phases.

**Exit criteria:**

- Every route matches its design screenshot
- App is presentable on a real phone
- Demo seed account exists
- Video recorded
- Devpost submission drafted
- Deployed to Vercel or Netlify

**Risk to watch:**

- The design package may use libraries we haven't installed (framer-motion, specific fonts, etc.). Identify these in the inventory step and decide whether to add them.
- The design's data assumptions may differ from our real schema. If a screen expects fields we don't have, decide whether to add to the schema or adapt the screen.

---

## Hard rules across all phases

1. Do not start the next phase without explicit approval.
2. Stop and ask if a requirement is unclear.
3. Stop and ask if you find yourself adding things not in the spec.
4. Stop and ask if a phase is taking notably longer than expected.
