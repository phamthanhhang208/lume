// Builders for the makeup-vto "effects" payload (version 1.0).
// Field sets per category were verified against the live API (see
// generate-look history) and the YouCam MCP catalog:
//  - colorIntensity is always integer 0-100
//  - pattern / shape / style are OBJECTS ({ name } / { type }), not strings
//  - lip_color wants shape {name:"original"} + style {type:"full"} to keep
//    the natural lip silhouette; eyebrows use pattern {type:"color"} to
//    tint the user's own brow shape; eyelashes take no texture field
//
// Colors: a Gemini-inferred product color wins, then the user's measured
// skin hex (foundation/concealer only), then a neutral per-slot default.
//
// The legacy `ai-makeup` + effect_list dialect is kept as a fallback in the
// call sites: if the makeup-vto task is rejected, callers retry with legacy.

export interface MakeupPick {
  slot: string;
  /** #RRGGBB, or null when no color could be inferred. */
  color: string | null;
}

/** Face attributes that influence pattern selection. */
export interface MakeupFaceAttrs {
  faceShape: string | null;
}

/** Pulls the measured skin hex out of profiles.skin_tone_data, if present. */
export function skinHexFrom(skinToneData: unknown): string | null {
  if (!skinToneData || typeof skinToneData !== "object") return null;
  const st = skinToneData as Record<string, unknown>;
  if (typeof st.hex_color === "string" && st.hex_color.startsWith("#")) {
    return st.hex_color;
  }
  return null;
}

// Neutral defaults so an effect can still render when Gemini returns no
// color for a pick.
const DEFAULT_SLOT_COLORS: Record<string, string> = {
  foundation: "#E8C5A0",
  concealer: "#E8C5A0",
  blush: "#E8919A",
  bronzer: "#C68642",
  contour: "#B07850",
  highlighter: "#FFE5B4",
  lipstick: "#C44B4B",
  "lip liner": "#A83030",
  eyeshadow: "#8B7355",
  eyeliner: "#2C2C2C",
  eyelash: "#1A1A1A",
  eyebrow: "#5C4033",
};

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

/**
 * Builds the effects array for a makeup-vto task from slot/color picks.
 * Always includes a light skin-smooth base. Unknown slots are skipped.
 */
export function buildMakeupEffects(
  picks: MakeupPick[],
  faceAttrs: MakeupFaceAttrs | null,
  skinHex: string | null = null,
): Array<Record<string, unknown>> {
  const faceShape = faceAttrs?.faceShape ?? null;
  const effects: Array<Record<string, unknown>> = [
    { category: "skin_smooth", skinSmoothStrength: 40, skinSmoothColorIntensity: 30 },
  ];
  for (const pick of picks) {
    const color = pick.color ?? DEFAULT_SLOT_COLORS[pick.slot];
    if (!color) continue;
    switch (pick.slot) {
      case "foundation":
        effects.push({
          category: "foundation",
          palettes: [{
            color: pick.color ?? skinHex ?? DEFAULT_SLOT_COLORS.foundation,
            colorIntensity: 45,
            coverageIntensity: 50,
            glowIntensity: 20,
          }],
        });
        break;
      case "concealer":
        effects.push({
          category: "concealer",
          palettes: [{
            color: pick.color ?? skinHex ?? DEFAULT_SLOT_COLORS.concealer,
            colorIntensity: 45,
            colorUnderEyeIntensity: 40,
            coverageLevel: 50,
          }],
        });
        break;
      case "blush":
        effects.push({
          category: "blush",
          pattern: { name: "1color1" },
          palettes: [{ color, colorIntensity: 50, texture: "matte" }],
        });
        break;
      case "bronzer":
        effects.push({
          category: "bronzer",
          pattern: { name: "Bronzer1" },
          palettes: [{ color, colorIntensity: 40 }],
        });
        break;
      case "contour":
        effects.push({
          category: "contour",
          pattern: { name: contourPattern(faceShape) },
          palettes: [{ color, colorIntensity: 40 }],
        });
        break;
      case "highlighter":
        effects.push({
          category: "highlighter",
          pattern: { name: highlighterPattern(faceShape) },
          palettes: [{
            color,
            colorIntensity: 50,
            glowIntensity: 40,
            shimmerIntensity: 50,
            shimmerDensity: 40,
            shimmerSize: 30,
          }],
        });
        break;
      case "lipstick":
        effects.push({
          category: "lip_color",
          shape: { name: "original" },
          style: { type: "full" },
          palettes: [{ color, colorIntensity: 80, texture: "matte" }],
        });
        break;
      case "lip liner":
        effects.push({
          category: "lip_liner",
          pattern: { name: "Natural1" },
          palettes: [{
            color,
            colorIntensity: 70,
            texture: "matte",
            thickness: 30,
            smoothness: 60,
          }],
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
        effects.push({
          category: "eye_liner",
          pattern: { name: "Arabic3" },
          palettes: [{ color, colorIntensity: 80, texture: "matte" }],
        });
        break;
      case "eyelash":
        effects.push({
          category: "eyelashes",
          pattern: { name: "Upper1" },
          palettes: [{ color, colorIntensity: 90 }],
        });
        break;
      case "eyebrow":
        effects.push({
          category: "eyebrows",
          pattern: { type: "color" },
          palettes: [{ color, colorIntensity: 60, texture: "matte" }],
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
