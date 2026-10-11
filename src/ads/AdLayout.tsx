/* =====================================================================
   AdLayout.tsx — equal ad space on the left and right of every page.

   Wide screens get a rail on each side, always the same width:
     >= 1200px  160px rails  (160x600 "wide skyscraper")
     >= 1600px  300px rails  (300x600 "half page")
   Below 1200px the rails are hidden so the content keeps its room.

   Each rail holds one sticky slot marked data-ad-slot="left" / "right",
   ready for an ad network's tag. The slots are empty and invisible to
   users; in development a faint outline shows where ads will go.
   ===================================================================== */

import type { ReactNode } from "react";
import "./ads.css";

function AdSlot({ side }: { side: "left" | "right" }) {
  return (
    <div className="ad-slot" data-ad-slot={side} aria-hidden="true">
      {import.meta.env.DEV && <span className="ad-slot__dev">Ad space · {side}</span>}
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
