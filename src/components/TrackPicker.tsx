/* =====================================================================
   TrackPicker.tsx — the first time Coding Game opens, choose a track.
   After that, Coding Game reopens the track used last (see App.tsx).
   ===================================================================== */

import type { TrackDef, TrackId } from "../types";

const ABOUT: Record<TrackId, { icon: string; blurb: string }> = {
  ts: { icon: "⚛️", blurb: "Types, interfaces, unions, generics, then React props, state, events, hooks and typed APIs." },
  py: { icon: "🐍", blurb: "From your very first print() to data structures and algorithms, step by step, in order." },
  ai: { icon: "🤖", blurb: "pandas, NumPy, scikit-learn, core ML concepts and how LLMs work." },
};

interface TrackPickerProps {
  tracks: readonly TrackDef[];
  onPick: (id: TrackId) => void;
}

export function TrackPicker({ tracks, onPick }: TrackPickerProps) {
  return (
    <div className="tp">
      <h1 className="tp-title">Choose a track</h1>
      <p className="tp-sub">
        Fill in the blank in real code, one question at a time. Pick where to start; you can switch tracks any
        time from the tabs at the top.
      </p>
      <div className="tp-grid">
        {tracks.map((t) => {
          const about = ABOUT[t.id];
          return (
            <button key={t.id} type="button" className="tp-card" onClick={() => onPick(t.id)}>
              <span className="tp-card__icon" aria-hidden="true">{about.icon}</span>
              <span className="tp-card__name">{t.label}</span>
              <span className="tp-card__count">{t.sub}</span>
              <span className="tp-card__blurb">{about.blurb}</span>
              <span className="tp-card__go">Start this track →</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
