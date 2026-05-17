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
