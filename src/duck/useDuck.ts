/* =====================================================================
   useDuck.ts — the duck that cheers you on as you move between cards.

   Every navigation counts. Every 2nd one a small duck peeks in from a
   random corner with a motivational line; every 10th a big duck flies up
   from the bottom shouting "Quack! +10". The count survives reloads.
   ===================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import { KEYS, loadNumber, saveString } from "../cards/storage";

export const DUCK_BIG_EVERY = 10;
const DUCK_QUICK_EVERY = 2;
const BIG_MS = 3700;
const QUICK_MS = 3050;
const FLOAT_MS = 3600;

const CORNERS = ["br", "bl", "tr", "tl"] as const;
export type Corner = (typeof CORNERS)[number];

const MOTIVATIONS = [
  "Keep going, {name}!",
  "You got this, {name}!",
  "Nice work, {name}!",
  "Looking sharp, {name}!",
  "Crushing it, {name}!",
  "Stay focused, {name}!",
  "Almost there, {name}!",
  "On a roll, {name}!",
  "Quack-tastic, {name}!",
  "Brain gains, {name}!",
  "Keep flying, {name}!",
  "You're unstoppable, {name}!",
  "One step closer, {name}!",
  "Smashing it, {name}!",
  "Way to go, {name}!",
  "Killing it, {name}!",
  "Don't stop now, {name}!",
  "That's the spirit, {name}!",
  "Look at you go, {name}!",
  "Stay sharp, {name}!",
] as const;

const pick = <T,>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)]!;

/** Encouragement for the random ducks that pop up anywhere on screen. */
export const ENCOURAGEMENTS = [
  "Keep up the good work!",
  "Keep going, you're doing great!",
  "You're doing better than you think!",
  "Keep shining, you're doing amazing!",
  "Don't stop now, you're getting there!",
  "Keep pushing, you've got this!",
  "You're on the right track!",
  "Keep it up, superstar!",
  "One step closer every day!",
  "Keep growing, keep glowing!",
  "You're making great progress!",
  "Stay consistent, stay unstoppable!",
  "Keep showing up for yourself!",
  "You're doing an amazing job!",
  "Keep moving forward, no matter what!",
  "Trust the process, keep going!",
  "Your efforts are paying off!",
  "Keep believing in yourself!",
  "You're closer than you think!",
  "Keep winning, one day at a time!",
  "Proud of how far you've come!",
  "Keep doing your thing!",
  "You're absolutely crushing it!",
  "Stay strong, keep moving!",
  "Great things take time, keep going!",
] as const;

/** Progress ducks mix the name-based cheers with the encouragements. */
function motivation(name: string): string {
  if (Math.random() < 0.5) return pick(ENCOURAGEMENTS);
  const template = pick(MOTIVATIONS);
  return name ? template.replace("{name}", name) : template.replace(/,?\s*\{name\}/, "");
}

/** A discriminated union: a big duck has no corner or message. `id`
 *  changes on every appearance so React remounts the element and the
 *  CSS animation plays from the start. */
export type DuckShow =
  | { id: number; mode: "big"; /** Replaces "Quack! +10". */ text?: string }
  | { id: number; mode: "quick"; corner: Corner; text: string }
  /** Pops up at a random spot on screen (x, y in % of the viewport). */
  | { id: number; mode: "float"; x: number; y: number; text: string };

export interface UseDuck {
  duck: DuckShow | null;
  bumpNav: (name: string) => void;
  resetNav: () => void;
  /** A random duck at a random spot, unless one is already showing.
   *  Returns whether it showed. */
  cheer: () => boolean;
}

export function useDuck(): UseDuck {
  const [duck, setDuck] = useState<DuckShow | null>(null);
  const navCount = useRef<number>(loadNumber(KEYS.nav, 0));
  const lastBig = useRef<number>(Math.floor(navCount.current / DUCK_BIG_EVERY));
  const lastQuick = useRef<number>(Math.floor(navCount.current / DUCK_QUICK_EVERY));
  const timer = useRef<number | undefined>(undefined);
  const nextId = useRef<number>(0);

  const show = useCallback((next: DuckShow, ms: number): void => {
    window.clearTimeout(timer.current);
    setDuck(next);
    timer.current = window.setTimeout(() => setDuck(null), ms);
  }, []);

  const bumpNav = useCallback(
    (name: string): void => {
      navCount.current += 1;
      saveString(KEYS.nav, String(navCount.current));

      const big = Math.floor(navCount.current / DUCK_BIG_EVERY);
      const quick = Math.floor(navCount.current / DUCK_QUICK_EVERY);
      nextId.current += 1;

      if (big > lastBig.current) {
        lastBig.current = big;
        lastQuick.current = quick;
        show({ id: nextId.current, mode: "big" }, BIG_MS);
      } else if (quick > lastQuick.current) {
        lastQuick.current = quick;
        show(
          { id: nextId.current, mode: "quick", corner: pick(CORNERS), text: motivation(name) },
          QUICK_MS,
        );
      }
    },
    [show],
  );

  const resetNav = useCallback((): void => {
    navCount.current = 0;
    lastBig.current = 0;
    lastQuick.current = 0;
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const showing = useRef<boolean>(false);
  showing.current = duck !== null;

  const cheer = useCallback((): boolean => {
    if (showing.current) return false;
    nextId.current += 1;
    show(
      {
        id: nextId.current,
        mode: "float",
        // Kept clear of the edges so the bubble is never cut off.
        x: 6 + Math.random() * 70,
        y: 14 + Math.random() * 62,
        text: pick(ENCOURAGEMENTS),
      },
      FLOAT_MS,
    );
    return true;
  }, [show]);

  return { duck, bumpNav, resetNav, cheer };
}
