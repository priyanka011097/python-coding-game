/* =====================================================================
   useProgress.ts — a custom hook, fully typed.

   INTERVIEW POINT: a custom hook is just a function whose name starts
   with `use` and that calls other hooks. Its RETURN TYPE is what makes
   it pleasant to consume, so write that type out explicitly.
   ===================================================================== */

import { useCallback, useEffect, useState } from "react";
import type { Attempt, Progress, TrackId } from "../types";

/** Each track keeps its own progress, so switching tabs never mixes
 *  your Python answers into your TypeScript score. */
const storageKey = (track: TrackId): string => `type-check-progress:${track}`;
/* The suffix is a version. Bumping it re-applies the seed for anyone who
   still carries the flag from an earlier, broken seeding attempt. */
const seededKey = (track: TrackId): string => `type-check-seeded-v2:${track}`;

/** Reads whatever is saved for this track. Pure — no writes. */
function readSaved(track: TrackId): Progress {
  try {
    const raw = window.localStorage.getItem(storageKey(track));
    // JSON.parse returns `any`, so we assert the shape we expect.
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

function hasSeeded(track: TrackId): boolean {
  try {
    return window.localStorage.getItem(seededKey(track)) === "1";
  } catch {
    return false;
  }
}

/** Saved progress, with the track's seed folded in the first time only.
 *
 *  The seed WINS over saved entries: it represents questions worked
 *  through before the app existed, so a stale wrong attempt sitting in
 *  localStorage should not override it. It is applied exactly once:
 *  the "seeded" flag records that, and "Reset track" keeps the flag set,
 *  so a reset empties the board for good instead of re-applying it.
 *
 *  IMPORTANT: this function must stay pure. It runs inside a useState
 *  initialiser, and React StrictMode calls those TWICE in development.
 *  Writing the "seeded" flag here meant the second call saw the flag
 *  already set and returned the un-seeded progress — the seed silently
 *  vanished. The flag is written in an effect instead.
 */
export function initialProgress(track: TrackId, seed?: Progress): Progress {
  const saved = readSaved(track);
  if (!seed || hasSeeded(track)) return saved;
  return { ...saved, ...seed };
}

/** The shape this hook hands back. Naming it makes the hook
 *  self-documenting and gives callers autocomplete. */
export interface UseProgress {
  progress: Progress;
  record: (id: number, attempt: Attempt) => void;
  clear: () => void;
  forget: (ids: readonly number[]) => void;
  correctCount: number;
  answeredCount: number;
}

export function useProgress(track: TrackId, seed?: Progress): UseProgress {
  // useState<T> — the generic says what the state holds. The lazy
  // initialiser (a function) means localStorage is read once, not on
  // every render.
  //
  // NOTE: this hook does not re-read when `track` changes. It does not
  // need to, because App gives the track view a `key={trackId}`, which
  // makes React unmount and remount it — so the hook starts fresh.
  const [progress, setProgress] = useState<Progress>(() =>
    initialProgress(track, seed),
  );

  // Record that the seed has been applied. An effect, not the initialiser,
  // so StrictMode's double render cannot lose it.
  useEffect(() => {
    if (!seed) return;
    try {
      window.localStorage.setItem(seededKey(track), "1");
    } catch {
      /* private browsing — nothing to do */
    }
  }, [track, seed]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(track), JSON.stringify(progress));
    } catch {
      /* private browsing — nothing to do */
    }
  }, [track, progress]);

  // useCallback keeps these functions stable between renders so child
  // components wrapped in React.memo do not re-render for nothing.
  const record = useCallback((id: number, attempt: Attempt): void => {
    setProgress((prev) => ({ ...prev, [id]: attempt }));
  }, []);

  const clear = useCallback((): void => {
    try {
      /* Mark the seed as used. Removing the flag instead (the old
         behaviour) made the next mount treat the seed as new and put the
         pre-done questions straight back after every reset. */
      window.localStorage.setItem(seededKey(track), "1");
    } catch {
      /* private browsing — nothing to do */
    }
    setProgress({});
  }, [track]);

  const forget = useCallback((ids: readonly number[]): void => {
    setProgress((prev) => {
      const next: Progress = { ...prev };
      for (const id of ids) delete next[id];
      return next;
    });
  }, []);

  const attempts = Object.values(progress);

  return {
    progress,
    record,
    clear,
    forget,
    correctCount: attempts.filter((a) => a.correct).length,
    answeredCount: attempts.length,
  };
}
