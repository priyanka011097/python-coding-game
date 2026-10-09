/* =====================================================================
   session.ts — signed session cookies and small cookie helpers.

   The cookie holds `<base64url payload>.<HMAC-SHA256 signature>`. It is
   HttpOnly (page scripts cannot read it) and SameSite=Lax (other sites
   cannot make the browser send it on a cross-site POST).
   ===================================================================== */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export const SESSION_COOKIE = "ip_session";
export const STATE_COOKIE = "ip_oauth_state";
const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    const key = part.slice(0, i).trim();
    if (key) out[key] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function setCookie(
  res: ServerResponse,
  name: string,
  value: string,
  opts: { maxAgeSeconds: number; secure: boolean },
): void {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${opts.maxAgeSeconds}`,
  ];
  if (opts.secure) parts.push("Secure");
  const existing = res.getHeader("Set-Cookie");
  const list = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
  res.setHeader("Set-Cookie", [...list, parts.join("; ")]);
}

export const clearCookie = (res: ServerResponse, name: string, secure: boolean): void =>
  setCookie(res, name, "", { maxAgeSeconds: 0, secure });

export const randomToken = (): string => randomBytes(24).toString("base64url");

export class Sessions {
  constructor(private readonly secret: string) {}

  private sign(data: string): string {
    return createHmac("sha256", this.secret).update(data).digest("base64url");
  }

  create(user: SessionUser): { value: string; maxAgeSeconds: number } {
    const maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60;
    const payload: SessionPayload = { ...user, exp: Math.floor(Date.now() / 1000) + maxAgeSeconds };
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return { value: `${data}.${this.sign(data)}`, maxAgeSeconds };
  }

  read(req: IncomingMessage): SessionUser | null {
    const raw = parseCookies(req)[SESSION_COOKIE];
    if (!raw) return null;
    const [data, sig] = raw.split(".");
    if (!data || !sig) return null;
    const expected = Buffer.from(this.sign(data));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    try {
      const p = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
      if (typeof p.exp !== "number" || p.exp < Date.now() / 1000) return null;
      return { id: p.id, email: p.email, name: p.name, picture: p.picture };
    } catch {
      return null;
    }
  }
}
