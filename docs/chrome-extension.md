# Chrome Extension

This doc covers the planned Chrome extension companion to the Lume web app. The extension is a **Phase 6 stretch goal** — only start once the core web app is shipped and the demo video is recorded.

## Goal

Let users try beauty products on themselves while browsing any beauty retailer site, without leaving the page. The user sees a product on Sephora/Ulta/a brand site, right-clicks the product image, and gets either a virtual makeup try-on or a skincare outcome preview using their saved selfie from the Lume web app.

## Why this is a stretch goal

- Chrome extensions add real complexity: manifest, content scripts, background worker, cross-origin handling, build pipeline changes
- The core flows in the web app are already a strong demo on their own
- Extension polish takes longer than estimating allows for
- Demo judges may not test the extension; they will test the web app

Skip without regret if Phase 6 polish runs long.

## Scope (MVP)

Only one interaction:

1. User browses a product page on any site
2. Right-clicks a product image
3. Context menu shows "Try with Lume"
4. Click triggers an Edge Function call with the image URL and the user's saved selfie
5. A side panel opens showing the result (VTO or Skin Simulation)

**Not in MVP scope:**

- Auto-detecting product pages
- Per-site DOM parsing (Sephora-specific, Ulta-specific selectors)
- Reading product price, name, ingredients from the page
- Adding products from the extension to the web app's collection
- Floating action buttons on every page
- Toolbar popup with the full web app inside

These are explicitly deferred. The doc lists them in "Future work" for reference.

## Architecture

```
[Beauty retailer page]
        |
        | (user right-clicks an image)
        ↓
[Lume content script]
        |
        | (image URL + page metadata)
        ↓
[Lume background worker]
        |
        | (calls Edge Function with user's JWT)
        ↓
[Supabase Edge Function: try-from-web]
        |
        | (asks Gemini: makeup or skincare?)
        | (routes to Makeup VTO or Skin Simulation)
        ↓
[Perfect Corp API]
        |
        | (result image URL)
        ↓
[Background worker → Side panel UI]
```

The extension reuses the web app's Supabase project, Edge Functions infrastructure, and the user's saved selfie. It does not have its own database.

## File structure

The extension lives in the same monorepo as the web app, in a new folder:

```
lume/
├── src/                       # Web app (existing)
├── supabase/                  # Edge Functions (existing)
└── extension/                 # NEW: Chrome extension
    ├── manifest.json
    ├── vite.config.ts
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── background.ts      # Service worker
    │   ├── content.ts         # Injected into pages (minimal logic)
    │   ├── sidepanel/
    │   │   ├── index.html
    │   │   ├── main.tsx
    │   │   ├── App.tsx
    │   │   └── styles.css
    │   ├── popup/             # Optional, for auth + settings
    │   │   ├── index.html
    │   │   └── main.tsx
    │   └── shared/
    │       ├── auth.ts        # Supabase client setup
    │       ├── api.ts         # Edge Function calls
    │       └── types.ts
    └── public/
        └── icons/             # 16, 32, 48, 128 px PNG icons
```

## Manifest V3

Key fields:

```json
{
  "manifest_version": 3,
  "name": "Lume",
  "version": "0.1.0",
  "description": "Try beauty products from any site on your own face.",
  "permissions": ["contextMenus", "sidePanel", "storage", "activeTab"],
  "host_permissions": ["https://*.supabase.co/*"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "side_panel": {
    "default_path": "sidepanel/index.html"
  },
  "action": {
    "default_title": "Lume"
  },
  "icons": {
    "16": "icons/16.png",
    "32": "icons/32.png",
    "48": "icons/48.png",
    "128": "icons/128.png"
  }
}
```

**Decisions:**

- **No content script in MVP.** Right-click context menu is enough. Adding a content script means injecting code into every page the user visits, which is heavier and triggers Chrome Web Store review concerns.
- **No broad host permissions.** We only need `https://*.supabase.co/*` to call our Edge Functions. The retailer page image is fetched server-side by the Edge Function from its public URL — the extension just sends the URL, not the image bytes.
- **Side panel over popup.** Result images need space. Side panel sticks open while the user keeps browsing.
- **`activeTab`** permission is what allows context menu actions without needing host permission on every site.

