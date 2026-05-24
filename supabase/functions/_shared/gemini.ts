// Gemini 2.5 Flash client with structured-output validation.
// Per docs/api-integration.md "Structured output": validate with Zod and
// retry once with a stricter prompt on validation failure.

import type { ZodType } from "npm:zod@4";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-2.5-flash";

// REST API field names are snake_case; type literals are UPPERCASE
// (see https://ai.google.dev/api/generate-content).
export interface GeminiSchema {
  type: "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN" | "ARRAY" | "OBJECT";
  items?: GeminiSchema;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  enum?: string[];
  nullable?: boolean;
}

interface InlineImage {
  mimeType: string;
  bytes: Uint8Array;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export interface CallGeminiJsonOptions<T> {
  prompt: string;
  /** Stricter prompt to retry with on validation failure. If omitted, no retry. */
  retryPrompt?: string;
  image?: InlineImage;
  geminiSchema: GeminiSchema;
  validator: ZodType<T>;
}

/**
 * Calls Gemini with structured-JSON output. Validates with the provided Zod
 * schema. If validation fails and retryPrompt is supplied, retries once with
 * the stricter prompt. Throws if both attempts fail validation, or on network
 * / API errors.
 */
export async function callGeminiJson<T>(opts: CallGeminiJsonOptions<T>): Promise<T> {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not set");

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const buildBody = (prompt: string): Record<string, unknown> => {
    const parts: Array<Record<string, unknown>> = [];
    if (opts.image) {
      parts.push({
        inline_data: {
          mime_type: opts.image.mimeType,
          data: bytesToBase64(opts.image.bytes),
        },
      });
    }
    parts.push({ text: prompt });
    return {
      contents: [{ parts }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: opts.geminiSchema,
      },
    };
  };

  const sendAndParse = async (prompt: string): Promise<unknown> => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY,
      },
      body: JSON.stringify(buildBody(prompt)),
    });
    if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error(`no text in gemini response: ${JSON.stringify(data)}`);
    try {
      return JSON.parse(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`gemini returned non-JSON text: ${message}; text was: ${text}`);
    }
  };

  // First attempt
  const firstRaw = await sendAndParse(opts.prompt);
  const firstParse = opts.validator.safeParse(firstRaw);
  if (firstParse.success) return firstParse.data;

  console.warn(
    "gemini first attempt failed validation:",
    firstParse.error.message,
    "raw:",
    JSON.stringify(firstRaw),
  );

  if (!opts.retryPrompt) {
    throw new Error(`gemini response failed validation: ${firstParse.error.message}`);
  }

  // Retry with stricter prompt
  const retryRaw = await sendAndParse(opts.retryPrompt);
  const retryParse = opts.validator.safeParse(retryRaw);
  if (retryParse.success) return retryParse.data;

  console.warn(
    "gemini retry attempt also failed validation:",
    retryParse.error.message,
    "raw:",
    JSON.stringify(retryRaw),
  );
  throw new Error(`gemini retry failed validation: ${retryParse.error.message}`);
}

// ---------- Grounded (Google Search) ----------
// Google Search grounding cannot be combined with response_schema, so the
// model returns free-form text containing a JSON object. We extract and
// validate it client-side, and surface the first grounding source URL as a
// best-effort fallback when the model itself does not echo one.

export interface CallGeminiGroundedOptions<T> {
  prompt: string;
  retryPrompt?: string;
  validator: ZodType<T>;
}

interface GroundingChunk {
  web?: { uri?: string };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

interface GroundedResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: GroundingMetadata;
  }>;
}

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // fall through to brace scan
    }
  }
  const start = text.indexOf("{");
  if (start < 0) throw new Error("no JSON object in grounded response");
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(text.slice(start, i + 1));
      }
    }
  }
  throw new Error("unbalanced braces in grounded response");
}

export async function callGeminiGrounded<T>(
  opts: CallGeminiGroundedOptions<T>,
): Promise<{ value: T; fallbackSource: string | null }> {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not set");
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const buildBody = (prompt: string): Record<string, unknown> => ({
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
  });

  const send = async (
    prompt: string,
  ): Promise<{ value: T; fallbackSource: string | null }> => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY,
      },
      body: JSON.stringify(buildBody(prompt)),
    });
    if (!res.ok) throw new Error(`gemini grounded ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as GroundedResponse;
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error(`no text in grounded response: ${JSON.stringify(data)}`);
    }
    const raw = extractJsonObject(text);
    const parsed = opts.validator.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `grounded response failed validation: ${parsed.error.message}; raw: ${JSON.stringify(raw)}`,
      );
    }
    const fallbackSource =
      candidate?.groundingMetadata?.groundingChunks?.[0]?.web?.uri ?? null;
    return { value: parsed.data, fallbackSource };
  };

  try {
    return await send(opts.prompt);
  } catch (err) {
    if (!opts.retryPrompt) throw err;
    console.warn("grounded first attempt failed, retrying stricter:", err);
    return await send(opts.retryPrompt);
  }
}
