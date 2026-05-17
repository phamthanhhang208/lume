import { redirect, type LoaderFunctionArgs } from "react-router";

import { supabase } from "@/lib/supabase";

export async function protectedLoader({ request }: LoaderFunctionArgs) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const url = new URL(request.url);
    const from = url.pathname + url.search;
    throw redirect(`/sign-in?from=${encodeURIComponent(from)}`);
  }

  return null;
}
