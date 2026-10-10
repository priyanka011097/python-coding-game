/* =====================================================================
   admin.ts — the admin page's data.

     GET /api/admin/overview -> { users: [{ …profile, lastActiveAt, entries }] }

   Only for signed-in users whose Google email is listed in ADMIN_EMAILS
   (comma-separated). The check happens here, on the server, for every
   request: hiding the Admin button in the page is a convenience, not the
   protection.

   `entries` is each user's saved progress (key -> stored string), the
   same data their own browser loads, so the admin page summarises it with
   exactly the code Home uses.
   ===================================================================== */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";
import type { Mongo } from "./db.js";
import { describeDbError } from "./db.js";
import type { Sessions } from "./session.js";
import type { UserStore } from "./users.js";

export interface AdminOptions {
  adminEmails: ReadonlySet<string>;
  sessions: Sessions;
  users: UserStore;
  mongo: Mongo | null;
}

interface ProgressDoc {
  userId: string;
  key: string;
  value: string | null;
  t: number;
}

export function parseAdminEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdmin(req: IncomingMessage, sessions: Sessions, adminEmails: ReadonlySet<string>): boolean {
  const user = sessions.read(req);
  return Boolean(user && adminEmails.has(user.email.toLowerCase()));
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  // Personal data: never let a browser or proxy cache it.
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function adminMiddleware(opts: AdminOptions): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url?.startsWith("/api/admin")) return next();

    if (!opts.sessions.read(req)) {
      json(res, 401, { error: "not_signed_in" });
      return;
    }
    if (!isAdmin(req, opts.sessions, opts.adminEmails)) {
      json(res, 403, { error: "not_admin" });
      return;
    }
    const path = new URL(req.url, "http://local").pathname;
    if (path !== "/api/admin/overview" || req.method !== "GET") {
      json(res, 404, { error: "Not found" });
      return;
    }

    void (async () => {
      try {
        const users = await opts.users.list();
        const byUser = new Map<string, { entries: Record<string, string>; lastT: number }>();
        if (opts.mongo) {
          const progress = await opts.mongo.collection<ProgressDoc>("progress");
          const docs = await progress
            .find({}, { projection: { _id: 0, userId: 1, key: 1, value: 1, t: 1 } })
            .toArray();
          for (const d of docs) {
            const u = byUser.get(d.userId) ?? { entries: {}, lastT: 0 };
            if (d.value !== null) u.entries[d.key] = d.value; // null = deleted
            u.lastT = Math.max(u.lastT, d.t);
            byUser.set(d.userId, u);
          }
        }
        json(res, 200, {
          progressStored: opts.mongo !== null,
          users: users.map((u) => {
            const p = byUser.get(u.id);
            return {
              ...u,
              lastActiveAt: p?.lastT ? new Date(p.lastT).toISOString() : null,
              entries: p?.entries ?? {},
            };
          }),
        });
      } catch (err) {
        json(res, 503, { error: describeDbError(err) });
      }
    })();
  };
}
