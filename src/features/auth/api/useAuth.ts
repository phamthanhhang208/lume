import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { sessionKeys } from "@/features/auth/api/sessionKeys";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const { data, isPending } = useQuery({
    queryKey: sessionKeys.current,
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: Infinity,
  });

  return {
    session: data ?? null,
    user: data?.user ?? null,
    loading: isPending,
  };
}
