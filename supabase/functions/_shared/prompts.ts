// Prompt templates for Gemini calls. Keep them here per docs/api-integration.md:
// "Do not inline long prompts in business logic."

export function ingredientOcrPrompt(): string {
  return `You are extracting the ingredients list from a photo of the back of a beauty product (makeup or skincare).

Return a JSON array of ingredient strings, exactly as they appear on the package, in order. Do not invent ingredients. Do not normalize spelling. If you cannot find an ingredients list, return an empty array.`;
}

export function ingredientOcrPromptStricter(): string {
  return `You MUST return a JSON array (and ONLY a JSON array) of strings. No commentary, no wrapper object, no trailing text. If you cannot find an ingredients list, return [].

Photo: back of a beauty product. Return the printed ingredients list, in order, exactly as printed. Each ingredient is one string. Do not invent or normalize.`;
}

export function ingredientSearchPrompt(name: string, brand: string | null): string {
  const fullName = brand ? `${brand} ${name}` : name;
  return `Search the web for the published ingredients list of this beauty product:

Product: ${fullName}

Look at the manufacturer's website, official retailer pages (Sephora, Ulta, brand sites), or reputable beauty databases. Return ONLY a JSON object inside a \`\`\`json fenced code block, like this:

\`\`\`json
{
  "ingredients": ["water", "glycerin", "niacinamide"],
  "source_url": "https://www.example.com/product-page"
}
\`\`\`

Rules:
- ingredients: array of ingredient strings as printed on the source page, in order.
- source_url: the URL you sourced the list from. Use null if you are not confident.
- If you cannot find a credible ingredients list, return {"ingredients": [], "source_url": null}.
- Do not invent ingredients. Do not include commentary outside the JSON block.`;
}

export function ingredientSearchPromptStricter(name: string, brand: string | null): string {
  const fullName = brand ? `${brand} ${name}` : name;
  return `Return exactly one JSON object and nothing else. No prose, no markdown fences, no commentary:
{"ingredients": string[], "source_url": string | null}

Find the published ingredients list for: ${fullName}

If you are not confident, return {"ingredients": [], "source_url": null}.`;
}

// Kept in sync with src/features/products/utils/subcategories.ts.
// Edge runtime can't import TS path aliases, so the lists are duplicated here.
const MAKEUP_SUBCATEGORIES = [
  "foundation",
  "concealer",
  "blush",
  "bronzer",
  "contour",
  "highlighter",
  "lipstick",
  "lip liner",
  "eyeshadow",
  "eyeliner",
  "eyelash",
  "eyebrow",
];

const SKINCARE_SUBCATEGORIES = [
  "cleanser",
  "toner",
  "serum",
  "moisturizer",
  "eye cream",
  "sunscreen",
  "mask",
  "exfoliant",
  "treatment",
];

export function frontInfoPrompt(category: "makeup" | "skincare"): string {
  const subs =
    category === "makeup" ? MAKEUP_SUBCATEGORIES : SKINCARE_SUBCATEGORIES;
  return `You are looking at the FRONT of a ${category} product package. Extract what is printed.

Return JSON with these keys:
- name: full product name as printed (e.g. "Moisturizing Cream", "Cherry Bomb Lipstick"). Null if not readable.
- brand: brand name only, no taglines (e.g. "CeraVe", "MAC", "The Ordinary"). Null if not visible.
- subcategory: exactly ONE of these strings, lowercase: ${subs.join(", ")}. Null if none clearly fit.
- shade: color or shade name if printed (e.g. "Rose Petal", "Medium 23", "01 Beige"). Null otherwise. Usually only on makeup.

Rules:
- Return null for any field you cannot read with high confidence. Do not guess.
- subcategory must be one of the listed values verbatim, or null.
- Do not include any field other than name, brand, subcategory, shade.`;
}

export function frontInfoPromptStricter(category: "makeup" | "skincare"): string {
  const subs =
    category === "makeup" ? MAKEUP_SUBCATEGORIES : SKINCARE_SUBCATEGORIES;
  return `Return ONLY a JSON object with exactly these keys: name, brand, subcategory, shade. Each value is either a string or null. No prose, no markdown.

subcategory MUST be one of: ${subs.join(", ")}, or null.

Photo: front of a ${category} product. Read the package; do not invent or guess. Null beats a wrong answer.`;
}

