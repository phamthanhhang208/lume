# README screenshot shot list

Capture from the **deployed app** signed in as the demo account (so every
screen has data). Mobile frame: Chrome DevTools device toolbar at 390×844
(iPhone 12 Pro) makes the most flattering crops; desktop shots at 1280 wide
also work. Save as PNG into this folder with these exact filenames — the
README image grid links to them.

| File | Screen | State to capture |
| --- | --- | --- |
| `dashboard.png` | `/dashboard` | Product sticker grid populated (≥6 products), verdict summary card showing counts |
| `scan.png` | `/scan` | Results view: overall score, skin age, 13 metric rows |
| `routines.png` | `/routines` | "everyday" routine expanded, several products checked, ACTIVE badge visible |
| `verdict.png` | `/verdict` | Verdict cards + the 4-week preview rendered with coverage chips ("routine covers / not covered yet") in frame |
| `steal-look.png` | `/look` | "the look \| on you" side-by-side after a steal, with the cast list below |
| `extension.png` | Side panel | Skincare result: "you \| in 4 weeks" grid, concern chips, clash line |
| `extension-tryon.png` | Side panel | Makeup result: "you \| with this shade" live try-on grid |
| `extension-desktop.png` | Desktop composite | Real narscosmetics.com product page + side panel showing the live lipstick try-on (frame from the demo video) |

Tips:

- Hide bookmarks bar; use a clean profile so no personal info leaks into frame.
- The verdict shot needs a **fresh** preview generation (chips are not shown
  for cached results) — clear `scans.simulation_image_url` or re-scan first.
- Optional extras for the Devpost gallery (not linked in README):
  `aging.png` (fast-forward card), `shade-match.png` (add-product caption),
  `novus.png` (Novus dashboard with traffic).
