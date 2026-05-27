import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

// Demo creds are intentionally public. They're set in .env so Jen can rotate
// the password without a redeploy; if unset, sane defaults work against the
// account documented in docs/phases.md as the judges' demo account.
const DEMO_EMAIL =
  (import.meta.env.VITE_DEMO_EMAIL as string | undefined) ??
  "demo@lume.app";
const DEMO_PASSWORD =
  (import.meta.env.VITE_DEMO_PASSWORD as string | undefined) ??
  "lume2026";

export function useDemoSignInMutation() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (error) throw error;
    },
  });
}
