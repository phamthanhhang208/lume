# Demo Video Script (~1:18)

This script matches the recorded draft (`lume-demo-v2.mp4`, 780×1688,
78s) — nine scenes captured from the built app against live Supabase with
the demo account, captions burned in. Voiceover lines below are sized to
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
| 8 | 1:01–1:14 | Extension | Side panel: idle → classifies a mascara → VTO renders it on the selfie (jump-cut over the render wait) | "And the Chrome extension takes Lume anywhere: right-click any product on the web, and Perfect Corp renders it on your face — mascara, live, in seconds." |
| 9 | 1:14–1:18 | Outro | Back on the wordmark + repo URL caption | "Lume, version two. Everyone ships now." |

## Production notes

- The draft was recorded headlessly (Playwright + the repo's preview
  build); the extension scene fires the same runtime message the context
  menu sends, so the render is a real `try-from-web` → Makeup VTO round trip.
- Scene 8 jump-cuts the ~20s Perfect Corp render wait (5s in, then the
  reveal). If re-recording live, keep the progress state visible before
  the cut for honesty.
- To re-render: scripts live in the session scratchpad (`record.mjs`,
  `ext-action.mjs`, ffmpeg assembly). Any Claude Code session can rebuild
  them from this file's scene list.
- Subtitles/captions are already burned in; add voiceover in any editor
  (CapCut/iMovie) reading the lines above — each line fits its window at
  a natural pace.

## Upload checklist

- [ ] Voiceover recorded over the draft (optional — captions suffice)
- [ ] Uploaded to YouTube as unlisted, link pasted into Devpost
- [ ] First frame/thumbnail shows the v2.0 chip
- [ ] Devpost gallery: use `docs/images/*.png` alongside the video
