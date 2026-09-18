/* Summary.tsx — the end screen. */

interface SummaryProps {
  correctCount: number;
  total: number;
  /** `readonly number[]` — this component may read the list but never
   *  push to it. A small habit that prevents a lot of accidental
   *  mutation bugs. */
  missed: readonly number[];
  onRedoMissed: () => void;
  onStartOver: () => void;
}

export function Summary({
  correctCount,
  total,
  missed,
  onRedoMissed,
  onStartOver,
}: SummaryProps) {
  return (
    <article className="card">
      <div className="done">
        <h3>
          {correctCount} of {total} right
        </h3>
        <p>
          {missed.length > 0
            ? `Worth another pass on: ${missed.map((i) => `Q${i + 1}`).join(", ")}`
            : "Clean sweep."}
        </p>
        <button
          type="button"
          className="primary"
          onClick={missed.length > 0 ? onRedoMissed : onStartOver}
        >
          {missed.length > 0 ? "Redo the missed ones" : "Start over"}
        </button>
      </div>
    </article>
  );
}
