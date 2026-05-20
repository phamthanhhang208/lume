import { useState, type FormEvent } from "react";

import { useSignInMutation } from "@/features/auth/api/useSignInMutation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const signIn = useSignInMutation();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signIn.mutate(email, {
      onSuccess: () => setSubmitted(true),
    });
  };

  if (submitted) {
    return (
      <main>
        <p>magic link sent to {email}. check your inbox to finish signing in.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>sign in</h1>
      <form onSubmit={onSubmit}>
        <label>
          email{" "}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={signIn.isPending}
          />
        </label>
        <button type="submit" disabled={signIn.isPending || !email}>
          {signIn.isPending ? "sending..." : "send magic link"}
        </button>
      </form>
      {signIn.error && <p role="alert">error: {signIn.error.message}</p>}
    </main>
  );
}
