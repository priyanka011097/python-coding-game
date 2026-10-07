import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { nvidiaProxy } from "./server/nvidiaProxy";

export default defineConfig(({ mode }) => {
  // The "" prefix loads every variable, including ones without VITE_.
  // These stay on the server: only VITE_* variables reach the browser.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      nvidiaProxy({ apiKey: env.NVIDIA_API_KEY, model: env.NVIDIA_MODEL }),
    ],
  };
});
