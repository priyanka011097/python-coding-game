import type { HistoryItem, Level } from "../types";
import { LEVEL_NAMES, topicLabel } from "../topics";
import { READY_AT, overallReadiness, readinessLabel, topicReadiness } from "../readiness";

interface ReadinessPanelProps {
  topicIds: readonly string[];
  levels: Readonly<Record<string, Level>>;
  history: readonly HistoryItem[];
  onReport: () => void;
  reportBusy: boolean;
}

export function ReadinessPanel({ topicIds, levels, history, onReport, reportBusy }: ReadinessPanelProps) {
  const overall = overallReadiness(history, topicIds);
  const ready = overall >= READY_AT;
  const answered = history.filter((h) => topicIds.includes(h.question.topicId)).length;

  return (
    <aside className="pp-card pp-ready">
      <div className="pp-ready__head">
        <span className="pp-label">Interview readiness</span>
        <span className={`pp-ready__tag${ready ? " pp-ready__tag--ok" : ""}`}>{readinessLabel(overall)}</span>
      </div>
      <div className="pp-ready__num">{overall}%</div>
      <div className="pp-bar">
        <div className={`pp-bar__fill${ready ? " pp-bar__fill--ok" : ""}`} style={{ width: `${overall}%` }} />
        <div className="pp-bar__goal" style={{ left: `${READY_AT}%` }} title={`Ready at ${READY_AT}%`} />
      </div>
      <p className="pp-small">
        Ready at {READY_AT}%: that means scoring well on Hard (level 7+) questions across your recent
        answers in every topic.
      </p>

      <ul className="pp-topics">
        {topicIds.map((id) => {
          const pct = topicReadiness(history, id);
          const level = levels[id] ?? 1;
          return (
            <li key={id}>
              <div className="pp-topics__row">
                <span>{topicLabel(id)}</span>
                <span className="pp-mono">
                  L{level} {LEVEL_NAMES[level]} · {pct}%
                </span>
              </div>
              <div className="pp-bar pp-bar--thin">
                <div className="pp-bar__fill" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="pp-btn pp-btn--ghost pp-btn--block"
        disabled={answered < 3 || reportBusy}
        onClick={onReport}
        title={answered < 3 ? "Answer at least 3 questions first" : undefined}
      >
        {reportBusy ? "Writing your report…" : answered < 3 ? `Readiness report (after ${3 - answered} more)` : "Get my readiness report"}
      </button>
    </aside>
  );
}
