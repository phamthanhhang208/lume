# Lume — Chrome extension (stretch)

Companion to the Lume web app. Right-click a product image on any beauty
retailer, click **Try with Lume**, and the side panel renders the result.

See `/docs/chrome-extension.md` for the full architecture rationale.

## What works

- Manifest v3, side panel + popup, context-menu registration on images
- Background worker forwards image URL + page metadata to the side panel
- Side panel calls the `try-from-web` edge function (already deployed) and
  renders the classification + result image
- Popup accepts a pasted Lume access token, stored in `chrome.storage.local`

## What's intentionally MVP / TODO

- **Auth is "paste your token"** — the polished sign-in-via-web-app-redirect
  flow described in `/docs/chrome-extension.md` needs the web app deployed at
  a known public URL. For dev demo, open the Lume web app in dev tools →
  Application → Local Storage → `sb-…-auth-token` → copy `access_token` →
  paste into the extension popup.
- **No icons.** The `manifest.json` omits the `icons` block so the build
  passes without placeholder PNGs. Drop 16/32/48/128 PNGs into
  `public/icons/` and add them back to the manifest before publishing.
- **`skin-simulation` Perfect Corp call** uses guessed feature name and
  payload shape — needs verification against live Perfect Corp docs on
  first real run.

## Setup

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (same as web app)
pnpm install   # if not done at the workspace root
pnpm --filter @lume/extension build
```

Then in Chrome:

1. Visit `chrome://extensions`
2. Toggle **Developer mode** on
3. Click **Load unpacked**, pick `extension/dist`
4. Click the toolbar icon → popup → paste your Lume access token

## Demo flow

1. Visit any beauty product page (Sephora, Ulta, brand site, etc.)
2. Right-click the product image → **Try with Lume**
3. Side panel opens, classifies the product, and renders Makeup VTO (lipstick,
   blush, etc.) or Skin Simulation (acne, wrinkle, etc.) on your saved selfie

## Files

- `manifest.json` — Manifest v3 (no icons)
- `src/background.ts` — context menu + side panel open + runtime messaging
- `src/sidepanel/` — React panel that listens for messages and calls the API
- `src/popup/` — paste-token MVP auth
- `src/shared/` — auth helpers, edge-function fetch wrapper, shared types
- `vite.config.ts` — uses `@crxjs/vite-plugin` to bundle into `dist/`
