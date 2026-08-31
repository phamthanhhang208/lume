# Demo Video Script (~1:39)

This script matches the recorded draft (`lume-demo-v4.mp4`, **1920×1080
desktop**, 99s) — captured from the built app against live Supabase with
the demo account, captions burned in. The extension section happens on
**real retailer pages** — narscosmetics.com (Explicit Lipstick, Rose Tea
Brown) and theordinary.com (Niacinamide 10% + Zinc 1%) — and both
renders are **real live round trips** through `try-from-web`: Makeup VTO
for the lipstick, metrics-personalized Skin Simulation + Gemini clash
check for the serum. Nothing mocked. Voiceover lines below are sized to
each scene's real window (~2.3 words/sec); read them over the draft, or
ship it as-is with the captions (judges often watch muted).

| # | Time | Scene | On screen | Voiceover |
|---|------|-------|-----------|-----------|
| 1 | 0:00–0:06 | Sign-in | Wordmark + **v2.0** chip, demo-login button, click | "This is Lume — your shelf, graded by your own skin. Judges: one click, you're in." |
| 2 | 0:06–0:18 | Dashboard | Stat tiles (skin age, score, works count), sticker grid with verdict tags, slow scroll | "Every product here was added with two photos. Backgrounds removed, labels read, ingredients found — and each card already carries a verdict." |
| 3 | 0:18–0:26 | Skin scan | 13-metric results grouped glow/texture/tone/eyes | "One selfie returns thirteen skin metrics — plus your skin tone, Fitzpatrick type, and face shape, silently." |
| 4 | 0:26–0:34 | Routines | "everyday" with ACTIVE badge, skincare checked, makeup not | "Routines are what you actually use. Only the active routine gets graded — not the serum lost in a drawer." |
| 5 | 0:34–0:42 | Verdict | works/neutral/skip cards with reasoning | "Every product: works, neutral, or skip — with a reason tied to your own metrics." |
| 6 | 0:42–0:49 | 4-week preview | Before/after render + product picker | "Then the proof: your skin in four weeks — simulating only what your routine actually covers." |
| 7 | 0:49–1:01 | Look | Chat prompt, "or steal a look" card, history | "Build a look from your own makeup, colors matched to your tone and face. Or steal a look from any photo — mapped to products you own." |
| 8a | 1:01–1:06 | Extension: right-click on NARS | Real narscosmetics.com lipstick page, side panel open (idle), context menu → **Try with Lume** | "The Chrome extension takes Lume anywhere — right-click any product." |
| 8b | 1:06–1:17 | Extension: live try-on | Panel classifies "Makeup · lipstick", loading → **you \| with this shade** before/after, Rose Tea Brown on the demo selfie (jump-cut over the ~25s render) | "On NARS dot com: Lume reads the lipstick, and Perfect Corp renders it — you, and you with this shade, before you buy." |
| 8c | 1:17–1:23 | Extension: right-click on The Ordinary | Real theordinary.com serum page, same context menu (panel still shows the lipstick result) | "Skincare? Right-click that serum on The Ordinary." |
| 8d | 1:23–1:34 | Extension: personalized preview | Loading → **you \| in 4 weeks** + chips "helps your: pore" / "you don't need: acne" + "✓ no clashes with your current routine" | "Checked against your own scan: a four-week preview — what it helps, what you don't need, and no clashes with your routine." |
| 9 | 1:34–1:39 | Outro | Back on the wordmark + repo URL caption | "Lume, version two. Everyone ships now." |

## Production notes

- Recorded headlessly (Playwright + the repo's preview build at
  1920×1080). The retailer pages are the **live NARS and The Ordinary
  sites** loaded in the recording browser; both extension results are
  real `try-from-web` round trips fired with each page's actual product
  image URL.
- Two things are staged, because headless capture cannot show native
  Chrome UI: the right-click **context menu is a replica** drawn in-page
  (same labels as the real extension registers — "Try with Lume" /
  "Steal this look with Lume"), and the **side panel is composited**
  next to the page footage at its real 420px width. The panel content
  itself is the real extension UI, recorded live.
- Scenes 8b and 8d jump-cut the ~25s Perfect Corp render wait (loading
  state stays visible before each cut for honesty).
- Sephora was the first choice of retailer but blocks datacenter IPs
  (403 on product pages); NARS + The Ordinary load fine and match
  products on the demo shelf.
- To re-render: scripts live in the session scratchpad
  (`record-desktop.mjs`, `retail-shoot.mjs`, `panel-shoot.mjs`, ffmpeg
  assembly). Any Claude Code session can rebuild them from this file's
  scene list.
- Captions are burned in; add voiceover in any editor (CapCut/iMovie)
  reading the lines above — each line fits its window at a natural pace.

## Upload checklist

- [ ] Voiceover recorded over the draft (optional — captions suffice)
- [ ] Uploaded to YouTube as unlisted, link pasted into Devpost
- [ ] First frame/thumbnail shows the v2.0 chip
- [ ] Devpost gallery: use `docs/images/*.png` alongside the video
