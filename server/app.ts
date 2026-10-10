/* =====================================================================
   app.ts — builds the whole server-side API from environment variables.

   Two hosts run exactly the same chain:
     - locally, the Vite dev / preview server (apiPlugin, in vite.config.ts)
     - on Vercel, one serverless function (api/handler.ts)

   Routes: /api/me, /auth/google, /auth/google/callback, /auth/logout,
           /api/progress, /api/llm, /api/admin/overview
   ===================================================================== */

import { randomBytes } from "node:crypto";
import type { Connect, Plugin } from "vite";
import { googleAuthMiddleware } from "./googleAuth.js";
import { nvidiaMiddleware } from "./nvidiaProxy.js";
import { progressMiddleware } from "./progress.js";
import { Sessions } from "./session.js";
import { Mongo } from "./db.js";
import { FileUserStore, MongoUserStore } from "./users.js";
import { adminMiddleware, isAdmin, parseAdminEmails } from "./admin.js";

export type Env = Record<string, string | undefined>;

export function buildApi(env: Env, root: string): Connect.NextHandleFunction[] {
  // GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET, or plain CLIENT_ID / CLIENT_SECRET.
  const googleClientId = env.GOOGLE_CLIENT_ID || env.CLIENT_ID;
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET || env.CLIENT_SECRET;
  const authConfigured = Boolean(googleClientId && googleClientSecret);

  if (authConfigured && !env.SESSION_SECRET) {
    console.warn(
      "[auth] SESSION_SECRET is not set; using a random one, so everyone is signed out whenever the server restarts.",
    );
  }
  const sessions = new Sessions(env.SESSION_SECRET || randomBytes(32).toString("hex"));

  // With MONGODB_URI, accounts and per-user progress live in MongoDB.
  // Without it, accounts go to .data/users.json (local only: a serverless
  // host has no writable disk) and progress stays in each browser.
  const mongo = env.MONGODB_URI ? new Mongo(env.MONGODB_URI, env.MONGODB_DB) : null;
  const users = mongo ? new MongoUserStore(mongo) : new FileUserStore(root);

  // Google emails allowed to open the admin page, e.g. "you@gmail.com,b@x.com".
  const adminEmails = parseAdminEmails(env.ADMIN_EMAILS);

  return [
    googleAuthMiddleware({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      appUrl: env.APP_URL,
      sessions,
      users,
      isAdmin: (req) => isAdmin(req, sessions, adminEmails),
    }),
    adminMiddleware({ adminEmails, sessions, users, mongo }),
    progressMiddleware({ mongo, sessions }),
    nvidiaMiddleware({
      apiKey: env.NVIDIA_API_KEY,
      model: env.NVIDIA_MODEL,
      thinking: env.NVIDIA_THINKING,
      // Until Google sign-in is configured, the app stays open.
      isSignedIn: authConfigured ? (req) => sessions.read(req) !== null : undefined,
    }),
  ];
}

/** The API as a Vite plugin, for `npm run dev` and `npm run preview`. */
export function apiPlugin(env: Env, root: string): Plugin {
  const chain = buildApi(env, root);
  return {
    name: "interview-prep-api",
    configureServer(server) {
      for (const handler of chain) server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      for (const handler of chain) server.middlewares.use(handler);
    },
  };
}
