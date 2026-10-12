/* =====================================================================
   AdLayout.tsx — equal ad space on the left and right of every page.

   Wide screens get a rail on each side, always the same width:
     >= 1200px  160px rails  (160x600 "wide skyscraper")
     >= 1600px  300px rails  (300x600 "half page")
   Below 1200px the rails are hidden so the content keeps its room.

   Each rail holds one sticky slot. With ADSENSE_CLIENT and
   ADSENSE_SLOT_LEFT / ADSENSE_SLOT_RIGHT set (Vercel environment), it shows
   that AdSense ad unit; otherwise it stays empty and invisible. In
   development a faint outline shows where ads will go.
   ===================================================================== */

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import "./ads.css";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADS = __ADSENSE__;

/** One AdSense ad unit. Pushed once per mount; AdSense fills the <ins>. */
function AdUnit({ slot }: { slot: string }) {
  const ref = useRef<HTMLModElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      /* blocked by an ad blocker: leave the space empty */
    }
  }, []);
  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{ display: "block", width: "100%", height: "100%" }}
      data-ad-client={ADS.client}
      data-ad-slot={slot}
    />
  );
}

function AdSlot({ side }: { side: "left" | "right" }) {
  const slot = ADS[side];
  const live = !import.meta.env.DEV && ADS.client !== "" && slot !== "";
  return (
    <div className="ad-slot" data-ad-side={side}>
      {live ? <AdUnit slot={slot} /> : import.meta.env.DEV && <span className="ad-slot__dev" aria-hidden="true">Ad space · {side}</span>}
    </div>
  );
}

export function AdLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ad-layout">
      <aside className="ad-rail ad-rail--left" aria-label="Advertisement">
        <AdSlot side="left" />
      </aside>
      <div className="ad-layout__main">{children}</div>
      <aside className="ad-rail ad-rail--right" aria-label="Advertisement">
        <AdSlot side="right" />
      </aside>
    </div>
  );
}
