/* =====================================================================
   LandingDuck.tsx — the duck pops in as the landing page is scrolled.

   Each section marked with data-duck="…" shows a small duck with that
   line the first time it reaches the middle of the screen; the section marked
   data-duck-big gets the big "Quack!" duck. Once per section per visit,
   so it delights rather than nags. The hero, visible on load, is not
   marked: the duck only appears once the visitor starts scrolling.
   ===================================================================== */

import { useEffect, useRef, useState } from "react";
import { Duck } from "../duck/Duck";
import type { Corner, DuckShow } from "../duck/useDuck";
import "../duck/duck.css";

const CORNERS: readonly Corner[] = ["br", "bl"];
const QUICK_MS = 3050;
const BIG_MS = 3700;

export function LandingDuck() {
  const [duck, setDuck] = useState<DuckShow | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let id = 0;
    const seen = new Set<Element>();
    const show = (next: DuckShow, ms: number): void => {
      window.clearTimeout(timer.current);
      setDuck(next);
      timer.current = window.setTimeout(() => setDuck(null), ms);
    };
    /* Only the line across the middle of the screen counts, so the duck
       always speaks about the section being read right now. A newer
       section replaces an older duck instead of queueing behind it, which
       is what made the message lag behind the page. */
    // The closing big duck is never cut short by a smaller one.
    let bigUntil = 0;
    const celebrate = (el: HTMLElement): void => {
      seen.add(el);
      id += 1;
      if (el.dataset.duckBig !== undefined) {
        bigUntil = Date.now() + BIG_MS;
        show({ id, mode: "big", text: el.dataset.duckBig || "Quack!" }, BIG_MS);
      } else if (Date.now() >= bigUntil) {
        show({ id, mode: "quick", corner: CORNERS[id % CORNERS.length]!, text: el.dataset.duck ?? "Quack!" }, QUICK_MS);
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((e) => e.isIntersecting && !seen.has(e.target));
        const el = entering[entering.length - 1]?.target as HTMLElement | undefined;
        entering.forEach((e) => seen.add(e.target));
        if (el) celebrate(el);
      },
      // A 1%-tall line across the middle: a section counts while it covers it.
      { rootMargin: "-49.5% 0px -49.5% 0px", threshold: 0 },
    );
    /* Start watching on the first scroll, not on load: the duck is a
       reward for scrolling. */
    const begin = (): void => {
      document.querySelectorAll("[data-duck], [data-duck-big]").forEach((el) => observer.observe(el));
    };
    window.addEventListener("scroll", begin, { once: true, passive: true });
    /* On a tall screen the last section never reaches the middle, because
       the page ends first: reaching the bottom counts as reaching it. */
    const atBottom = (): void => {
      if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 4) return;
      const last = document.querySelector<HTMLElement>("[data-duck-big]");
      if (!last || seen.has(last)) return;
      seen.add(last);
      // Let any section reaching the middle on this same scroll speak first.
      window.setTimeout(() => celebrate(last), 120);
    };
    window.addEventListener("scroll", atBottom, { passive: true });
    return () => {
      window.removeEventListener("scroll", begin);
      window.removeEventListener("scroll", atBottom);
      observer.disconnect();
      window.clearTimeout(timer.current);
    };
  }, []);

  return duck ? <Duck key={duck.id} duck={duck} /> : null;
}
