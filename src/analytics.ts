/* analytics.ts — page views for Google Analytics, when it is set up.

   The gtag script is added to the built pages only when GA_MEASUREMENT_ID
   is set (server/seoPlugin.ts). It records the first page view itself;
   inside the app, each section (Dashboard, Coding Game, ...) shares one
   address, so switching section is recorded here as its own page view. */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

let first = true;

export function trackSection(path: string, title: string): void {
  if (first) {
    // The page load was already counted by the tag itself.
    first = false;
    return;
  }
  window.gtag?.("event", "page_view", {
    page_title: title,
    page_location: window.location.origin + path,
  });
}
