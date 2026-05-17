import { useEffect } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "@/features/auth/api/useAuth";

export default function AuthCallback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  return <main>signing you in...</main>;
}
