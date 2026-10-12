import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { apiPlugin } from "./server/app.js";
import { adsenseClient, seoPages } from "./server/seoPlugin.js";

export default defineConfig(({ mode }) => {
  // The "" prefix loads every variable, including ones without VITE_.
  // These stay on the server: only VITE_* variables reach the browser.
  const env = loadEnv(mode, process.cwd(), "");

  // The same API that api/handler.ts serves on Vercel.
  return {
    plugins: [react(), apiPlugin(env, process.cwd()), seoPages(env)],
    // AdSense IDs for the left/right ad spaces (src/ads/AdLayout.tsx).
    // Public by nature: they appear in every page's HTML.
    define: {
      __ADSENSE__: JSON.stringify({
        client: adsenseClient(env),
        left: /^\d+$/.test(env.ADSENSE_SLOT_LEFT ?? "") ? env.ADSENSE_SLOT_LEFT : "",
        right: /^\d+$/.test(env.ADSENSE_SLOT_RIGHT ?? "") ? env.ADSENSE_SLOT_RIGHT : "",
      }),
    },
  };
});
