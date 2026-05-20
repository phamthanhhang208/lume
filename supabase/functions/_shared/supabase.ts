import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

import { errorResponse } from "./cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

export interface AuthedContext {
  userId: string;
  supabase: SupabaseClient;
}

/**
 * Verifies the request's JWT and returns a user-scoped Supabase client.
 * Returns a Response (which the handler should return directly) on failure.
 */
export async function requireUser(req: Request): Promise<AuthedContext | Response> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return errorResponse("config_error", "supabase env missing", 500);
  }
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("unauthorized", "missing auth header", 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return errorResponse("unauthorized", "invalid jwt", 401);

  return { userId: data.user.id, supabase };
}