interface VerdictProductCtx {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  ingredients: string[];
}

function formatMetrics(metrics: Record<string, number>): string {
  return Object.entries(metrics)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join("\n");
}

function formatProducts(products: VerdictProductCtx[]): string {
  return products
    .map((product) => {
      const head = `- id: ${product.id}\n  name: ${product.name}${
        product.brand ? ` (${product.brand})` : ""
      }`;
      const cat = `\n  category: ${product.category}${
        product.subcategory ? ` / ${product.subcategory}` : ""
      }`;
      const ing =
        product.ingredients.length > 0
          ? `\n  ingredients: ${product.ingredients.slice(0, 25).join(", ")}`
          : "";
      return head + cat + ing;
    })
    .join("\n");
}

export function verdictPrompt(
  metrics: Record<string, number>,
  products: VerdictProductCtx[],
): string {
  return `You are a skincare expert. Given a user's skin analysis and a list of products,
identify which products are working for them, which are neutral, and which they
should consider dropping.

SKIN METRICS (scores 0-100; higher is generally better):
${formatMetrics(metrics)}

PRODUCTS:
${formatProducts(products)}

Return a JSON array. Each item MUST be {"product_id": <id>, "verdict": "works"|"neutral"|"skip", "reasoning": <1-2 sentences>}.
- Anchor each reasoning to a specific metric or ingredient.
- If a product targets a concern the user does not have based on their metrics, mark it "skip".
- If it directly addresses a low-scoring metric, mark it "works".
- Otherwise "neutral".
- Include EVERY product_id from PRODUCTS exactly once. Do not invent product_ids.`;
}

export function verdictPromptStricter(
  metrics: Record<string, number>,
  products: VerdictProductCtx[],
): string {
  return `Return ONLY a JSON array. No prose, no markdown, no wrapper object.
Each element MUST have keys product_id (string), verdict (one of "works"|"neutral"|"skip"), reasoning (string).
Include one entry per product_id listed below, in the same order.

METRICS:
${formatMetrics(metrics)}

PRODUCTS:
${formatProducts(products)}`;
}

interface LookProductCtx {
  id: string;
  name: string;
  brand: string | null;
  subcategory: string | null;
}

function formatLookProducts(products: LookProductCtx[]): string {
  return products
    .map(
      (product) =>
        `- id: ${product.id} | ${product.subcategory ?? "?"} | ${product.name}${
          product.brand ? ` (${product.brand})` : ""
        }`,
    )
    .join("\n");
}

export function lookPrompt(
  userPrompt: string,
  products: LookProductCtx[],
  validSlots: readonly string[],
  faceShape: string | null,
): string {
  const facePart = faceShape
    ? `\nUSER FACE SHAPE: ${faceShape}\nWhen relevant, tailor contour, highlighter, and brow choices to this face shape.\n`
    : "";
  return `You are a makeup artist. Pick a subset of the user's owned makeup products that
fits the look they describe. Assign each picked product to a single slot.

USER PROMPT: ${userPrompt}
${facePart}
OWNED MAKEUP PRODUCTS:
${formatLookProducts(products)}

VALID SLOTS: ${validSlots.join(", ")}

Return a JSON object with:
- products: array of {"product_id": <id>, "slot": <one of VALID SLOTS>}
- reasoning: 1-3 sentences on why these picks fit the look${
    faceShape ? " (mention face shape if it influenced a pick)" : ""
  }
- gaps: array of slot names that the user doesn't own a good product for

Rules:
- Only use product_ids from OWNED MAKEUP PRODUCTS.
- Each slot appears at most once across products[].
- Prefer products whose subcategory naturally matches the slot.
- If nothing matches, return an empty products array with gaps explaining what's missing.`;
}

export function lookPromptStricter(
  userPrompt: string,
  products: LookProductCtx[],
  validSlots: readonly string[],
  faceShape: string | null,
): string {
  const facePart = faceShape ? `\nFACE SHAPE: ${faceShape}\n` : "";
  return `Return ONLY a JSON object: {"products":[{"product_id":string,"slot":string}],"reasoning":string,"gaps":string[]}.
slot MUST be one of: ${validSlots.join(", ")}. product_id MUST come from the list below.

USER PROMPT: ${userPrompt}
${facePart}
PRODUCTS:
${formatLookProducts(products)}`;
}
