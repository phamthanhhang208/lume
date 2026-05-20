import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { profileKeys } from "@/features/profile/api/profileKeys";
import type { Profile } from "@/types/database";

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
