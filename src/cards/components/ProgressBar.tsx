interface ProgressBarProps {
  done: number;
  total: number;
}

/** "N / M viewed" across every deck. */
export function ProgressBar({ done, total }: ProgressBarProps) {
  const pct = total ? (done / total) * 100 : 0;
  return (
    <div className="overall-progress" title="Cards viewed across all subjects">
      <div className="overall-progress-bar">
        <div className="overall-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="overall-progress-text">
        {done} / {total} viewed
      </span>
    </div>
  );
}
