/* =====================================================================
   duckBus.ts — lets any part of the site cheer on the duck.

   Each mode calls bumpDuck() when the user makes progress (answers a
   Coding Game question, moves to another flashcard, gets an Interview
   Prep answer graded). DuckHost, mounted once for the whole app, counts
   those and shows the duck. No mode needs to know where the duck lives.
   ===================================================================== */

const BUMP = "duck:bump";
const RESET = "duck:reset";

export const bumpDuck = (): void => {
  window.dispatchEvent(new Event(BUMP));
};

/** Restart the count from zero (Study Cards' "Restart Study"). */
export const resetDuck = (): void => {
  window.dispatchEvent(new Event(RESET));
};

export function onDuck(bump: () => void, reset: () => void): () => void {
  window.addEventListener(BUMP, bump);
  window.addEventListener(RESET, reset);
  return () => {
    window.removeEventListener(BUMP, bump);
    window.removeEventListener(RESET, reset);
  };
}
