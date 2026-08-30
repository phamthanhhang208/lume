# User Flows

Each flow lists the trigger, the steps, the API calls, the data writes, and the success state.

## Flow 0: Sign up / sign in

**Trigger:** Unauthenticated user lands on app.

**Steps:**

1. Redirect to `/sign-in`
2. User enters email
3. Magic link sent via Supabase Auth
4. User clicks link in email, lands back on app authenticated
5. On first sign-in, create a `profiles` row for this user with default values
6. Redirect to `/dashboard`

**APIs:** Supabase Auth only.

**Data writes:** `profiles` row on first sign-in.

**Success:** User lands on dashboard, authenticated session in browser.

## Flow 1: Add a product

**Trigger:** User taps "Add product" on dashboard.

The flow is a four-step wizard backed by a Zustand draft store that persists to
localStorage so a refresh mid-flow doesn't lose work. Photo processing runs in
the background after each confirm — the user moves on while Gemini extracts.
The preview screen reads progressive status flags off the store and gates
"save" until everything has settled.

**Steps:**

1. Pick category: "makeup" or "skincare"
2. Camera opens. User captures photo of product front (or uploads from gallery)
3. Show preview. User confirms ("use this") or retakes. Confirming kicks off
   front processing in the background and advances to the back step immediately
4. Background, on front confirm: upload original to
   `products/{user_id}/products/{new_id}/original.jpg`, then run in parallel:
   - Edge Function `remove-background` → upload result PNG to `.../sticker.png`
   - Edge Function `extract-front-info` → returns `{name, brand, subcategory, shade}`,
     each field nullable. Gemini gets a constrained subcategory list per category
5. Camera opens for the back photo. User can also skip ("skip — no ingredient list")
6. Show preview. User confirms or retakes. Confirming kicks off back processing
   in the background and advances to the preview step immediately. Skipping
   sets ingredients to `[]` and advances
7. Background, on back confirm: upload back photo to `.../back.jpg`, call
   Edge Function `extract-ingredients` (Gemini Vision OCR)
8. Preview screen shows the extracted name, brand, subcategory (preselected),
   shade, and ingredients, all editable. Fields still in flight show a "reading..."
   indicator next to them and the save button is disabled until both processings
   settle. The user types into anything that came back null and edits anything
   that came back wrong
9. If OCR (or skip) leaves ingredients empty and a product name exists, the
   preview auto-fires Edge Function `search-ingredients` once per back attempt:
   Open Beauty Facts first, Gemini grounded web search as fallback. Results
   land with a source caption + verify link; a manual "search online" button
   covers re-tries. User edits snap the source back to "manual"
