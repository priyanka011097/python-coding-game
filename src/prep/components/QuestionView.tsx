import { useEffect, useRef, useState } from "react";
import type { PrepQuestion } from "../types";
import { LEVEL_NAMES, topicLabel } from "../topics";
import { RichText } from "./RichText";

interface QuestionViewProps {
  question: PrepQuestion;
  number: number;
  busy: boolean;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
}

export function QuestionView({ question, number, busy, onSubmit, onSkip }: QuestionViewProps) {
  const [answer, setAnswer] = useState<string>("");
  const [hint, setHint] = useState<boolean>(false);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    box.current?.focus();
  }, []);

  const canSubmit = answer.trim() !== "" && !busy;

  return (
    <div className="pp-card">
      <div className="pp-card__top">
        <span className="pp-tag pp-tag--topic">{topicLabel(question.topicId)}</span>
        <span className={`pp-tag pp-tag--l${Math.ceil(question.level / 2)}`}>
          L{question.level} · {LEVEL_NAMES[question.level]}
        </span>
        <span className="pp-tag">{question.type}</span>
        <span className="pp-qno">Q{number}</span>
      </div>

      <div className="pp-card__body">
        <h2 className="pp-title">{question.title}</h2>
        <RichText text={question.question} />

        {question.hint &&
          (hint ? (
            <p className="pp-hint">💡 {question.hint}</p>
          ) : (
            <button type="button" className="pp-link" onClick={() => setHint(true)}>
              Show a hint
            </button>
          ))}

        <label htmlFor="pp-answer" className="pp-label pp-answer-label">
          Your answer
        </label>
        <textarea
          id="pp-answer"
          ref={box}
          className="pp-answer"
          rows={9}
          spellCheck={false}
          placeholder="Explain it like you would to the interviewer, or write the code / query…"
          value={answer}
          disabled={busy}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSubmit) {
              e.preventDefault();
              onSubmit(answer);
            }
            // Tab inserts indentation instead of leaving the box — it is a code editor.
            if (e.key === "Tab" && !e.shiftKey) {
              e.preventDefault();
              const el = e.currentTarget;
              const { selectionStart: s, selectionEnd: end } = el;
              const next = `${answer.slice(0, s)}    ${answer.slice(end)}`;
              setAnswer(next);
              requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4));
            }
          }}
        />

        <div className="pp-actions">
          <button
            type="button"
            className="pp-btn pp-btn--primary"
            disabled={!canSubmit}
            onClick={() => onSubmit(answer)}
          >
            {busy ? "Grading…" : "Submit answer"}
          </button>
          <button type="button" className="pp-btn pp-btn--ghost" disabled={busy} onClick={onSkip}>
            I don't know, show me
          </button>
          <span className="pp-kbd">Ctrl + Enter to submit</span>
        </div>
      </div>
    </div>
  );
}
