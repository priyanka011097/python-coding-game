import { randomBytes } from "node:crypto";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { nvidiaProxy } from "./server/nvidiaProxy";
import { googleAuth } from "./server/googleAuth";
import { Sessions } from "./server/session";
import { FileUserStore, MongoUserStore } from "./server/users";
import { Mongo } from "./server/db";
import { progressSync } from "./server/progress";

export default defineConfig(({ mode }) => {
  // The "" prefix loads every variable, including ones without VITE_.
  // These stay on the server: only VITE_* variables reach the browser.
  const env = loadEnv(mode, process.cwd(), "");

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
  // Without it, accounts go to .data/users.json and progress stays in
  // each browser.
  const mongo = env.MONGODB_URI ? new Mongo(env.MONGODB_URI, env.MONGODB_DB) : null;

  return {
    plugins: [
      react(),
      googleAuth({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        appUrl: env.APP_URL,
        sessions,
        users: mongo ? new MongoUserStore(mongo) : new FileUserStore(process.cwd()),
      }),
      progressSync({ mongo, sessions }),
      nvidiaProxy({
        apiKey: env.NVIDIA_API_KEY,
        model: env.NVIDIA_MODEL,
        thinking: env.NVIDIA_THINKING,
        // Until Google sign-in is configured, the app stays open.
        isSignedIn: authConfigured ? (req) => sessions.read(req) !== null : undefined,
      }),
    ],
  };
});
