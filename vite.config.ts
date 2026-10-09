import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { apiPlugin } from "./server/app.js";

export default defineConfig(({ mode }) => {
  // The "" prefix loads every variable, including ones without VITE_.
  // These stay on the server: only VITE_* variables reach the browser.
  const env = loadEnv(mode, process.cwd(), "");

  // The same API that api/handler.ts serves on Vercel.
  return {
    plugins: [react(), apiPlugin(env, process.cwd())],
  };
});
