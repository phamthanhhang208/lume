# Design System

The visual design for Lume lives in `/design/`. This is the authoritative source for the app's look and feel. The design package was produced by Claude Design and contains full React/JSX implementations, not just static reference.

## What's in `/design/`

```
design/
├── README.md                 # Design system's own documentation — read first
├── index.html                # Canvas viewer entry (do not port)
├── project/
│   ├── lume-shared.jsx       # Design tokens, primitives, shared components — read second
│   ├── lume-app.jsx          # Top-level composition / routing demo
│   ├── lume-dashboard.jsx    # Dashboard screen
│   ├── lume-add-product.jsx  # Add product flow
│   ├── lume-skin.jsx         # Skin analysis screen
│   ├── lume-verdict.jsx      # Routine verdict screen
│   ├── lume-look.jsx         # Build a look screen
│   ├── lume-profile.jsx      # Profile screen
│   ├── lume-desktop.jsx      # Desktop frame wrapper — do NOT port
│   ├── ios-frame.jsx         # iOS phone frame wrapper — do NOT port
│   ├── design-canvas.jsx     # Canvas UI — do NOT port
│   ├── tweaks-panel.jsx      # Canvas tweaks panel — do NOT port
│   ├── uploads/              # Assets provided to the design session
│   └── screenshots/          # Rendered screen images, good visual reference
```

## Files to port vs. files to ignore

**Port these:**

- `lume-shared.jsx` — extract tokens and primitives into the codebase
- `lume-dashboard.jsx`, `lume-add-product.jsx`, `lume-skin.jsx`, `lume-verdict.jsx`, `lume-look.jsx`, `lume-profile.jsx` — adapt into route components

**Do not port:**

- `lume-desktop.jsx`, `ios-frame.jsx` — these are display frames only relevant to the design canvas
- `design-canvas.jsx`, `tweaks-panel.jsx` — Claude Design's own canvas UI
- `index.html` — canvas entry point

## How to use the design package

The screens in the design package are **already React**. The job is not to rebuild them from scratch — it's to lift and adapt them into the live codebase with real data and real flows wired up.

### Step 1: Read first

1. `/design/README.md` — understand the design system's own conventions
2. `/design/project/lume-shared.jsx` — understand the tokens and primitives

### Step 2: Inventory before porting

Before any code changes, produce a summary:

1. Every design token (colors, fonts, sizes, shadows, radii, animations)
2. Every primitive component in `lume-shared.jsx` (Button, Card, Tag, Input, etc.)
3. Every screen and which flow from `/docs/flows.md` it maps to
4. Anything in the design that doesn't match `/docs/flows.md`
5. Anything in `/docs/flows.md` the design doesn't cover

Show this inventory to Jen before touching the codebase.

### Step 3: Extract the design system

Port the foundation first, before any screens:

1. **Design tokens** → Tailwind config (CSS-first if v4)
   - Read colors, fonts, spacing, radii, shadows from `lume-shared.jsx`
   - Map them into `tailwind.config` or the `@theme` block in v4

2. **Global styles** → `src/styles/global.css`
   - Body background, base text, font loading

3. **Primitives** → `src/components/ui/`
   - Each primitive component from `lume-shared.jsx` becomes its own file
   - Strip out any design-canvas-specific props or wrappers
   - Keep the visual implementation intact

4. **Decorative assets** → `src/assets/`
   - Any SVGs, patterns, or images referenced by the design

### Step 4: Adapt screens

Each screen in the design package is currently a pure presentational component. To use it:

1. Copy the screen JSX into a route component in `src/routes/`
2. Replace any hardcoded mock data with TanStack Query hooks (`useProducts`, `useLatestScan`, etc.)
3. Replace stub event handlers with real mutations
4. Verify loading, empty, and error states match the design's intent
5. If a state isn't in the design, ask Jen rather than improvise

### Step 5: Verify against screenshots

The `/design/project/screenshots/` folder shows the design's intended rendered output. After each screen is wired up, the live app should look like the screenshot. If it doesn't, the gap is a bug.

## Rules

- Do not deviate from the design's visual implementation without asking
- Do not add components the design doesn't show
- Do not add interactions or animations the design doesn't specify (unless Jen approves)
- If the design uses libraries we don't have (e.g. framer-motion, a specific font), ask before adding them
- Treat `/design/` as read-only reference. Never edit files inside `/design/`. Updates to the design package replace it wholesale.

## When the design package is updated

If Jen provides a new `/design/` package:

1. Diff the old and new `lume-shared.jsx` to find token and primitive changes
2. Update Tailwind config and primitives
3. Re-port any screens that changed substantively
4. Verify every screen against the new screenshots

## Mapping screens to flows

| Design file            | Flow from `/docs/flows.md`        | Route           |
| ---------------------- | --------------------------------- | --------------- |
| `lume-dashboard.jsx`   | Hub for all flows                 | `/dashboard`    |
| `lume-add-product.jsx` | Flow 1: Add a product             | `/products/new` |
| `lume-skin.jsx`        | Flow 2: Skin analysis             | `/scan`         |
| `lume-verdict.jsx`     | Flow 3: Routine verdict           | `/verdict`      |
| `lume-look.jsx`        | Flow 4: Build me a look           | `/look`         |
| `lume-profile.jsx`     | Settings, saved selfie management | `/profile`      |

If a screen handles multiple sub-states (capture, preview, confirm, etc.) the route may need internal state machine logic. Use Zustand for multi-step wizards as specified in `/docs/conventions.md`.
