/* =====================================================================
   contact.ts — the public contact form.

     POST /api/contact   <- { name, email, message, website }

   Saved to the `messages` collection in MongoDB and listed on the Admin
   page. Anyone can send (no sign-in needed), so it is guarded:
     - `website` is a honeypot field hidden from people; bots fill it in
     - length limits and a basic email check
     - at most 5 messages per IP address per hour
   ===================================================================== */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";
import type { Mongo } from "./db.js";
import { describeDbError } from "./db.js";
import { readBody } from "./http.js";
import type { Sessions } from "./session.js";

export interface MessageDoc {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  /** Set when the sender was signed in. */
  userId: string | null;
}

export interface ContactOptions {
  mongo: Mongo | null;
  sessions: Sessions;
}

const LIMIT_PER_HOUR = 5;
const recent = new Map<string, number[]>();

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function clientIp(req: IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "unknown";
}

function tooMany(ip: string): boolean {
  const hourAgo = Date.now() - 3600_000;
  const times = (recent.get(ip) ?? []).filter((t) => t > hourAgo);
  if (times.length >= LIMIT_PER_HOUR) {
    recent.set(ip, times);
    return true;
  }
  times.push(Date.now());
  recent.set(ip, times);
  return false;
}

const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function contactMiddleware({ mongo, sessions }: ContactOptions): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (req.url?.split("?")[0] !== "/api/contact") return next();
    if (req.method !== "POST") {
      json(res, 405, { error: "Use POST" });
      return;
    }
    void (async () => {
      try {
        const body = JSON.parse(await readBody(req, 16 * 1024)) as Record<string, unknown>;
        // Honeypot: pretend it worked so the bot moves on.
        if (clean(body.website, 200)) {
          json(res, 200, { ok: true });
          return;
        }
        const name = clean(body.name, 100);
        const email = clean(body.email, 200);
        const message = clean(body.message, 5000);
        if (!name || !message) {
          json(res, 400, { error: "Please add your name and a message." });
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          json(res, 400, { error: "Please enter a valid email address so we can reply." });
          return;
        }
        if (tooMany(clientIp(req))) {
          json(res, 429, { error: "You have sent several messages already. Please try again in an hour, or email us." });
          return;
        }
        if (!mongo) {
          json(res, 503, { error: "Messages cannot be saved right now. Please email us instead." });
          return;
        }
        const messages = await mongo.collection<MessageDoc>("messages");
        await messages.insertOne({
          name,
          email,
          message,
          createdAt: new Date(),
          userId: sessions.read(req)?.id ?? null,
        });
        json(res, 200, { ok: true });
      } catch (err) {
        if (err instanceof SyntaxError) json(res, 400, { error: "Invalid request." });
        else if (err instanceof Error && err.message === "too_large") json(res, 413, { error: "That message is too long." });
        else json(res, 503, { error: describeDbError(err) });
      }
    })();
  };
}
