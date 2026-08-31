# Demo Video Script (~1:35)

This script matches the recorded draft (`lume-demo-v3.mp4`, 780×1688,
95s) — captured from the built app against live Supabase with the demo
account, captions burned in. The extension section is a **real live
round trip**: the panel classifies a lipstick, Perfect Corp renders it
on the demo selfie, then a serum gets the personalized 4-week preview
with clash check — nothing mocked. Voiceover lines below are sized to
each scene's real window (~2.3 words/sec); read them over the draft, or
ship it as-is with the captions (judges often watch muted).

| # | Time | Scene | On screen | Voiceover |
|---|------|-------|-----------|-----------|
| 1 | 0:00–0:06 | Sign-in | Wordmark + **v2.0** chip, demo-login button, click | "This is Lume — your shelf, graded by your own skin. Judges: one click, you're in." |
| 2 | 0:06–0:16 | Dashboard | Stat tiles (skin age, score, works count), sticker grid with verdict tags, slow scroll | "Every product here was added with two photos. Backgrounds removed, labels read, ingredients found — and each card already carries a verdict." |
| 3 | 0:16–0:24 | Skin scan | 13-metric results grouped glow/texture/tone/eyes | "One selfie returns thirteen skin metrics — plus your skin tone, Fitzpatrick type, and face shape, silently." |
| 4 | 0:24–0:33 | Routines | "everyday" with ACTIVE badge, skincare checked, makeup not | "Routines are what you actually use. Only the active routine gets graded — not the serum lost in a drawer." |
| 5 | 0:33–0:41 | Verdict | works/neutral/skip cards with reasoning, "grading: everyday" | "Every product: works, neutral, or skip — with a reason tied to your own metrics." |
| 6 | 0:41–0:49 | 4-week preview | Before/after render + product picker | "Then the proof: your skin in four weeks — simulating only what your routine actually covers." |
| 7 | 0:49–1:01 | Look | Chat prompt, "or steal a look" card, history | "Build a look from your own makeup, colors matched to your tone and face. Or steal a look from any photo — mapped to products you own." |
| 8a | 1:01–1:12 | Extension: try-on starts | Side panel idle → a **lipstick** is sent → classified "Makeup · lipstick", loading state | "And the Chrome extension takes Lume anywhere. Right-click a lipstick on any store page — Lume reads it, and Perfect Corp starts rendering." |
| 8b | 1:12–1:19 | Extension: live try-on | **you \| with this shade** before/after — Pillow Talk on the demo selfie (jump-cut over the ~20s render) | "There it is: you, and you with this shade — rendered live, before you buy." |
| 8c | 1:19–1:22 | Extension: skincare sent | The Ordinary serum → classified, loading | "Skincare? Lume checks it against your scan." |
| 8d | 1:22–1:31 | Extension: personalized preview | **you \| in 4 weeks** + chips "helps your: pore" / "you don't need: acne" + "✓ no clashes with your current routine" | "A four-week preview personalized to your metrics — what it helps, what you don't need, and whether it clashes with your routine." |
| 9 | 1:31–1:35 | Outro | Back on the wordmark + repo URL caption | "Lume, version two. Everyone ships now." |

## Production notes

- The draft was recorded headlessly (Playwright + the repo's preview
  build); the extension scenes fire the same runtime message the context
  menu sends, so both renders are real `try-from-web` round trips —
  Makeup VTO for the lipstick, metrics-personalized Skin Simulation +
  Gemini clash check for the serum.
- Scenes 8b and 8d jump-cut the ~20s Perfect Corp render wait (loading
  state stays visible before each cut for honesty).
- To re-render: scripts live in the session scratchpad (`record.mjs`,
  `ext-record2.mjs`, ffmpeg assembly). Any Claude Code session can
  rebuild them from this file's scene list.
- Subtitles/captions are already burned in; add voiceover in any editor
  (CapCut/iMovie) reading the lines above — each line fits its window at
  a natural pace.

## Upload checklist

- [ ] Voiceover recorded over the draft (optional — captions suffice)
- [ ] Uploaded to YouTube as unlisted, link pasted into Devpost
- [ ] First frame/thumbnail shows the v2.0 chip
- [ ] Devpost gallery: use `docs/images/*.png` alongside the video
