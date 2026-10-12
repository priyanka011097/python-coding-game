/// <reference types="vite/client" />

/** AdSense IDs, set from ADSENSE_CLIENT / ADSENSE_SLOT_LEFT / ADSENSE_SLOT_RIGHT
 *  at build time (vite.config.ts). Empty strings when not set. */
declare const __ADSENSE__: { client: string; left: string; right: string };
