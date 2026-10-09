/* =====================================================================
   googleAuth.ts — "Continue with Google" sign-up / login / logout.

   Standard OAuth 2.0 authorization-code flow, run entirely on the local
   Vite server so the client secret never reaches the browser:

     GET  /auth/google            -> redirect to Google's consent screen
     GET  /auth/google/callback   -> exchange the code, create the session
     POST /auth/logout            -> clear the session
     GET  /api/me                 -> who is signed in (or null)

   Register this redirect URI on the OAuth client in Google Cloud Console:
     http://localhost:5173/auth/google/callback
   (or APP_URL + /auth/google/callback if APP_URL is set).
   ===================================================================== */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";
import type { Sessions } from "./session";
import { SESSION_COOKIE, STATE_COOKIE, clearCookie, parseCookies, randomToken, setCookie } from "./session";
import type { UserStore } from "./users";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

export interface GoogleAuthOptions {
  clientId: string | undefined;
  clientSecret: string | undefined;
  /** Public base URL, e.g. http://localhost:5173. Defaults to the request's host. */
  appUrl: string | undefined;
  sessions: Sessions;
  users: UserStore;
}

interface IdTokenClaims {
  iss?: string;
  aud?: string;
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function redirect(res: ServerResponse, location: string): void {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.setHeader("Cache-Control", "no-store");
  res.end();
}

function baseUrl(req: IncomingMessage, appUrl: string | undefined): string {
  if (appUrl) return appUrl.replace(/\/+$/, "");
  return `http://${req.headers.host ?? "localhost:5173"}`;
}

/** The ID token comes straight from Google's token endpoint over TLS in
 *  exchange for our client secret, so (per Google's docs) its signature
 *  need not be re-verified — but its claims still are. */
function decodeClaims(idToken: string): IdTokenClaims {
  const payload = idToken.split(".")[1];
  if (!payload) throw new Error("Malformed ID token");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as IdTokenClaims;
}

function middleware(opts: GoogleAuthOptions): Connect.NextHandleFunction {
  const configured = Boolean(opts.clientId && opts.clientSecret);

  return (req, res, next) => {
    const url = new URL(req.url ?? "/", "http://local");
    const path = url.pathname;
    const base = baseUrl(req, opts.appUrl);
    const secure = base.startsWith("https://");
    const callbackUrl = `${base}/auth/google/callback`;
    const fail = (code: string): void => redirect(res, `/?auth_error=${encodeURIComponent(code)}`);

    if (path === "/api/me" && req.method === "GET") {
      json(res, 200, { configured, callbackUrl, user: opts.sessions.read(req) });
      return;
    }

    if (path === "/auth/google" && req.method === "GET") {
      if (!configured) return fail("not_configured");
      const state = randomToken();
      setCookie(res, STATE_COOKIE, state, { maxAgeSeconds: 600, secure });
      const params = new URLSearchParams({
        client_id: opts.clientId!,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account",
      });
      redirect(res, `${AUTH_URL}?${params}`);
      return;
    }

    if (path === "/auth/google/callback" && req.method === "GET") {
      if (!configured) return fail("not_configured");
      const googleError = url.searchParams.get("error");
      if (googleError) return fail(googleError === "access_denied" ? "cancelled" : googleError);

      // The state must match the one we set, or this is a forged callback.
      const state = url.searchParams.get("state");
      const expected = parseCookies(req)[STATE_COOKIE];
      clearCookie(res, STATE_COOKIE, secure);
      if (!state || !expected || state !== expected) return fail("state_mismatch");

      const code = url.searchParams.get("code");
      if (!code) return fail("no_code");

      void (async () => {
        try {
          const tokenRes = await fetch(TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: opts.clientId!,
              client_secret: opts.clientSecret!,
              redirect_uri: callbackUrl,
              grant_type: "authorization_code",
            }),
            signal: AbortSignal.timeout(20_000),
          });
          const token = (await tokenRes.json()) as { id_token?: string; error?: string };
          if (!tokenRes.ok || !token.id_token) return fail(token.error ?? "token_exchange_failed");

          const c = decodeClaims(token.id_token);
          if (!c.iss || !ISSUERS.has(c.iss)) return fail("bad_issuer");
          if (c.aud !== opts.clientId) return fail("bad_audience");
          if (!c.exp || c.exp < Date.now() / 1000) return fail("expired");
          if (!c.sub || !c.email) return fail("no_email");
          if (c.email_verified === false) return fail("email_not_verified");

          const { user, isNew } = await opts.users.upsert({
            id: c.sub,
            email: c.email,
            name: c.name || c.email.split("@")[0]!,
            picture: c.picture ?? "",
          });
          const session = opts.sessions.create({
            id: user.id, email: user.email, name: user.name, picture: user.picture,
          });
          setCookie(res, SESSION_COOKIE, session.value, { maxAgeSeconds: session.maxAgeSeconds, secure });
          redirect(res, isNew ? "/?welcome=new" : "/");
        } catch (err) {
          // A failed database write surfaces as its own error, not as Google's.
          fail(err instanceof Error && /mongo/i.test(err.name) ? "db_unavailable" : "google_unreachable");
        }
      })();
      return;
    }

    if (path === "/auth/logout") {
      if (req.method !== "POST") {
        json(res, 405, { error: "Use POST" });
        return;
      }
      clearCookie(res, SESSION_COOKIE, secure);
      res.statusCode = 204;
      res.end();
      return;
    }

    next();
  };
}

export function googleAuth(opts: GoogleAuthOptions): Plugin {
  return {
    name: "google-auth",
    configureServer(server) {
      server.middlewares.use(middleware(opts));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(opts));
    },
  };
}
