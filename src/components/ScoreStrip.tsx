/* ScoreStrip.tsx — the grid of all questions. Click one to jump to it. */

import type { Progress } from "../types";

interface ScoreStripProps {
  total: number;
  current: number;
  progress: Progress;
  onJump: (index: number) => void;
}

export function ScoreStrip({ total, current, progress, onJump }: ScoreStripProps) {
  return (
    <section className="strip-wrap">
      <div className="strip-head">
        <h2>All questions</h2>
        <div className="legend">
          <span><i className="dot dot--pass" />right</span>
          <span><i className="dot dot--fail" />missed</span>
          <span><i className="dot dot--none" />not tried</span>
        </div>
      </div>

      <div className="strip">
        {Array.from({ length: total }, (_unused, index) => {
          // `attempt` is `Attempt | undefined` — the index signature makes
          // that explicit, so the ternary below is required, not optional.
          const attempt = progress[index];
          const state = attempt ? (attempt.correct ? "pass" : "fail") : "none";

          return (
            <button
              key={index}
              type="button"
              className={`cell cell--${state}${index === current ? " cell--here" : ""}`}
              onClick={() => onJump(index)}
              aria-label={`Question ${index + 1}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </section>
  );
}
