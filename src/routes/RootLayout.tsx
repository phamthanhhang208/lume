import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

import TopNav from "@/components/ui/TopNav";

import { supabase } from "@/lib/supabase";
import { sessionKeys } from "@/features/auth/api/sessionKeys";

export default function RootLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      queryClient.setQueryData(sessionKeys.current, session);
      if (event === "SIGNED_OUT") {
        pendo.clearSession();
        navigate("/sign-in", { replace: true });
      } else if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session?.user
      ) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        pendo.identify({
          visitor: {
            id: session.user.id,
            email: session.user.email ?? "",
            full_name: profile?.display_name ?? "",
            display_name: profile?.display_name ?? "",
            created_at: profile?.created_at ?? "",
            updated_at: profile?.updated_at ?? "",
          },
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient, navigate]);

  return (
    <div className="min-h-svh bg-cream">
      <TopNav />
      <div className="relative mx-auto max-w-sm lg:max-w-none">
        <Outlet />
      </div>
    </div>
  );
}
