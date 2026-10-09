/* =====================================================================
   api/handler.ts — the whole API as one Vercel serverless function.

   vercel.json rewrites /api/* and /auth/* here, passing the original path
   as ?__path=…; it is restored onto req.url so the shared middleware
   (server/app.ts) routes exactly as it does under `npm run dev`.

   Set the same variables as .env in Vercel → Project → Settings →
   Environment Variables.
   ===================================================================== */

import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApi } from "../server/app";

// Built once per warm instance, so the MongoDB connection is reused.
const chain = buildApi(process.env, process.cwd());

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://internal");
  const original = url.searchParams.get("__path");
  if (original) {
    url.searchParams.delete("__path");
    req.url = original + url.search;
  }

  let i = 0;
  const next = (err?: unknown): void => {
    if (err) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Server error" }));
      return;
    }
    const step = chain[i++];
    if (!step) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }
    step(req, res, next);
  };
  next();
}
