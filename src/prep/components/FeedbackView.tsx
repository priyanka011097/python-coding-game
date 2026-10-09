import type { HistoryItem, Level } from "../types";
import { LEVEL_NAMES, topicLabel } from "../topics";
import { RichText } from "./RichText";
import { SpokenQuestion } from "./SpokenQuestion";

interface FeedbackViewProps {
  item: HistoryItem;
  number: number;
  /** The topic's level after this answer. */
  newLevel: Level;
  busy: boolean;
  onNext: () => void;
}

export function FeedbackView({ item, number, newLevel, busy, onNext }: FeedbackViewProps) {
  const { question, evaluation, answer, skipped } = item;
  const tone = evaluation.score >= 7 ? "pass" : evaluation.score >= 4 ? "mid" : "fail";
  const move =
    newLevel > question.level ? "up" : newLevel < question.level ? "down" : "same";

  return (
    <div className="pp-card">
      <div className="pp-card__top">
        <span className="pp-tag pp-tag--topic">{topicLabel(question.topicId)}</span>
        <span className={`pp-tag pp-tag--l${Math.ceil(question.level / 2)}`}>
          L{question.level} · {LEVEL_NAMES[question.level]}
        </span>
        <span className="pp-qno">Q{number}</span>
      </div>

      <div className={`pp-verdict pp-verdict--${tone}`}>
        <div className="pp-score">
          {evaluation.score}
          <small>/10</small>
        </div>
        <div>
          <div className="pp-verdict__line">{skipped ? "Skipped. Here is how to answer it." : evaluation.verdict}</div>
          <div className="pp-move">
            {move === "up" && `▲ Next ${topicLabel(question.topicId)} question: level ${newLevel} (${LEVEL_NAMES[newLevel]})`}
            {move === "same" && `● Staying at level ${newLevel} for ${topicLabel(question.topicId)}`}
            {move === "down" && `▼ Easing to level ${newLevel} (${LEVEL_NAMES[newLevel]}) to shore up the basics`}
          </div>
        </div>
      </div>

      <div className="pp-card__body">
        <SpokenQuestion question={question} />

        {!skipped && (
          <details className="pp-yours">
            <summary>Your answer</summary>
            <pre className="pp-code">
              <code>{answer}</code>
            </pre>
          </details>
        )}

        {evaluation.feedback && !skipped && (
          <section className="pp-section">
            <h3 className="pp-label">Feedback</h3>
            <RichText text={evaluation.feedback} />
          </section>
        )}

        {evaluation.missed.length > 0 && (
          <section className="pp-section">
            <h3 className="pp-label">{skipped ? "Key points" : "What you missed"}</h3>
            <ul className="pp-list">
              {evaluation.missed.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </section>
        )}

        {evaluation.idealAnswer && (
          <section className="pp-section pp-ideal">
            <h3 className="pp-label">Model answer</h3>
            <RichText text={evaluation.idealAnswer} />
          </section>
        )}

        <div className="pp-actions">
          <button type="button" className="pp-btn pp-btn--primary" disabled={busy} onClick={onNext} autoFocus>
            {busy ? "Preparing next question…" : "Next question →"}
          </button>
        </div>
      </div>
    </div>
  );
}
