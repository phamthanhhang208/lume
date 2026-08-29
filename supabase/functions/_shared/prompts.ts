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

function formatSkinType(skinType: string | null): string {
  if (!skinType) return "";
  return `\nUSER SKIN TYPE: Fitzpatrick ${skinType}. Factor in photosensitivity of ingredients (retinoids, AHAs/BHAs increase sun sensitivity) and the importance of SPF for this skin type.\n`;
}

export function verdictPrompt(
  metrics: Record<string, number>,
  products: VerdictProductCtx[],
  skinType: string | null,
): string {
  return `You are a skincare expert. Given a user's skin analysis and a list of products,
identify which products are working for them, which are neutral, and which they
should consider dropping.
${formatSkinType(skinType)}
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
  skinType: string | null,
): string {
  return `Return ONLY a JSON array. No prose, no markdown, no wrapper object.
Each element MUST have keys product_id (string), verdict (one of "works"|"neutral"|"skip"), reasoning (string).
Include one entry per product_id listed below, in the same order.
${formatSkinType(skinType)}
METRICS:
${formatMetrics(metrics)}

PRODUCTS:
${formatProducts(products)}`;
}

export function shadeCheckPrompt(
  name: string,
  brand: string | null,
  shade: string,
  tone: SkinToneCtx,
): string {
  const product = brand ? `${brand} ${name}` : name;
  return `You are a makeup artist. The user is adding a complexion product and you know their coloring from a Perfect Corp skin tone analysis.

PRODUCT: ${product}
SHADE: ${shade}
${formatSkinTone(tone)}
Based on what you know about this product line's shade range and naming, does this shade suit the user's skin tone?

Return a JSON object:
- verdict: one of "match" | "too_warm" | "too_cool" | "too_light" | "too_deep" | "unknown"
- note: one short sentence explaining, or null when verdict is "unknown"

Rules:
- "unknown" when you don't recognize the shade system or can't judge confidently. Prefer "unknown" over guessing.
- Judge undertone (warm/cool) and depth (light/deep) separately; report the bigger mismatch.`;
}

export function shadeCheckPromptStricter(
  name: string,
  brand: string | null,
  shade: string,
  tone: SkinToneCtx,
): string {
  const product = brand ? `${brand} ${name}` : name;
  return `Return ONLY JSON: {"verdict":"match"|"too_warm"|"too_cool"|"too_light"|"too_deep"|"unknown","note":string|null}.
Product: ${product}. Shade: ${shade}. ${formatSkinTone(tone)}
Prefer "unknown" over guessing.`;
}

export function routineCoveragePrompt(
  products: VerdictProductCtx[],
  lowConcerns: string[],
): string {
  return `You are a skincare expert. The user's skin scan flagged these low-scoring concerns:

LOW CONCERNS: ${lowConcerns.join(", ")}

Their current routine (products rated "works" for them):
${formatProducts(products)}

Which of the LOW CONCERNS does this routine actually address, based on the ingredients?
(e.g. niacinamide → redness/texture, retinol → wrinkle, salicylic acid → acne/pore, caffeine → dark_circle/eye_bag, vitamin C → age_spot/radiance)

Return a JSON object:
- covered: array of concern keys from LOW CONCERNS that at least one product credibly addresses
- reasoning: 1-2 sentences naming which product covers what

Rules:
- covered MUST be a subset of LOW CONCERNS, using the exact keys given.
- Only include a concern if an ingredient in some product is known to help it. Be conservative.`;
}

export function routineCoveragePromptStricter(
  products: VerdictProductCtx[],
  lowConcerns: string[],
): string {
  return `Return ONLY a JSON object: {"covered":string[],"reasoning":string}. No prose, no markdown.
covered MUST be a subset of: ${lowConcerns.join(", ")} (exact keys, possibly empty).

PRODUCTS:
${formatProducts(products)}`;
}

interface LookProductCtx {
  id: string;
  name: string;
  brand: string | null;
  subcategory: string | null;
  shade?: string | null;
}

export interface SkinToneCtx {
  skin_tone: string | null;
  eye_color: string | null;
  lip_color: string | null;
  brow_color: string | null;
  hair_color: string | null;
}

function pickStr(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Parses profiles.skin_tone_data (shape from analyze-skin-tone/summarize). */
export function skinToneFrom(raw: unknown): SkinToneCtx | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const tone: SkinToneCtx = {
    skin_tone: pickStr(obj, "skin_tone"),
    eye_color: pickStr(obj, "eye_color"),
    lip_color: pickStr(obj, "lip_color"),
    brow_color: pickStr(obj, "brow_color"),
    hair_color: pickStr(obj, "hair_color"),
  };
  return Object.values(tone).some((v) => v !== null) ? tone : null;
}

/** Parses profiles.face_data (shape from analyze-face/summarize). */
export function faceAttrsFrom(raw: unknown): FaceAttrsCtx | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const attrs: FaceAttrsCtx = {
    face_shape: pickStr(obj, "face_shape"),
    eye_shape: pickStr(obj, "eye_shape"),
    eyelid: pickStr(obj, "eyelid"),
    eyebrow_shape: pickStr(obj, "eyebrow_shape"),
    lip_shape: pickStr(obj, "lip_shape"),
  };
  return Object.values(attrs).some((v) => v !== null) ? attrs : null;
}

function formatSkinTone(tone: SkinToneCtx | null): string {
  if (!tone) return "";
  const parts = [
    tone.skin_tone && `skin tone ${tone.skin_tone}`,
    tone.eye_color && `eye color ${tone.eye_color}`,
    tone.lip_color && `natural lip color ${tone.lip_color}`,
    tone.brow_color && `brow color ${tone.brow_color}`,
    tone.hair_color && `hair color ${tone.hair_color}`,
  ].filter((p): p is string => !!p);
  if (parts.length === 0) return "";
  return `\nUSER COLORING: ${parts.join(", ")}.
Pick foundation/concealer colors that match the USER's skin tone, and harmonize blush/lip/eye colors with their coloring.\n`;
}

