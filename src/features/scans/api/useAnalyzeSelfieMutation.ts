import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { profileKeys } from "@/features/profile/api/profileKeys";
import { uploadSelfie } from "@/features/scans/api/selfieStorage";
import { scanKeys } from "@/features/scans/api/scanKeys";
import type { Scan, SkinMetrics } from "@/types/database";

export type AnalyzeSelfieInput =
  | {
      source: "new";
      userId: string;
      blob: Blob;
      needsToneAnalysis: boolean;
      needsFaceAnalysis: boolean;
    }
  | {
      source: "saved";
      userId: string;
      storagePath: string;
      needsToneAnalysis: boolean;
      needsFaceAnalysis: boolean;
    };

interface AnalyzeSkinResponse {
  data?: {
    metrics: SkinMetrics;
    skin_age: number;
    overall_score: number;
    raw_response: unknown;
  };
  error?: { code: string; message: string };
}

interface AnalyzeSkinToneResponse {
  data?: {
    tone: unknown;
    raw_response: unknown;
  };
  error?: { code: string; message: string };
}

interface AnalyzeFaceResponse {
  data?: {
    face: unknown;
    raw_response: unknown;
  };
  error?: { code: string; message: string };
}

async function ensureSelfiePath(input: AnalyzeSelfieInput): Promise<string> {
  if (input.source === "saved") return input.storagePath;
  const uploaded = await uploadSelfie({ userId: input.userId, blob: input.blob });
  const { error } = await supabase
    .from("profiles")
    .update({ saved_selfie_url: uploaded.storagePath })
    .eq("id", input.userId);
  if (error) throw error;
  return uploaded.storagePath;
}

export function useAnalyzeSelfieMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AnalyzeSelfieInput): Promise<Scan> => {
      const storagePath = await ensureSelfiePath(input);

      const skin = await supabase.functions.invoke<AnalyzeSkinResponse>("analyze-skin", {
        body: { storage_path: storagePath },
      });
      if (skin.error) throw skin.error;
      if (skin.data?.error) {
        throw new Error(`${skin.data.error.code}: ${skin.data.error.message}`);
      }
      const result = skin.data?.data;
      if (!result) throw new Error("no analysis result");

      const { data: scanRow, error: insertError } = await supabase
        .from("scans")
        .insert({
          user_id: input.userId,
          image_url: storagePath,
          metrics: result.metrics,
          skin_age: result.skin_age,
          overall_score: result.overall_score,
          raw_response: result.raw_response,
        })
        .select("*")
        .single();
      if (insertError) throw insertError;

      if (input.needsToneAnalysis) {
        try {
          const tone = await supabase.functions.invoke<AnalyzeSkinToneResponse>(
            "analyze-skin-tone",
            { body: { storage_path: storagePath } },
          );
          if (tone.error) throw tone.error;
          if (tone.data?.error) {
            throw new Error(`${tone.data.error.code}: ${tone.data.error.message}`);
          }
          if (tone.data?.data) {
            const { error: profileError } = await supabase
              .from("profiles")
              .update({ skin_tone_data: tone.data.data.tone })
              .eq("id", input.userId);
            if (profileError) throw profileError;
          }
        } catch (err) {
          console.warn("skin-tone analysis failed (non-blocking):", err);
        }
      }

      if (input.needsFaceAnalysis) {
        try {
          const face = await supabase.functions.invoke<AnalyzeFaceResponse>(
            "analyze-face",
            { body: { storage_path: storagePath } },
          );
          if (face.error) throw face.error;
          if (face.data?.error) {
            throw new Error(`${face.data.error.code}: ${face.data.error.message}`);
          }
          if (face.data?.data) {
            const { error: profileError } = await supabase
              .from("profiles")
              .update({ face_data: face.data.data.face })
              .eq("id", input.userId);
            if (profileError) throw profileError;
          }
        } catch (err) {
          console.warn("face analysis failed (non-blocking):", err);
        }
      }

      return scanRow as Scan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scanKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
