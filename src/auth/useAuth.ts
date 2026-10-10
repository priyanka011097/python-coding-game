/* =====================================================================
   useAuth.ts — who is signed in, read from the server's /api/me.

   The session lives in an HttpOnly cookie the page cannot read, so the
   server is the only source of truth. A discriminated union makes
   "loaded but signed out" and "still checking" impossible to confuse.
   ===================================================================== */

import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  /** Email is in ADMIN_EMAILS. Only shows the button; the server re-checks. */
  isAdmin?: boolean;
}

export type AuthState =
  | { status: "loading" }
  /** Google sign-in is not set up in .env, so the app runs open. */
  | { status: "disabled"; callbackUrl: string }
  | { status: "signed-out"; callbackUrl: string }
  | { status: "signed-in"; user: AuthUser };

export interface UseAuth {
  auth: AuthState;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuth {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const body = (await res.json()) as { configured: boolean; callbackUrl: string; user: AuthUser | null };
      if (!body.configured) setAuth({ status: "disabled", callbackUrl: body.callbackUrl });
      else if (body.user) setAuth({ status: "signed-in", user: body.user });
      else setAuth({ status: "signed-out", callbackUrl: body.callbackUrl });
    } catch {
      // No auth server (e.g. a static build): behave as if sign-in is off.
      setAuth({ status: "disabled", callbackUrl: "" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch("/auth/logout", { method: "POST" });
    } finally {
      await refresh();
    }
  }, [refresh]);

  return { auth, logout };
}

const AUTH_ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled.",
  not_configured: "Google sign-in is not set up on this server yet.",
  state_mismatch: "That sign-in link expired or was opened in another tab. Please try again.",
  redirect_uri_mismatch:
    "Google rejected the redirect address. Add the callback URL below to your OAuth client in Google Cloud Console.",
  invalid_client:
    "Google rejected the client secret. Copy the secret for this OAuth client from Google Cloud Console into CLIENT_SECRET (or GOOGLE_CLIENT_SECRET) in study/.env, save, and try again.",
  invalid_grant: "That sign-in code was already used or expired. Please try again.",
  email_not_verified: "Your Google account's email is not verified.",
  private_ip:
    "Google sign-in does not work on a Wi-Fi address like this one. On this computer, open http://localhost:5173 instead. Signing in from a phone needs a public https:// address.",
  google_unreachable: "Could not reach Google. Check your internet connection and try again.",
  db_unavailable: "Signed in with Google, but the database could not be reached. Check MONGODB_URI and Atlas Network Access, then try again.",
};

/** Reads and removes ?auth_error= / ?welcome= from the address bar. */
export function takeAuthNotice(): { error: string | null; welcome: boolean } {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("auth_error");
  const welcome = url.searchParams.get("welcome") === "new";
  if (code || welcome) {
    url.searchParams.delete("auth_error");
    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  return {
    error: code ? (AUTH_ERRORS[code] ?? `Sign-in failed (${code}). Please try again.`) : null,
    welcome,
  };
}
