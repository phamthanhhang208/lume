import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

import LumeMark from "@/components/ui/LumeMark";
import { useDemoSignInMutation } from "@/features/auth/api/useDemoSignInMutation";
import { useSignInMutation } from "@/features/auth/api/useSignInMutation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const signIn = useSignInMutation();
  const demoSignIn = useDemoSignInMutation();
  const navigate = useNavigate();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signIn.mutate(email, {
      onSuccess: () => setSubmitted(true),
    });
  };

  const onDemoLogin = () => {
    demoSignIn.mutate(undefined, {
      onSuccess: () => navigate("/dashboard", { replace: true }),
    });
  };

  const busy = signIn.isPending || demoSignIn.isPending;

  if (submitted) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-cream px-6">
        <LumeMark size={36} className="mb-8" />
        <div className="w-full max-w-xs rounded-2xl bg-white px-7 py-8 text-center shadow-sm ring-1 ring-black/[0.06]">
          <p className="font-sans text-sm leading-relaxed text-ink-soft">
            magic link sent to{" "}
            <span className="font-semibold text-ink">{email}</span>.
            <br />
            check your inbox to finish signing in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-cream px-6">
      <div className="mb-8 text-center">
        <LumeMark size={42} />
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          your skin · your products · your look
        </p>
      </div>

      <div className="w-full max-w-xs rounded-2xl bg-white px-7 py-8 shadow-sm ring-1 ring-black/[0.06]">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-soft"
            >
              email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
              className="w-full rounded-xl border border-black/[0.12] bg-cream-deep px-4 py-3 font-sans text-sm text-ink placeholder:text-ink-faint focus:border-terracotta-deep focus:outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !email}
            className="w-full rounded-full bg-terracotta-deep py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_4px_14px_rgba(227,123,140,0.4)] transition-opacity disabled:opacity-40"
          >
            {signIn.isPending ? "sending…" : "send magic link"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-black/[0.10]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">
            or
          </span>
          <span className="h-px flex-1 bg-black/[0.10]" />
        </div>

        <button
          type="button"
          onClick={onDemoLogin}
          disabled={busy}
          className="w-full rounded-full border border-black/25 bg-transparent py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink transition-opacity disabled:opacity-40"
        >
          {demoSignIn.isPending ? "signing in…" : "login as demo user"}
        </button>
        <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint">
          for judges · pre-seeded account
        </p>

        {signIn.error && (
          <p role="alert" className="mt-4 font-sans text-xs text-rose-deep">
            {signIn.error.message}
          </p>
        )}
        {demoSignIn.error && (
          <p role="alert" className="mt-4 font-sans text-xs text-rose-deep">
            {demoSignIn.error.message}
          </p>
        )}
      </div>
    </main>
  );
}
