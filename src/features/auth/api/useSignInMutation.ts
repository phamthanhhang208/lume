import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export function useSignInMutation() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`,
        },
      });
      if (error) throw error;
    },
  });
}
