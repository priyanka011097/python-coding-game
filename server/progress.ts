/* =====================================================================
   progress.ts — per-user progress in MongoDB.

     GET  /api/progress   -> { enabled, entries: { key: { value, t } } }
     POST /api/progress   <- { changes: [{ key, value, t }] }

   The browser keeps working from localStorage exactly as before; these
   endpoints mirror the app's own keys to the signed-in user's documents
   (one per key, in the `progress` collection), so progress follows the
   account across browsers and devices.

   Every change carries `t`, the time it was made. A change only replaces
   what is stored if it is newer, so two devices editing at once cannot
   overwrite a later change with an older one. `value: null` records a
   deletion, so "Reset" on one device is not undone by another.
   ===================================================================== */

import type { ServerResponse } from "node:http";
import type { Connect } from "vite";
import { readBody } from "./http";
import type { Mongo } from "./db";
import { describeDbError } from "./db";
import type { Sessions } from "./session";

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_VALUE_CHARS = 2 * 1024 * 1024;

/** Only the app's own storage keys are accepted. Mirrors src/sync/keys.ts. */
const KEY_PATTERN =
  /^(type-check-progress:[a-z]+|type-check-seeded-v2:[a-z]+|studycards_[a-z]+_v1|prep_session_v1|interview-prep-mode)$/;

interface ProgressDoc {
  userId: string;
  key: string;
  /** null = deleted on some device. */
  value: string | null;
  /** When the change was made, in ms since the epoch (client clock). */
  t: number;
  updatedAt: Date;
}

interface Change {
  key: string;
  value: string | null;
  t: number;
}

function isChange(c: unknown): c is Change {
  if (!c || typeof c !== "object") return false;
  const { key, value, t } = c as Change;
  return (
    typeof key === "string" && KEY_PATTERN.test(key) &&
    (value === null || (typeof value === "string" && value.length <= MAX_VALUE_CHARS)) &&
    typeof t === "number" && Number.isFinite(t) && t > 0
  );
}

export interface ProgressOptions {
  mongo: Mongo | null;
  sessions: Sessions;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function progressMiddleware({ mongo, sessions }: ProgressOptions): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url?.startsWith("/api/progress")) return next();

    const user = sessions.read(req);
    if (!user) {
      json(res, 401, { error: "not_signed_in" });
      return;
    }
    if (!mongo) {
      // No database configured: the app falls back to this browser only.
      json(res, 200, { enabled: false, entries: {} });
      return;
    }

    void (async () => {
      try {
        const progress = await mongo.collection<ProgressDoc>("progress");

        if (req.method === "GET") {
          const docs = await progress
            .find({ userId: user.id }, { projection: { key: 1, value: 1, t: 1 } })
            .toArray();
          const entries: Record<string, { value: string | null; t: number }> = {};
          for (const d of docs) entries[d.key] = { value: d.value, t: d.t };
          json(res, 200, { enabled: true, entries });
          return;
        }

        if (req.method === "POST") {
          const body = JSON.parse(await readBody(req, MAX_BODY_BYTES)) as { changes?: unknown };
          const changes = (Array.isArray(body.changes) ? body.changes : []).filter(isChange);
          const now = new Date();
          if (changes.length) {
            try {
              await progress.bulkWrite(
                changes.map(({ key, value, t }) => ({
                  updateOne: {
                    // Matches only if what is stored is older. If a newer
                    // value exists, the filter misses, the upsert tries to
                    // insert, and the unique index refuses it: stale
                    // change ignored.
                    filter: { userId: user.id, key, t: { $lt: t } },
                    update: { $set: { value, t, updatedAt: now } },
                    upsert: true,
                  },
                })),
                { ordered: false },
              );
            } catch (err) {
              const e = err as { code?: number; writeErrors?: { code?: number }[] };
              const onlyStale =
                e.code === 11000 ||
                (Array.isArray(e.writeErrors) && e.writeErrors.every((w) => w.code === 11000));
              if (!onlyStale) throw err;
            }
          }
          json(res, 200, { ok: true });
          return;
        }

        json(res, 405, { error: "Method not allowed" });
      } catch (err) {
        if (err instanceof Error && err.message === "too_large") {
          json(res, 413, { error: "Progress update too large" });
          return;
        }
        if (err instanceof SyntaxError) {
          json(res, 400, { error: "Invalid JSON" });
          return;
        }
        json(res, 503, { error: describeDbError(err) });
      }
    })();
  };
}
