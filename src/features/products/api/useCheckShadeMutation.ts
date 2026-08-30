import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type ShadeVerdict =
  | "match"
  | "too_warm"
  | "too_cool"
  | "too_light"
  | "too_deep"
  | "unknown";

export interface CheckShadeInput {
  name: string;
  brand: string | null;
  shade: string;
}

export interface CheckShadeResult {
  verdict: ShadeVerdict;
  note: string | null;
}

interface CheckShadeResponse {
  data?: { verdict: ShadeVerdict; note: string | null };
  error?: { code: string; message: string };
}

export function useCheckShadeMutation() {
  return useMutation({
    mutationFn: async (input: CheckShadeInput): Promise<CheckShadeResult> => {
      try {
        const { data, error } = await supabase.functions.invoke<CheckShadeResponse>(
          "check-shade",
          { body: input },
        );
        if (error) throw error;
        if (data?.error) throw new Error(`${data.error.code}: ${data.error.message}`);
        return data?.data ?? { verdict: "unknown", note: null };
      } catch (err) {
        console.warn("shade check failed (soft-fail):", err);
        return { verdict: "unknown", note: null };
      }
    },
  });
}
