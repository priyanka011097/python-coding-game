/* =====================================================================
   App.tsx — owns which track is on screen, and nothing else.
   ===================================================================== */

import { useState } from "react";
import type { TrackId } from "./types";
import { TRACKS, TRACK_BY_ID } from "./data/tracks";
import { Tabs } from "./components/Tabs";
import { TrackView } from "./components/TrackView";

export default function App() {
  const [trackId, setTrackId] = useState<TrackId>("py");
  const track = TRACK_BY_ID[trackId];

  return (
    <>
      <header>
        <div className="bar">
          <div className="brand">
            <h1>Coding Game</h1>
          </div>
          <Tabs tracks={TRACKS} value={trackId} onChange={setTrackId} />
        </div>
      </header>

      <div className="wrap">
        {/* key={trackId} remounts the whole view on a tab change, so each
            track's progress and position start clean. */}
        <TrackView key={trackId} track={track} />
      </div>
    </>
  );
}
