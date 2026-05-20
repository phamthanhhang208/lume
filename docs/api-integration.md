# API Integration

## Perfect Corp YouCam API

**Base URL:** `https://yce-api-01.makeupar.com`

**Auth:** `Authorization: Bearer ${PERFECTCORP_API_KEY}`

**Reference:** https://yce.perfectcorp.com/document/index.html

### Pattern: task-based async APIs

Most Perfect Corp APIs follow a three-step pattern:

1. **Upload file** — POST the image, get a `file_id`
2. **Create task** — POST with `file_id` and parameters, get a `task_id`
3. **Poll task** — GET task status until `success` or `error`, get the result URL

Implement this as a single helper in the Edge Function side:

```ts
async function runPerfectCorpTask({
  apiPath,
  imageBlob,
  params,
}: {
  apiPath: string;
  imageBlob: Blob;
  params: Record<string, unknown>;
}): Promise<PerfectCorpResult> {
  // 1. Upload file
  // 2. Create task
  // 3. Poll with backoff: 1s, 2s, 3s, 5s, 5s, 5s... up to 60s total
  // 4. Throw on timeout or error
  // 5. Return result
}
```

### Endpoints we use

| Purpose            | Endpoint                            | Notes                                            |
| ------------------ | ----------------------------------- | ------------------------------------------------ |
| Background Removal | `/s2s/v1.0/task/background-remover` | Returns transparent PNG                          |
| Skin Analysis V2.1 | `/s2s/v1.0/task/skin-analysis`      | Either SD or HD, do not mix                      |
| Skin Tone Analysis | `/s2s/v1.0/task/skin-tone-analysis` | Returns tone + eye/lip/brow/hair colors          |
| Face Analyzer      | `/s2s/v1.0/task/face-analyzer`      | Returns face shape and landmarks                 |
| Makeup VTO         | `/s2s/v1.0/task/ai-makeup`          | Accepts multiple effects (LipColor, Blush, etc.) |
| Skin Simulation    | `/s2s/v1.0/task/skin-simulation`    | Up to 10 concerns; stretch goal                  |

Confirm exact endpoint paths against the live docs before implementing each one. The docs include an API playground.

### Makeup VTO effect mapping

Each makeup product subcategory maps to a Perfect Corp effect type:

| Subcategory | Effect            |
| ----------- | ----------------- |
| lipstick    | LipColorEffect    |
| lip liner   | LipLinerEffect    |
| eyeshadow   | EyeshadowEffect   |
| eyeliner    | EyelinerEffect    |
| eyelash     | EyelashesEffect   |
| eyebrow     | EyebrowsEffect    |
| blush       | BlushEffect       |
| bronzer     | BronzerEffect     |
| contour     | ContourEffect     |
| highlighter | HighlighterEffect |
| foundation  | FoundationEffect  |
| concealer   | ConcealerEffect   |

Hardcode this map in the Edge Function. Each effect has its own JSON parameter structure; check Perfect Corp docs for the shape per effect.

For products in the user's collection, the Edge Function infers color/intensity parameters from the product photo or accepts defaults. For MVP, defaults are fine.

### Quota management

The hackathon grants 1,000 free units. Budget:

- Skin Analysis: ~10 units per call (verify)
- Background Removal: ~1 unit per call
- VTO: ~5 units per call (verify)
- Skin Tone: ~5 units per call (verify)

Verify actual unit costs at signup. Add a usage counter in the Edge Function logs to track burn rate. Stop work and discuss if we approach 800 units used before demo.

## Google Gemini 2.5 Flash

**Base URL:** Google AI Studio endpoint (use the `@google/generative-ai` SDK on the Edge Function side, or direct HTTPS if simpler in Deno).

**Auth:** `x-goog-api-key: ${GEMINI_API_KEY}`

**Model:** `gemini-2.5-flash`

### Use cases

1. **Ingredient OCR (vision):** Image of product back → list of ingredient strings
2. **Subcategory inference (text):** Product name + brand → makeup or skincare subcategory
3. **Verdict generation (text, structured output):** Scan metrics + products → per-product verdict JSON
4. **Look orchestration (text, structured output):** Prompt + owned products + skin tone → product picks JSON

### Structured output

For verdicts and look orchestration, always request structured JSON:

```ts
{
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: { /* JSON schema */ },
  },
  contents: [{ parts: [{ text: prompt }] }],
}
```

Validate the response against a Zod schema in the Edge Function before returning to the client. Retry once with a stricter prompt if validation fails.

### Prompt patterns

Keep prompts in a `/supabase/functions/_shared/prompts.ts` file as exported template functions. Do not inline long prompts in business logic.

Example structure:

```ts
export function verdictPrompt(scan: Scan, products: Product[]): string {
  return `
You are a skincare expert. Given a user's skin analysis and a list of products,
identify which products are working for them, which are neutral, and which they
should consider dropping.

SKIN METRICS (scores 0-100, higher is better for most metrics):
${formatMetrics(scan.metrics)}

PRODUCTS:
${formatProducts(products)}

Return a JSON array. Each item: {product_id, verdict, reasoning}.
- verdict: "works" | "neutral" | "skip"
- reasoning: 1-2 sentences anchored to specific skin metrics.

Be decisive. If a product targets a concern the user does not have based on
their metrics, mark it "skip". If it directly addresses a low-scoring metric,
mark it "works". Otherwise "neutral".
`.trim();
}
```

## Edge Function structure

Each Edge Function is one folder:

```
supabase/functions/
├── _shared/                  # Code shared across functions
│   ├── cors.ts
│   ├── perfectcorp.ts        # Perfect Corp client
│   ├── gemini.ts             # Gemini client
│   ├── prompts.ts            # Prompt templates
│   ├── schemas.ts            # Zod schemas for AI outputs
│   └── supabase.ts           # Server-side Supabase client
├── remove-background/
│   └── index.ts
├── extract-ingredients/
│   └── index.ts
├── analyze-skin/
│   └── index.ts
├── generate-verdict/
│   └── index.ts
├── generate-look/
│   └── index.ts
└── try-from-web/             # Stretch: Chrome extension
    └── index.ts
```

Each function:

1. Validates the JWT from the `Authorization` header against Supabase Auth
2. Validates the request body with Zod
3. Does its work
4. Returns JSON

Never trust the client to tell us who the user is. Always derive `user_id` from the verified JWT.

## Error handling

Edge Functions return standard shapes:

```ts
// Success
{ data: T }

// Error
{ error: { code: string, message: string } }
```

Client-side, TanStack Query handles retry policy. Mutations do not auto-retry unless we opt in per mutation.
