# Architecture

## System overview

Lume is a client-heavy PWA. The React app talks directly to Supabase for auth, data persistence, and image storage. For third-party AI APIs (Perfect Corp, Gemini), the app calls Supabase Edge Functions which act as a thin proxy to keep API keys server-side.

```
[React PWA]
    |
    +---> Supabase Auth (magic link)
    +---> Supabase Postgres (data)
    +---> Supabase Storage (images)
    +---> Supabase Edge Functions
              |
              +---> Perfect Corp YouCam API
              +---> Google Gemini 2.5 Flash API
```

## Why this shape

- **Edge Functions for AI APIs:** Perfect Corp and Gemini API keys must not ship to the client. Edge Functions are the cheapest, simplest server-side surface.
- **Direct Supabase from client:** Row Level Security policies handle authorization. No need for a custom backend.
- **TanStack Query for everything network:** Caching, retries, optimistic updates, loading and error states out of the box.
- **Zustand for client-only state:** Wizard progress during product addition, draft scan results before save, UI flags.

## Tech stack with rationale

| Tech              | Why                                                                      |
| ----------------- | ------------------------------------------------------------------------ |
| Vite              | Fast dev server, fast HMR, simple config                                 |
| React 19          | Latest stable, supports new hooks (useOptimistic, useFormStatus)         |
| TypeScript strict | Catches bugs, makes refactors safe                                       |
| Tailwind v4       | CSS-first config, fast, no runtime                                       |
| React Router v7   | Data routes pattern fits this app's loading needs                        |
| Zustand           | Lightweight, no boilerplate, perfect for client-only state               |
| TanStack Query    | Standard for server state, handles caching for AI responses              |
| Supabase          | Auth + DB + Storage + Edge Functions in one platform, generous free tier |
| pnpm              | Faster than npm, disk-efficient                                          |

## What we are NOT using

- No global Redux. Zustand + TanStack Query covers the same ground with less code.
- No CSS-in-JS. Tailwind handles styling.
- No form library yet. Forms are simple enough for controlled components. Revisit if forms grow complex.
- No UI component library (no shadcn, MUI, Chakra). Custom components only. The visual design is bespoke.
- No analytics. Hackathon scope, not needed.
- No SSR. Pure SPA / PWA.

## Folder structure

```
lume/
├── CLAUDE.md
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── flows.md
│   ├── api-integration.md
│   ├── conventions.md
│   └── phases.md
├── public/
│   └── (PWA assets later)
├── supabase/
│   ├── migrations/           # SQL migration files
│   └── functions/            # Edge Functions (one folder per function)
├── src/
│   ├── routes/               # Route components, one per route
│   ├── components/           # Reusable UI components
│   │   └── ui/               # Primitive components (Button, Input, etc.)
│   ├── features/             # Feature-scoped logic (auth, products, scans, looks)
│   │   ├── auth/
│   │   ├── products/
│   │   ├── scans/
│   │   └── looks/
│   ├── lib/                  # Cross-cutting utilities
│   │   ├── supabase.ts       # Supabase client
│   │   ├── queryClient.ts    # TanStack Query client
│   │   └── cn.ts             # className helper
│   ├── stores/               # Zustand stores
│   ├── hooks/                # Custom hooks
│   ├── types/                # Shared TypeScript types
│   ├── styles/               # Global styles
│   ├── main.tsx
│   └── App.tsx
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vite.config.ts
```

## Feature folders

Each feature folder contains everything for that domain:

```
features/products/
├── api/                      # TanStack Query hooks (useProducts, useAddProduct)
├── components/               # ProductCard, ProductDetail, etc.
├── hooks/                    # Feature-specific hooks
├── types.ts                  # Product, ProductCategory, etc.
└── utils.ts                  # Pure helpers
```

Route components in `/routes` are thin and compose feature components.

## State boundaries

- **Server state (TanStack Query):** anything fetched from Supabase or Edge Functions. Products, scans, looks, verdicts, user profile.
- **Client state (Zustand):** wizard step in "add product" flow, current draft of a new product, UI flags like "settings sheet open".
- **URL state (React Router):** which route, which product is selected, modal open/closed if relevant.
- **Form state:** local component state with `useState`, lifted only if shared.

If something is server state, it goes in TanStack Query. Do not duplicate it in Zustand.

## Environment variables

All client-side env vars are prefixed `VITE_`:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Server-side secrets (Perfect Corp key, Gemini key) live in Supabase Edge Function secrets, never in the client.
