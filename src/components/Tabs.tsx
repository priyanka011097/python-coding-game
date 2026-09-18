/* =====================================================================
   Tabs.tsx — switches between drill tracks.

   INTERVIEW POINT: `value` and `onChange` are typed with the TrackId
   union, so passing a track that does not exist is a compile error
   rather than an empty screen.
   ===================================================================== */

import type { TrackDef, TrackId } from "../types";

interface TabsProps {
  tracks: readonly TrackDef[];
  value: TrackId;
  onChange: (id: TrackId) => void;
}

export function Tabs({ tracks, value, onChange }: TabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label="Drill track">
      {tracks.map((track) => {
        const selected = track.id === value;
        return (
          <button
            key={track.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`tab${selected ? " tab--on" : ""}`}
            onClick={() => onChange(track.id)}
          >
            {track.label}
            <span className="tab__count">{track.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