function formatLookProducts(products: LookProductCtx[]): string {
  return products
    .map(
      (product) =>
        `- id: ${product.id} | ${product.subcategory ?? "?"} | ${product.name}${
          product.brand ? ` (${product.brand})` : ""
        }${product.shade ? ` | shade: ${product.shade}` : ""}`,
    )
    .join("\n");
}

export interface FaceAttrsCtx {
  face_shape: string | null;
  eye_shape?: string | null;
  eyelid?: string | null;
  eyebrow_shape?: string | null;
  lip_shape?: string | null;
}

function formatFaceAttrs(attrs: FaceAttrsCtx | null): string {
  if (!attrs) return "";
  const parts = [
    attrs.face_shape && `face shape ${attrs.face_shape}`,
    attrs.eye_shape && `eye shape ${attrs.eye_shape}`,
    attrs.eyelid && `eyelid ${attrs.eyelid}`,
    attrs.eyebrow_shape && `brow shape ${attrs.eyebrow_shape}`,
    attrs.lip_shape && `lip shape ${attrs.lip_shape}`,
  ].filter((p): p is string => !!p);
  if (parts.length === 0) return "";
  return `\nUSER FACE: ${parts.join(", ")}.
When relevant, tailor contour/highlighter to the face shape, brow picks to the brow shape, and consider the eyelid type for eyeshadow/eyeliner (e.g. hooded lids favor matte shadow and lifted liner).\n`;
}

export function lookPrompt(
  userPrompt: string,
  products: LookProductCtx[],
  validSlots: readonly string[],
  faceAttrs: FaceAttrsCtx | null,
  skinTone: SkinToneCtx | null,
): string {
  const facePart = formatFaceAttrs(faceAttrs) + formatSkinTone(skinTone);
  return `You are a makeup artist. Pick a subset of the user's owned makeup products that
fits the look they describe. Assign each picked product to a single slot.

USER PROMPT: ${userPrompt}
${facePart}
OWNED MAKEUP PRODUCTS:
${formatLookProducts(products)}

VALID SLOTS: ${validSlots.join(", ")}

Return a JSON object with:
- products: array of {"product_id": <id>, "slot": <one of VALID SLOTS>, "color": <hex "#RRGGBB" or null>}
- reasoning: 1-3 sentences on why these picks fit the look${
    faceAttrs ? " (mention face features if they influenced a pick)" : ""
  }
- gaps: array of slot names that the user doesn't own a good product for

Rules:
- Only use product_ids from OWNED MAKEUP PRODUCTS.
- Each slot appears at most once across products[].
- Prefer products whose subcategory naturally matches the slot.
- color: infer the actual product color from its name/shade (e.g. shade "Ruby Woo" is a blue-red like "#B01030"). Return null if the name gives no color clue. Never invent a color for colorless products.
- If nothing matches, return an empty products array with gaps explaining what's missing.`;
}

export function stealLookPrompt(
  products: LookProductCtx[],
  validSlots: readonly string[],
  faceAttrs: FaceAttrsCtx | null,
  skinTone: SkinToneCtx | null,
): string {
  return `You are a makeup artist. The attached image shows a makeup look the user wants to recreate. Identify the makeup visible in the image, then match it against the products the user owns.
${formatFaceAttrs(faceAttrs)}${formatSkinTone(skinTone)}
OWNED MAKEUP PRODUCTS:
${formatLookProducts(products)}

VALID SLOTS: ${validSlots.join(", ")}

Return a JSON object with:
- products: array of {"product_id": <id>, "slot": <one of VALID SLOTS>, "color": <hex "#RRGGBB" seen in the image, or null>}
- reasoning: 2-3 sentences describing the look and how the picks recreate it
- gaps: array of slot names visible in the look that the user owns no suitable product for

Rules:
- Only use product_ids from OWNED MAKEUP PRODUCTS.
- Each slot appears at most once across products[].
- Only pick slots actually visible in the reference look.
- color is the shade you see in the reference image for that slot.
- A slot visible in the look with no owned match belongs in gaps, not products.`;
}

export function stealLookPromptStricter(
  products: LookProductCtx[],
  validSlots: readonly string[],
  faceAttrs: FaceAttrsCtx | null,
  skinTone: SkinToneCtx | null,
): string {
  return `Return ONLY a JSON object: {"products":[{"product_id":string,"slot":string,"color":string|null}],"reasoning":string,"gaps":string[]}.
slot MUST be one of: ${validSlots.join(", ")}. product_id MUST come from the list below. color is "#RRGGBB" from the reference image or null.
${formatFaceAttrs(faceAttrs)}${formatSkinTone(skinTone)}
The image is a makeup look to recreate from the user's owned products:
${formatLookProducts(products)}`;
}

export function lookPromptStricter(
  userPrompt: string,
  products: LookProductCtx[],
  validSlots: readonly string[],
  faceAttrs: FaceAttrsCtx | null,
  skinTone: SkinToneCtx | null,
): string {
  const facePart = formatFaceAttrs(faceAttrs) + formatSkinTone(skinTone);
  return `Return ONLY a JSON object: {"products":[{"product_id":string,"slot":string,"color":string|null}],"reasoning":string,"gaps":string[]}.
slot MUST be one of: ${validSlots.join(", ")}. product_id MUST come from the list below. color is "#RRGGBB" inferred from the product shade/name, or null.

USER PROMPT: ${userPrompt}
${facePart}
PRODUCTS:
${formatLookProducts(products)}`;
}
