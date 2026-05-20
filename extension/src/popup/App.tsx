import { useEffect, useState, type FormEvent } from "react";

import { clearToken, readToken, writeToken } from "@/shared/auth";

export default function App() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"empty" | "saved" | null>(null);

  useEffect(() => {
    void (async () => {
      const existing = await readToken();
      setStatus(existing ? "saved" : "empty");
    })();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token.trim()) return;
    await writeToken(token);
    setToken("");
    setStatus("saved");
  };

  const onClear = async () => {
    await clearToken();
    setStatus("empty");
  };

  return (
    <main>
      <h1>Lume</h1>
      {status === "saved" && (
        <p className="ok">You're signed in. Right-click an image to try it on.</p>
      )}
      {status === "empty" && (
        <p className="muted">
          Paste your Lume access token to sign in. (MVP shortcut — get it from
          the Lume web app in dev tools → Application → Local Storage →
          <code> sb-…-auth-token</code> → <code>access_token</code>.)
        </p>
      )}
      <form onSubmit={onSubmit}>
        <textarea
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="eyJhbGciOi…"
        />
        <button type="submit" disabled={!token.trim()}>
          save token
        </button>{" "}
        {status === "saved" && (
          <button type="button" className="secondary" onClick={onClear}>
            sign out
          </button>
        )}
      </form>
    </main>
  );
}
