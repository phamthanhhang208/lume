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
9. Save `products` row with `name, brand, category, subcategory, shade,`
   `original_image_url, sticker_image_url, ingredients`
10. Reset the draft store and return to dashboard. New product appears in the
    collection grid

**APIs:**

- Perfect Corp Background Removal (via Edge Function `remove-background`)
- Gemini Vision for front-info extraction (via Edge Function `extract-front-info`)
- Gemini Vision for ingredient OCR (via Edge Function `extract-ingredients`)

**Data writes:** `products` row, two or three Storage uploads (back.jpg only if
not skipped).

**Success:** New product visible in collection grid as a sticker.

**Failure modes:**

- Background removal fails → fall back to using the original image as the sticker
- Front-info extraction fails or returns garbage after the stricter retry → all
  four fields come back null, the user fills in at preview
- Ingredient OCR returns nothing or garbage → ingredients come back `[]`, the
  user types at preview
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
5. Edge Function calls Perfect Corp Skin Analysis V2.1 (file upload → task creation → polling until complete)
6. Edge Function returns the full result
7. Save `scans` row with metrics, skin_age, overall_score, raw_response, image_url
8. If `profiles.skin_tone_data` is null: silently also call Skin Tone Analysis with the same selfie, update profile
9. Show results screen: overall score, skin age, 14 metric scores

**APIs:**

- Perfect Corp Skin Analysis V2.1 (via Edge Function)
- Perfect Corp Skin Tone Analysis (via Edge Function, on first run only)

**Data writes:** Possibly a Storage upload, possibly `profiles.saved_selfie_url` and `skin_tone_data` updates, one `scans` row.

**Success:** Scan results visible. Latest scan now available for verdict flow.

**Failure modes:**

- API timeout or error → show retry button, do not save partial data
- Polling exceeds 60 seconds → fail with a clear message

## Flow 3: Routine verdict

**Trigger:** User taps "Analyze my routine" on dashboard.

**Preconditions:**

- At least one scan exists (latest is the one used)
- At least one product exists

If preconditions not met, show a card explaining what's needed and CTAs to fix.

**Steps:**

1. Fetch latest `scans` row for this user
2. Fetch all `products` for this user
3. Call Edge Function `generate-verdict` with `{scan, products}`
4. Edge Function builds a Gemini prompt: "Given these skin metrics and these products with these ingredients, return a JSON array `[{product_id, verdict, reasoning}]` where verdict is 'works', 'neutral', or 'skip' and reasoning is 1-2 sentences anchored to specific metrics."
5. Edge Function calls Gemini 2.5 Flash with structured output (response_mime_type: application/json)
6. Edge Function validates the response shape, then inserts verdict rows in a transaction
7. Return verdicts to client
8. Show results: product collection re-rendered with verdict tag overlays. Tapping a product opens detail with full reasoning

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
- `profiles.skin_tone_data` is set (run Skin Tone Analysis if missing, transparent to user)
- User has at least 3 makeup products

**Steps:**

1. Show prompt input with suggestion chips ("clean girl", "soft glam", "office natural", etc.)
2. User submits prompt
3. Fetch user's makeup products (category = "makeup")
4. Call Edge Function `generate-look` with `{prompt, makeup_products, skin_tone_data, face_data}`
5. Edge Function asks Gemini: "Given this prompt and these owned products, pick which products fit, and assign each to a makeup slot (foundation, blush, lipstick, eyeshadow, etc.). Return JSON: `{products: [{product_id, slot}], reasoning: string, gaps: string[]}`"
6. Edge Function validates response
7. For each picked product, Edge Function maps to a Perfect Corp Makeup VTO effect payload (this mapping is hardcoded per slot — lipstick → LipColorEffect, etc.)
8. Edge Function calls Perfect Corp Makeup VTO with the user's selfie and the assembled effects
9. Save result image to Storage at `looks/{user_id}/{new_id}.jpg`
10. Save `looks` row
11. Return `look` to client
12. Show results: VTO preview image, breakdown of products used per slot, gaps explained ("we didn't have a blush in your collection")

**APIs:**

- Gemini 2.5 Flash for product picking (via Edge Function)
- Perfect Corp Makeup VTO (via Edge Function)

**Data writes:** Storage upload, `looks` row.

**Success:** Generated look visible.

**Failure modes:**

- Gemini picks zero products → show "we couldn't match products in your collection to this look. Try a different prompt or add more products."
- VTO fails → save the `looks` row with reasoning but mark result_image_url as null. Show user the breakdown without the image
- VTO returns but image is broken → same as above

## Flow stretch: Chrome extension

**Trigger:** User right-clicks a product image on any beauty retailer page → "Try with Lume".

**Steps:**

1. Extension grabs image URL, page URL, page title
2. Sends to Edge Function `try-from-web` with `{image_url, page_title, user_id}`
3. Edge Function asks Gemini: "Is this makeup or skincare? If makeup, what slot? If skincare, what concerns does it target?"
4. If makeup: call Makeup VTO with user's saved selfie, return result
5. If skincare: call Skin Simulation with user's saved selfie and the identified concerns
6. Extension popup shows the result

**Build only after core flows are stable.** Treat as stretch.

## Cross-cutting concerns

- **Loading states:** Every async flow needs visible feedback. Spinner with a message describing what's happening. Skin Analysis and VTO calls can take 10-30 seconds.
- **Error states:** Every API call must have a user-facing error. Never silent fail.
- **Empty states:** Every list view must have a friendly empty state with a CTA.
- **Optimistic updates:** For product add and verdict generation, show optimistic UI where safe. Roll back on error.
