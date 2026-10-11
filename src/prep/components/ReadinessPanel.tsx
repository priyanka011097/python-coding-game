import { useState } from "react";
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

/* Open or collapsed is a per-device preference, remembered locally. */
const OPEN_KEY = "prep_readiness_open";
const readOpen = (): boolean => {
  try {
    return window.localStorage.getItem(OPEN_KEY) !== "0";
  } catch {
    return true;
  }
};
const saveOpen = (open: boolean): void => {
  try {
    window.localStorage.setItem(OPEN_KEY, open ? "1" : "0");
  } catch {
    /* private browsing — still toggles for this visit */
  }
};

/** Direction comes from CSS: on wide screens the box folds sideways (›
 *  hides it to the right, ‹ brings it back); on phones, where it sits above
 *  the question, it folds up and down. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`pp-chev ${open ? "pp-chev--open" : "pp-chev--closed"}`} viewBox="0 0 24 24" width="16" height="16"
      fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ReadinessPanel({ topicIds, levels, history, onReport, reportBusy }: ReadinessPanelProps) {
  const overall = overallReadiness(history, topicIds);
  const ready = overall >= READY_AT;
  const answered = history.filter((h) => topicIds.includes(h.question.topicId)).length;
  const [open, setOpen] = useState<boolean>(readOpen);
  const toggle = (): void => {
    setOpen((was) => {
      saveOpen(!was);
      return !was;
    });
  };

  if (!open) {
    // Collapsed: one slim line, so the question gets the room.
    return (
      <aside className="pp-card pp-ready pp-ready--collapsed">
        <button
          type="button"
          className="pp-ready__bar"
          onClick={toggle}
          aria-expanded={false}
          aria-controls="pp-ready-body"
          aria-label={`Show interview readiness (${overall}%)`}
          title="Show interview readiness"
        >
          <Chevron open={false} />
          <span className="pp-label">Interview readiness</span>
          <b className="pp-ready__mini">{overall}%</b>
        </button>
      </aside>
    );
  }

  return (
    <aside className="pp-card pp-ready">
      <div className="pp-ready__head">
        <span className="pp-label">Interview readiness</span>
        <button
          type="button"
          className="pp-ready__toggle"
          onClick={toggle}
          aria-expanded={true}
          aria-controls="pp-ready-body"
          aria-label="Hide interview readiness"
          title="Hide"
        >
          <Chevron open />
        </button>
      </div>
      <div id="pp-ready-body">
      <div className="pp-ready__numrow">
        <div className="pp-ready__num">{overall}%</div>
        <span className={`pp-ready__tag${ready ? " pp-ready__tag--ok" : ""}`}>{readinessLabel(overall)}</span>
      </div>
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
      </div>
    </aside>
  );
}
