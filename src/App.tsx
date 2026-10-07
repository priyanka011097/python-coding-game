/* =====================================================================
   App.tsx — owns which mode is on screen (Coding Game, Study Cards or
   Interview Prep)
   and, inside the game, which track. Nothing else.
   ===================================================================== */

import { Suspense, lazy, useEffect, useState } from "react";
import type { AppMode, TrackId } from "./types";
import { TRACKS, TRACK_BY_ID } from "./data/tracks";
import { Tabs } from "./components/Tabs";
import { TrackView } from "./components/TrackView";

/* The flashcard decks are ~1,100 cards of text. Loading that mode lazily
   keeps it out of the bundle until someone actually opens Study Cards. */
const CardsMode = lazy(() =>
  import("./cards/CardsMode").then((m) => ({ default: m.CardsMode })),
);
const PrepMode = lazy(() =>
  import("./prep/PrepMode").then((m) => ({ default: m.PrepMode })),
);

const MODE_KEY = "interview-prep-mode";

const MODES: readonly { id: AppMode; label: string }[] = [
  { id: "game", label: "Coding Game" },
  { id: "cards", label: "Study Cards" },
  { id: "prep", label: "Interview Prep" },
];

function readMode(): AppMode {
  try {
    const saved = window.localStorage.getItem(MODE_KEY);
    return MODES.some((m) => m.id === saved) ? (saved as AppMode) : "game";
  } catch {
    return "game";
  }
}

export default function App() {
  const [mode, setMode] = useState<AppMode>(readMode);
  const [trackId, setTrackId] = useState<TrackId>("py");
  const track = TRACK_BY_ID[trackId];

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* private browsing — nothing to do */
    }
  }, [mode]);

  return (
    <>
      <header>
        <div className={`bar${mode === "game" ? "" : ` bar--${mode}`}`}>
          <div className="brand">
            <h1>Interview Prep</h1>
          </div>
          <div className="modes" role="tablist" aria-label="Mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                className={`mode${mode === m.id ? " mode--on" : ""}`}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
          {mode === "game" && (
            <Tabs tracks={TRACKS} value={trackId} onChange={setTrackId} />
          )}
        </div>
      </header>

      {mode === "game" ? (
        <div className="wrap">
          {/* key={trackId} remounts the whole view on a tab change, so each
              track's progress and position start clean. */}
          <TrackView key={trackId} track={track} />
        </div>
      ) : (
        <Suspense fallback={null}>
          {mode === "cards" ? <CardsMode /> : <PrepMode />}
        </Suspense>
      )}
    </>
  );
}
