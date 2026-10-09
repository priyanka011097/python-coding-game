/* =====================================================================
   http.ts — small request helpers shared by every API route.

   The same middleware runs in two places: the Vite dev/preview server
   (plain Node requests) and a Vercel serverless function (api/handler.ts),
   where the platform has usually read the body already and exposes it
   as `req.body`. readBody handles both.
   ===================================================================== */

import type { IncomingMessage } from "node:http";

export function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  const pre = (req as IncomingMessage & { body?: unknown }).body;
  if (pre !== undefined && pre !== null) {
    const text =
      typeof pre === "string" ? pre : Buffer.isBuffer(pre) ? pre.toString("utf8") : JSON.stringify(pre);
    if (Buffer.byteLength(text) > maxBytes) return Promise.reject(new Error("too_large"));
    return Promise.resolve(text);
  }
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** The address the browser used, honouring a proxy's forwarded headers
 *  (Vercel serves https and passes the original host and scheme). */
export function publicBase(req: IncomingMessage): string {
  const first = (v: string | string[] | undefined): string | undefined =>
    (Array.isArray(v) ? v[0] : v)?.split(",")[0]?.trim() || undefined;
  const proto = first(req.headers["x-forwarded-proto"]) ?? "http";
  const host = first(req.headers["x-forwarded-host"]) ?? req.headers.host ?? "localhost:5173";
  return `${proto}://${host}`;
}
