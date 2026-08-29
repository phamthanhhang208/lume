// Builders for the makeup-vto "effects" payload (version 1.0), verified
// against the YouCam MCP catalog. Each Lume makeup slot maps to one effect
// category; pattern names come from the per-category pattern catalogs
// (blush.json, contour.json, ...) also served by the catalog.
//
// The legacy `ai-makeup` + effect_list dialect is kept as a fallback in the
// call sites: if the makeup-vto task is rejected, callers retry with legacy.

export interface MakeupPick {
  slot: string;
  /** #RRGGBB, or null when no color could be inferred. */
  color: string | null;
}

// Neutral defaults so an effect can still render when Gemini returns no
// color for a pick. Chosen to read as "generic product" rather than a bold
// statement color.
const DEFAULT_SLOT_COLORS: Record<string, string> = {
  foundation: "#E6C4A8",
  concealer: "#E8CBB0",
  blush: "#E19F9F",
  bronzer: "#B5835A",
  contour: "#A67B5B",
  highlighter: "#F5E6D3",
  lipstick: "#B04A5A",
  "lip liner": "#A05A5A",
  eyeshadow: "#B08D6E",
  eyeliner: "#2B1B12",
  eyelash: "#1A1A1A",
  eyebrow: "#4A3728",
};

/** Face attributes that influence pattern selection. */
export interface MakeupFaceAttrs {
  faceShape: string | null;
  eyebrowShape: string | null;
}

// Contour/highlighter patterns are named after face shapes in the catalog.
// Fall back to the oval variants, which suit most faces.
function contourPattern(faceShape: string | null): string {
  switch (faceShape) {
    case "heart": return "HeartFace2";
    case "round": return "RoundFace4";
    case "square": return "RoundFace4";
    case "triangle": return "TriangleFace2";
    default: return "OvalFace6";
  }
}

function highlighterPattern(faceShape: string | null): string {
  switch (faceShape) {
    case "heart": return "HeartFace4";
    case "oblong": return "Oblong11";
    default: return "OvalFace2";
  }
}

// Brow catalog labels are style-named (Arrow1, SoftArch1, ...). Match the
// detected brow shape loosely; SoftArch flatters most faces as the default.
function eyebrowPattern(browShape: string | null): string {
  const shape = (browShape ?? "").toLowerCase();
  if (shape.includes("arch")) return "SoftArch1";
  if (shape.includes("arrow") || shape.includes("angled")) return "Arrow1";
  return "SoftArch1";
}

/**
 * Builds the effects array for a makeup-vto task from slot/color picks.
 * Unknown slots are skipped.
 */
export function buildMakeupEffects(
  picks: MakeupPick[],
  faceAttrs: MakeupFaceAttrs | null,
): Array<Record<string, unknown>> {
  const faceShape = faceAttrs?.faceShape ?? null;
  const effects: Array<Record<string, unknown>> = [];
  for (const pick of picks) {
    const color = pick.color ?? DEFAULT_SLOT_COLORS[pick.slot];
    if (!color) continue;
    switch (pick.slot) {
      case "foundation":
        effects.push({
          category: "foundation",
          palettes: [{ color, colorIntensity: 60 }],
        });
        break;
      case "concealer":
        effects.push({
          category: "concealer",
          palettes: [{ color, colorIntensity: 60 }],
        });
        break;
      case "blush":
        effects.push({
          category: "blush",
          pattern: { name: "1color1" },
          palettes: [{ color, colorIntensity: 60, texture: "matte" }],
        });
        break;
      case "bronzer":
        effects.push({
          category: "bronzer",
          pattern: { name: "Bronzer1" },
          palettes: [{ color, colorIntensity: 50 }],
        });
        break;
      case "contour":
        effects.push({
          category: "contour",
          pattern: { name: contourPattern(faceShape) },
          palettes: [{ color, colorIntensity: 50 }],
        });
        break;
      case "highlighter":
        effects.push({
          category: "highlighter",
          pattern: { name: highlighterPattern(faceShape) },
          palettes: [{ color, colorIntensity: 60, glowIntensity: 60 }],
        });
        break;
      case "lipstick":
        effects.push({
          category: "lip_color",
          palettes: [{ color, colorIntensity: 80, texture: "matte" }],
        });
        break;
      case "lip liner":
        effects.push({
          category: "lip_liner",
          pattern: { name: "Natural1" },
          palettes: [{ color, colorIntensity: 70 }],
        });
        break;
      case "eyeshadow":
        effects.push({
          category: "eye_shadow",
          pattern: { name: "1color1" },
          palettes: [{ color, colorIntensity: 60, texture: "matte" }],
        });
        break;
      case "eyeliner":
        // The eyeliner catalog starts at 2-color patterns; send the same
        // color twice so a single product still renders.
        effects.push({
          category: "eye_liner",
          pattern: { name: "2colors1" },
          palettes: [
            { color, colorIntensity: 70 },
            { color, colorIntensity: 70 },
          ],
        });
        break;
      case "eyelash":
        effects.push({
          category: "eyelashes",
          pattern: { name: "Upper1" },
          palettes: [{ color, colorIntensity: 70 }],
        });
        break;
      case "eyebrow":
        effects.push({
          category: "eyebrows",
          pattern: {
            type: "shape",
            name: eyebrowPattern(faceAttrs?.eyebrowShape ?? null),
          },
          palettes: [{ color, colorIntensity: 60 }],
        });
        break;
    }
  }
  return effects;
}

// Legacy ai-makeup dialect, kept as the fallback path.
export const SLOT_TO_LEGACY_EFFECT: Record<string, string> = {
  foundation: "FoundationEffect",
  concealer: "ConcealerEffect",
  blush: "BlushEffect",
  bronzer: "BronzerEffect",
  contour: "ContourEffect",
  highlighter: "HighlighterEffect",
  lipstick: "LipColorEffect",
  "lip liner": "LipLinerEffect",
  eyeshadow: "EyeshadowEffect",
  eyeliner: "EyelinerEffect",
  eyelash: "EyelashesEffect",
  eyebrow: "EyebrowsEffect",
};

export const VALID_MAKEUP_SLOTS = Object.keys(SLOT_TO_LEGACY_EFFECT);
