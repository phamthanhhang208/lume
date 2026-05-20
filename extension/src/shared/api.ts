import { readToken } from "@/shared/auth";
import type { TryFromWebInput, TryFromWebResult } from "@/shared/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

interface EdgeResponse<T> {
  data?: T;
  error?: { code: string; message: string };
}

export class AuthRequiredError extends Error {
  constructor() {
    super("session expired — paste a fresh access token");
    this.name = "AuthRequiredError";
  }
}

export async function tryFromWeb(
  input: TryFromWebInput,
): Promise<TryFromWebResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  }
  const token = await readToken();
  if (!token) throw new AuthRequiredError();

  const res = await fetch(`${SUPABASE_URL}/functions/v1/try-from-web`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (res.status === 401) throw new AuthRequiredError();
  const body = (await res.json()) as EdgeResponse<TryFromWebResult>;
  if (body.error) throw new Error(`${body.error.code}: ${body.error.message}`);
  if (!body.data) throw new Error("no data in response");
  return body.data;
}
