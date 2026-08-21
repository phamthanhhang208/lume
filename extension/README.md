# Lume — Chrome extension

Companion to the Lume web app. Two context-menu actions on any image:

- **Try with Lume** — classify the product (Gemini) and render Makeup VTO
  or Skin Simulation on your saved selfie
- **Steal this look with Lume** — Perfect Corp Makeup Transfer applies the
  photographed look to your selfie and maps it to products you own

See `/docs/chrome-extension.md` for the full architecture rationale.

## What works

- Manifest v3 (with icons), side panel + popup, two context-menu items
- Background worker forwards image URL + page metadata to the side panel
- Side panel calls the `try-from-web` / `transfer-look` edge functions and
  renders classification, VTO result, or the stolen look + shelf gaps
- Popup accepts a pasted Lume access token, stored in `chrome.storage.local`
- Perfect Corp payload shapes verified against the YouCam MCP catalog

## What's intentionally MVP / TODO

- **Auth is "paste your token"** — the polished sign-in-via-web-app-redirect
  flow described in `/docs/chrome-extension.md` needs the web app deployed at
  a known public URL. For dev demo, open the Lume web app in dev tools →
  Application → Local Storage → `sb-…-auth-token` → copy `access_token` →
  paste into the extension popup.

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

To hand the extension to someone else, `pnpm --filter @lume/extension zip`
produces `extension/lume-extension.zip`; they unzip it and load the folder
the same way. (Not published to the Chrome Web Store.)

## Demo flow

1. Visit any beauty product page (Sephora, Ulta, brand site, etc.)
2. Right-click the product image → **Try with Lume**
3. Side panel opens, classifies the product, and renders Makeup VTO (lipstick,
   blush, etc.) or Skin Simulation (acne, wrinkle, etc.) on your saved selfie
4. Or find a makeup look you love (Pinterest, Instagram web) → right-click →
   **Steal this look with Lume** → side panel shows the look transferred onto
   you, which of your products recreate it, and what's missing

## Files

- `manifest.json` — Manifest v3
- `src/background.ts` — context menu + side panel open + runtime messaging
- `src/sidepanel/` — React panel that listens for messages and calls the API
- `src/popup/` — paste-token MVP auth
- `src/shared/` — auth helpers, edge-function fetch wrapper, shared types
- `vite.config.ts` — uses `@crxjs/vite-plugin` to bundle into `dist/`
