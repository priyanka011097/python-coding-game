import { useEffect, useRef, useState } from "react";
import type { PrepQuestion } from "../types";
import { LEVEL_NAMES, topicLabel } from "../topics";
import { SpokenQuestion } from "./SpokenQuestion";
import { useDictation } from "../useDictation";

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

  /* Each spoken phrase is appended to whatever is already typed, with a
     space between, so typing and talking can be mixed freely. */
  const dictation = useDictation((spoken) =>
    setAnswer((prev) => (prev === "" || /\s$/.test(prev) ? prev + spoken : `${prev} ${spoken}`)),
  );

  useEffect(() => {
    box.current?.focus();
  }, []);

  /* Words still being recognised count too, so stopping mid-sentence and
     submitting straight away does not drop the last few words. */
  const fullAnswer = dictation.interim
    ? `${answer}${answer === "" || /\s$/.test(answer) ? "" : " "}${dictation.interim}`
    : answer;
  const canSubmit = fullAnswer.trim() !== "" && !busy;

  const submit = (): void => {
    dictation.stop();
    onSubmit(fullAnswer);
  };

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
        <SpokenQuestion question={question} />

        {question.hint &&
          (hint ? (
            <p className="pp-hint">💡 {question.hint}</p>
          ) : (
            <button type="button" className="pp-link" onClick={() => setHint(true)}>
              Show a hint
            </button>
          ))}

        <div className="pp-answer-head">
          <label htmlFor="pp-answer" className="pp-label">
            Your answer
          </label>
          {dictation.supported && (
            <button
              type="button"
              className={`pp-mic${dictation.listening ? " pp-mic--on" : ""}`}
              aria-pressed={dictation.listening}
              aria-label={dictation.listening ? "Stop voice input" : "Speak your answer"}
              title={dictation.listening ? "Stop listening" : "Speak your answer (voice to text)"}
              disabled={busy}
              onClick={dictation.toggle}
            >
              <span aria-hidden="true">{dictation.listening ? "●" : "🎤"}</span>
              {dictation.listening ? "Listening… tap to stop" : "Speak"}
            </button>
          )}
        </div>
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
              submit();
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
        {dictation.listening && (
          <p className="pp-interim" aria-live="polite">
            {dictation.interim || "Listening… start speaking."}
          </p>
        )}
        {dictation.error && (
          <p className="pp-error pp-error--inline" role="alert">
            {dictation.error}
          </p>
        )}

        <div className="pp-actions">
          <button
            type="button"
            className="pp-btn pp-btn--primary"
            disabled={!canSubmit}
            onClick={submit}
          >
            {busy ? "Grading…" : "Submit answer"}
          </button>
          <button
            type="button"
            className="pp-btn pp-btn--ghost"
            disabled={busy}
            onClick={() => {
              dictation.stop();
              onSkip();
            }}
          >
            I don't know, show me
          </button>
          <span className="pp-kbd">Ctrl + Enter to submit</span>
        </div>
      </div>
    </div>
  );
}