## Build setup

Vite supports Chrome extensions via `@crxjs/vite-plugin`. Install in the `extension/` workspace:

```
pnpm add -D @crxjs/vite-plugin vite
pnpm add react react-dom
```

`vite.config.ts` in the extension folder:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
});
```

Build outputs an `extension/dist/` folder ready to load as an unpacked extension.

## Auth strategy

The user must be signed into the Lume web app before the extension can work. The extension cannot show a magic link sign-in flow — too clunky inside an extension popup.

**MVP approach: shared auth via cookies + a sign-in deep link**

1. User signs into the web app at `https://lume.app` (or wherever it's deployed)
2. Supabase stores the session in localStorage and cookies on `lume.app`
3. The extension cannot directly read web app localStorage (different origins)
4. **Approach A** — the extension calls a `/api/extension-token` endpoint on the web app (CORS-allowed for the extension's origin via `chrome-extension://${EXTENSION_ID}/*`) that returns the user's current Supabase JWT. The extension stores it in `chrome.storage.local`.
5. **Approach B (simpler for MVP)** — the popup shows a "Sign in" button that opens `https://lume.app/sign-in?extension_callback=...`. Web app handles sign-in, redirects back with a token in the URL hash. Extension reads it.

Choose B for MVP. Less moving parts.

**Token refresh:** when a request returns 401, popup shows "session expired, sign in again."

## The context menu interaction

Background worker registers the context menu on install:

```ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "lume-try",
    title: "Try with Lume",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "lume-try") return;
  if (!info.srcUrl) return;

  // Open the side panel
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }

  // Send the image URL to the side panel via runtime messaging
  await chrome.runtime.sendMessage({
    type: "TRY_PRODUCT",
    imageUrl: info.srcUrl,
    pageUrl: info.pageUrl,
    pageTitle: tab?.title,
  });
});
```

Side panel listens for the message, then calls the Edge Function.

## Edge Function: `try-from-web`

A new Edge Function for the extension flow. Reuses the same patterns as other functions (auth verification, Zod validation, error handling).

**Input:**

```ts
{
  image_url: string;       // The product image URL from the retailer page
  page_title?: string;     // Optional context for Gemini
  page_url?: string;       // Optional context for Gemini
}
```

**Output:**

```ts
{
  data: {
    classification: 'makeup' | 'skincare' | 'unknown';
    slot?: string;         // For makeup: 'lipstick' | 'blush' | etc.
    concerns?: string[];   // For skincare: 'acne' | 'wrinkle' | etc.
    result_image_url: string | null;
    reasoning: string;
  }
}
```

**Flow inside the function:**

1. Verify JWT, derive `user_id`
2. Validate input with Zod
3. Fetch the product image from `image_url` (server-side, no CORS issues)
4. Call Gemini Vision: "What kind of product is this? Makeup or skincare? If makeup, what slot? If skincare, what concerns does it target? Use the page title and URL as context if helpful."
5. Look up the user's saved selfie URL from `profiles.saved_selfie_url`
6. Branch:
   - If makeup with a valid slot → call Perfect Corp Makeup VTO with the user's selfie and a default effect for that slot (using the product image as a color reference if possible, else default color)
   - If skincare with concerns → call Perfect Corp Skin Simulation with the user's selfie and the identified concerns
   - If unknown → return classification only with no result image
7. Return result

**Failure modes:**

- No saved selfie → return error code `no_saved_selfie` with a message pointing the user to the web app
- Gemini can't classify → return `classification: 'unknown'`, no error
- Perfect Corp fails → return reasoning but `result_image_url: null`

## Side panel UI

Minimal. Three states:

1. **Idle** — "Right-click any product image on a beauty site to try it on."
2. **Loading** — Progress message: "Analyzing product...", "Trying on...". Skin Simulation can take 15-30 seconds; show what's happening.
3. **Result** — Large result image, classification badge ("Makeup · Lipstick" or "Skincare · Pore + Texture"), Gemini's reasoning, link back to the web app.

Use the design tokens from the web app's design system. Import shared primitives where possible to keep the visual language consistent.

## Permissions and privacy

The extension needs to be honest in its store listing about what it does:

- Reads image URLs the user explicitly right-clicks (not all page content)
- Sends those URLs to Lume's backend, which calls Perfect Corp and Gemini
- Uses the user's saved selfie from their Lume account

No tracking, no analytics in MVP.

## Build phases

If building the extension after Phase 6:

**Stretch Phase A: Foundation (1 day)**

- Set up `extension/` folder with Vite + @crxjs + React
- Write manifest with permissions
- Empty side panel, empty background worker
- Load as unpacked extension, verify it loads and the side panel opens

**Stretch Phase B: Context menu wiring (half day)**

- Register context menu on install
- On click, open side panel and pass image URL via messaging
- Side panel displays the raw image URL (sanity check)

**Stretch Phase C: Auth (half day)**

- Sign-in flow via redirect to web app
- Token stored in `chrome.storage.local`
- Supabase client in extension reads token

**Stretch Phase D: `try-from-web` Edge Function (1 day)**

- New Edge Function following existing patterns
- Gemini classification
- Routing to Makeup VTO or Skin Simulation
- Test from a Postman-style tool first, then from the extension

**Stretch Phase E: Polish (half day)**

- Loading states with personality
- Error states (no selfie, classification failed, etc.)
- Result rendering
- Icons (16/32/48/128)

**Total stretch budget: ~3.5 days.** If you have less, cut Phase E aggressively — a working ugly extension demos better than a half-done polished one.

## Demo strategy

In the demo video, the extension comes at the end as the "wow" moment:

1. Show the polished web app first (most of the video)
2. Cut to a real Sephora/Ulta page
3. Right-click a lipstick, click "Try with Lume"
4. Side panel opens, shows the try-on result on the user's saved selfie
5. Cut to a moisturizer or serum, right-click, get a Skin Simulation outcome

Keep it under 30 seconds. The extension's job is to demonstrate ambition and reach, not to walk through every state.

## Future work (out of MVP scope, documented for completeness)

- **Content script with floating button** — instead of right-click, show a "Try on" button overlay on detected product images
- **Per-site adapters** — Sephora-specific, Ulta-specific DOM parsing to grab product name, brand, ingredients, price
- **Add to collection from extension** — "Save this to my Lume" button after a try-on
- **Wishlist tracking** — flag products the user has tried but not yet bought
- **Comparison mode** — try multiple shades side by side

None of these belong in the MVP. Listed only so they're not forgotten.

## When to write the extension Vite config differently

The `@crxjs/vite-plugin` handles most of this, but two gotchas:

1. **HMR works for the side panel and popup** but not for the background worker. Reloading the extension manually after background worker changes is normal.
2. **Path aliases** — if the extension reuses web app code (e.g. types from `src/types/`), set up a separate `tsconfig.json` in the extension folder with paths pointing back to `../src/`. Don't try to share the root tsconfig.

## Decision log

| Decision                                                                          | Rationale                                                                     |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Context menu, not content script                                                  | Less permission, simpler, faster to ship                                      |
| Side panel, not popup                                                             | Result images need space; persistent across page navigation                   |
| Reuse web app's Supabase project                                                  | One source of truth for user data, no sync issues                             |
| Shared selfie from web app profile                                                | User shouldn't have to upload twice                                           |
| Sign-in via web app redirect                                                      | Magic links don't fit inside extensions; this is simplest                     |
| `try-from-web` as a single Edge Function (not separate makeup/skincare functions) | One entry point, classification routes internally; simpler API for the client |
| No content script in MVP                                                          | Saves manifest review hassle, reduces attack surface, faster                  |
| Skip auto-detection of product pages                                              | DOM parsing is per-site and brittle; right-click works everywhere             |
