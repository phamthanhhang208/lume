// MVP auth: the user pastes their Lume web-app access token into the popup,
// we keep it in chrome.storage.local, and every Edge Function call sends it as
// a Bearer token. When it expires (401) the popup re-prompts.
//
// The "sign-in-via-web-app-redirect" approach in docs/chrome-extension.md is
// a follow-up; it needs the web app deployed at a known public URL.

const TOKEN_KEY = "lume.access_token";

export async function readToken(): Promise<string | null> {
  const stored = await chrome.storage.local.get(TOKEN_KEY);
  const token = stored[TOKEN_KEY];
  return typeof token === "string" && token.length > 0 ? token : null;
}

export async function writeToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token.trim() });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}
