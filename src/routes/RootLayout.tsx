import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { sessionKeys } from "@/features/auth/api/sessionKeys";

export default function RootLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      queryClient.setQueryData(sessionKeys.current, session);
      if (event === "SIGNED_OUT") {
        navigate("/sign-in", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient, navigate]);

  return <Outlet />;
}