10. If the product is a foundation/concealer with a shade and the user has
    `skin_tone_data`, the preview fires Edge Function `check-shade` once per
    front attempt and shows a match/mismatch caption ("this shade may run
    warm for your skin tone"). Informational only — never blocks save
11. Save `products` row with `name, brand, category, subcategory, shade,`
    `original_image_url, sticker_image_url, ingredients`
12. Reset the draft store and return to dashboard. New product appears in the
    collection grid

**APIs:**

- Perfect Corp Background Removal (via Edge Function `remove-background`)
- Gemini Vision for front-info extraction (via Edge Function `extract-front-info`)
- Gemini Vision for ingredient OCR (via Edge Function `extract-ingredients`)
- Open Beauty Facts + Gemini grounded search (via Edge Function `search-ingredients`)
- Gemini shade check against stored skin tone (via Edge Function `check-shade`)

**Data writes:** `products` row, two or three Storage uploads (back.jpg only if
not skipped).

**Success:** New product visible in collection grid as a sticker.

**Failure modes:**

- Background removal fails → fall back to using the original image as the sticker
- Front-info extraction fails or returns garbage after the stricter retry → all
  four fields come back null, the user fills in at preview
- Ingredient OCR returns nothing or garbage → ingredients come back `[]`, the
  online search kicks in; if that also fails, the user types at preview
- Online search or shade check fail → soft-fail silently (empty list /
  "unknown" verdict); the flow never blocks on them
- Front and back processing race conditions (e.g. user retakes after a confirm)
  are guarded by a per-task generation counter — stale mutation results are
  discarded
- User can cancel at any step; the draft is cleared, partial data is discarded
- Page refresh mid-flow restores the draft from localStorage minus any
  in-memory blobs (the user retakes the active photo if mid-step)

## Flow 2: Skin analysis

**Trigger:** User taps "Analyze my skin" on dashboard.

**Steps:**

1. Check `profiles.saved_selfie_url`
   - If present: show options "Use saved photo" or "Take new one"
   - If absent: go straight to camera
2. If new photo: camera capture → upload to Storage at `selfies/{user_id}/{timestamp}.jpg`
3. If new photo: also update `profiles.saved_selfie_url` to this new path
4. Call Edge Function `analyze-skin` with the selfie URL
5. Edge Function first runs Perfect Corp Photo Enhance on the selfie
   (soft-fails to the original bytes), then Skin Analysis HD (file upload →
   task creation → polling until complete)
6. Edge Function returns the full result (plus `enhanced: boolean`)
7. Save `scans` row with metrics, skin_age, overall_score, raw_response, image_url
8. Silently backfill the profile from the same selfie, each non-blocking and
   only when its column is null:
   - `skin_tone_data` → Skin Tone Analysis (`analyze-skin-tone`)
   - `face_data` → Face Attributes: face shape, eye shape, eyelid, brow
     shape, lip shape (`analyze-face`)
   - `skin_type_data` → Fitzpatrick skin type I–VI (`analyze-skin-type`)
9. Show results screen: overall score, skin age, 13 metric scores

**APIs:**

- Perfect Corp Photo Enhance + Skin Analysis HD (via Edge Function)
- Perfect Corp Skin Tone Analysis, Face Attributes, Fitzpatrick Skin Type
  (via Edge Functions, each on first run only)

**Data writes:** Possibly a Storage upload, possibly `profiles.saved_selfie_url`,
`skin_tone_data`, `face_data`, `skin_type_data` updates, one `scans` row.

**Success:** Scan results visible. Latest scan now available for verdict flow.

**Failure modes:**

- API timeout or error → show retry button, do not save partial data
- Polling exceeds 60 seconds → fail with a clear message

## Flow 2b: Routines

**Trigger:** User opens `/routines` (desktop nav, or "manage routines" link on
the Verdict screen).

**Steps:**

1. Create a routine by name ("everyday", "barrier repair")
2. Expand a routine card and toggle shelf products in and out
3. "Make active" — at most one routine per user is active (partial unique
   index). Deactivate or delete anytime; deleting a routine never touches
   the products themselves

**Data writes:** `routines` and `routine_products` rows.

**Why it matters:** the active routine is what Flow 3 grades and what the
4-week preview (Flow 3b) is conditioned on.

## Flow 3: Routine verdict

**Trigger:** User taps "Analyze my routine" on dashboard.

**Preconditions:**

- At least one scan exists (latest is the one used)
- At least one product exists

If preconditions not met, show a card explaining what's needed and CTAs to fix.

**Steps:**

1. Fetch latest `scans` row for this user
2. Fetch the **active routine's products**; when no non-empty active routine
   exists, fall back to all `products` (the whole shelf)
3. Call Edge Function `generate-verdict`
4. Edge Function builds a Gemini prompt: skin metrics + Fitzpatrick skin type
   context (photosensitivity, SPF weight) + each product with ingredients →
   JSON array `[{product_id, verdict, reasoning}]` where verdict is 'works',
   'neutral', or 'skip' and reasoning is 1-2 sentences anchored to specific
   metrics
5. Edge Function calls Gemini 2.5 Flash with structured output (response_mime_type: application/json)
6. Edge Function validates the response shape, then inserts verdict rows in a transaction
7. Return verdicts to client (plus `routine_name` when routine-scoped)
8. Show results: product collection re-rendered with verdict tag overlays.
   The Verdict screen header shows "grading: {routine} · manage routines".
   Tapping a product opens detail with full reasoning

## Flow 3b: Skin previews (verdict screen)

**Trigger:** Buttons on the Verdict screen after a verdict exists.

**4-week preview (`simulate-skin`):**

1. Take the scan's ≤5 lowest metrics (< 60)
2. If the scan has verdicts: Gemini checks which of those concerns the
   "works" products actually address (by ingredients) — only those are
   simulated; the rest come back as `concerns_uncovered`
3. If the routine covers none of them, skip the Perfect Corp call entirely
   and say so — no dishonest glow-up
4. Perfect Corp Skin Simulation renders the after-image (per-concern floats,
   intensity scaled by how low each metric scored); result cached on
   `scans.simulation_image_url`
5. UI shows before/after + coverage chips ("routine covers: acne, texture" /
   "not covered yet: dark_circle") + Gemini's one-line reasoning

**Fast forward (`simulate-aging`):** Perfect Corp AI Aging on the scan's
selfie (last frame of the series), cached on `scans.aging_image_url`. Copy
explicitly labels it a generic simulation, not routine-conditioned.

**APIs:**

- Gemini 2.5 Flash (via Edge Function)

**Data writes:** Multiple `verdicts` rows.

**Success:** Verdict tags visible on product cards. Each product detail shows reasoning.

**Failure modes:**

- Gemini returns malformed JSON → Edge Function retries once with a stricter prompt. If still bad, fail with a clear message
- Some products get verdicts, some don't → still insert what we got, show user that N of M were analyzed

## Flow 4: Build me a look

**Trigger:** User taps "Try a look" on dashboard.

**Preconditions:**

- `profiles.saved_selfie_url` is set
- User has at least 1 makeup product

**Steps:**

1. Show prompt input with suggestion chips ("clean girl", "soft glam", "office natural", etc.)
2. User submits prompt
3. Edge Function `generate-look` fetches makeup products (with shade),
   `face_data`, and `skin_tone_data`
4. Gemini gets the prompt, the products, the user's face attributes
   ("hooded lids favor matte shadow…") and coloring ("match foundation to
   the USER's tone") → returns `{products: [{product_id, slot, color}], reasoning, gaps}`
   where `color` is a hex inferred from the product's shade name
5. Edge Function builds the color-aware `makeup-vto` effects payload:
   hex palettes per slot, contour/highlighter patterns picked by face shape,
   brow pattern by brow shape. If the new dialect is rejected, it falls back
   to the legacy `ai-makeup` effect_list
6. Save result image to Storage at `looks/{user_id}/{new_id}.jpg`, save `looks` row
7. Show results: VTO preview, the cast per slot, gaps explained ("we didn't
   have a blush in your collection")

**APIs:**

- Gemini 2.5 Flash for product picking + color inference (via Edge Function)
- Perfect Corp Makeup VTO (via Edge Function)

**Data writes:** Storage upload, `looks` row.

**Success:** Generated look visible.

**Failure modes:**

- Gemini picks zero products → show "we couldn't match products in your collection to this look. Try a different prompt or add more products."
- VTO fails (both dialects) → save the `looks` row with reasoning but mark result_image_url as null. Show user the breakdown without the image
- VTO returns but image is broken → same as above

## Flow 5: Steal a look

**Trigger:** "or steal a look" on the Look screen (upload a reference photo),
or right-click an image in the extension → "Steal this look with Lume".

**Steps:**

1. Resolve reference bytes: web upload goes to `looks/{user_id}/references/…`
   (Edge Function receives `storage_path`); the extension sends the image URL
   (fetched server-side)
2. Edge Function `transfer-look` runs Perfect Corp **Makeup Transfer**
   (`mu-transfer`, 2 files: saved selfie as src + reference as ref)
3. In parallel Gemini Vision maps the reference look to owned makeup
   products — aware of the user's face attributes and coloring so foundation
   matches the *user's* tone, not the model's — returning picks, per-slot
   colors, and gaps
4. Result image saved to the `looks` bucket; `looks` row saved with
   `reference_image_url`; response includes server-signed URLs so the
   extension can render without a storage session
5. Web UI shows "the look | on you" side-by-side + the cast + shelf gaps

**Failure modes:** transfer fails → the look still saves with the product
mapping and a null result image, mirroring Flow 4.

## Flow 6: Chrome extension

**Trigger:** Right-click any image → **Try with Lume** or **Steal this look
with Lume** (side panel opens).

**Try with Lume (`try-from-web`):**

1. Extension sends `{image_url, page_title, page_url}`
2. Gemini classifies: makeup (slot + dominant pigment color) or skincare
   (concerns), or unknown
3. Makeup → color-aware Makeup VTO on the saved selfie (legacy fallback);
   skincare → Skin Simulation with per-concern params
4. Side panel renders classification + result image

**Steal this look** → Flow 5 with `image_url`.

Auth is a pasted access token (see `extension/README.md`); distribution is
load-unpacked / zip, not the Web Store.

## Cross-cutting concerns

- **Loading states:** Every async flow needs visible feedback. Spinner with a message describing what's happening. Skin Analysis and VTO calls can take 10-30 seconds.
- **Error states:** Every API call must have a user-facing error. Never silent fail.
- **Empty states:** Every list view must have a friendly empty state with a CTA.
- **Optimistic updates:** For product add and verdict generation, show optimistic UI where safe. Roll back on error.
