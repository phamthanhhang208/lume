# Conventions

## TypeScript

- Strict mode is on. Do not turn it off.
- No `any`. Use `unknown` and narrow.
- No `@ts-ignore` or `@ts-expect-error` without a comment explaining why.
- Prefer `type` for unions and primitives, `interface` for object shapes with extension.
- Use `as const` for literal arrays and objects you treat as enums.
- Use Zod for runtime validation at boundaries (API responses, Edge Function inputs).

## File naming

- React components: `PascalCase.tsx` — `ProductCard.tsx`
- Hooks: `camelCase.ts` starting with `use` — `useProduct.ts`
- Utilities: `camelCase.ts` — `formatDate.ts`
- Types: `kebab-case.ts` or grouped in a single `types.ts` per feature
- Edge Functions: `kebab-case` folder names — `generate-verdict/`
- SQL migrations: `YYYYMMDD_NNN_description.sql`

## Imports

Order:

1. External packages (React, lib imports)
2. Internal absolute imports (`@/lib/...`, `@/features/...`)
3. Relative imports (`./SomeComponent`)
4. Type-only imports last in each group

Use absolute imports via path alias `@/` mapped to `src/`.

## Component patterns

- One component per file. Co-locate small subcomponents only if they're truly private to the parent.
- Default export the main component; named export everything else (types, sub-hooks, helpers).
- Props: define a `Props` interface in the same file. Inline destructure in the function signature.
- Avoid `React.FC`. Plain function components.

```tsx
interface ProductCardProps {
  product: Product;
  onTap: (id: string) => void;
}

export default function ProductCard({ product, onTap }: ProductCardProps) {
  // ...
}
```

## Hooks

- Custom hooks live in feature folders for feature-specific hooks, in `/src/hooks` for cross-cutting hooks.
- TanStack Query hooks are named `useFoo` for queries, `useFooMutation` for mutations.
- One hook per file.

## State

- Local UI state: `useState`
- Cross-component client state: Zustand store, one per concern (`useDraftProductStore`, `useSettingsStore`)
- Server state: TanStack Query, never duplicated into Zustand
- Form state: `useState` until it gets complex enough to warrant a form library (decide then, not now)

## Zustand patterns

```ts
interface DraftProductState {
  step: "capture" | "preview" | "back" | "ingredients" | "details";
  originalImageBlob: Blob | null;
  stickerImageUrl: string | null;
  backImageBlob: Blob | null;
  ingredients: string[];
  name: string;
  brand: string;
  reset: () => void;
  setStep: (step: DraftProductState["step"]) => void;
  // ... actions
}

export const useDraftProductStore = create<DraftProductState>((set) => ({
  // initial state
  // actions
}));
```

Always include a `reset` action. Always reset after the flow completes.

## TanStack Query patterns

- Query keys are arrays starting with the entity: `['products']`, `['products', productId]`, `['scans', 'latest']`
- Centralize query keys in a `queryKeys` object per feature
- Use `staleTime` aggressively; refetch is rarely useful for this app

```ts
export const productKeys = {
  all: ["products"] as const,
  detail: (id: string) => ["products", id] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });
}
```

## Error handling

- Throw in async functions; let TanStack Query catch
- Show user-facing errors with a consistent component (TBD: `<ErrorMessage />`)
- Log unexpected errors to console with context — these are visible during dev and demo

## Async / loading patterns

- Long-running operations (Skin Analysis, VTO) need a dedicated loading screen, not just a spinner
- Show what's happening: "Analyzing skin", "Generating your look"
- Timeouts: client gives up after 90 seconds and shows a friendly error

## Routing

- Use React Router v7 data routes
- Loaders fetch the minimum needed to render the route
- Actions handle form submissions and mutations
- Use `<Form>` for mutations when navigation should happen on success; useMutation when staying on the same page

## Comments

- Code should explain itself. Comments explain _why_, not _what_.
- TODO comments must include an owner: `// TODO(jen): handle expired session`
- Skip JSDoc on internal functions. Use it on exported APIs that have non-obvious behavior.

## Git

- Branch names: `phase-N-short-description` (e.g. `phase-1-auth-and-supabase`)
- Commits: present-tense, lowercase, no period. "add product card component"
- One concern per commit. Don't mix refactors with features.
- Never commit `.env`. Verify `.gitignore` before first push.

## Testing

- No tests for hackathon scope unless something is genuinely hard to verify by hand
- If you reach for a test, write it with Vitest + React Testing Library
- Edge Functions can have a simple Deno test for prompt building / response parsing

## What to ask Jen before doing

- Adding any package not in `architecture.md`
- Changing the data model
- Changing a flow's behavior
- Naming user-facing strings (microcopy matters; defer to Jen)
- Any UI choice (colors, fonts, spacing, copy, icons) — this project's visual design is a separate workstream
