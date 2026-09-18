/* =====================================================================
   QuestionCard.tsx — one question, its input, and its verdict.

   This is the component an interviewer would ask you to write: props
   typed by an interface, local state typed with useState<T>, an event
   handler, and a callback prop fired back to the parent.
   ===================================================================== */

import { useEffect, useRef, useState } from "react";
import type { Attempt, Question } from "../types";
import { isCorrect, shapeHint } from "../lib/checkAnswer";
import { CodeBlank } from "./CodeBlank";
import type { BlankStatus } from "./CodeBlank";
import { Verdict } from "./Verdict";
import type { VerdictOutcome } from "./Verdict";

/** "pending" means the question is still open. The other three come
 *  straight from VerdictOutcome, so the two files cannot drift apart. */
type CardState = "pending" | VerdictOutcome;

/** How long the tick stays on screen before a correct answer advances.
 *  Long enough to register, short enough not to feel like waiting. */
const ADVANCE_MS = 550;

interface QuestionCardProps {
  question: Question;
  position: number;
  total: number;
  /** Whatever was typed last time, if this question was already tried. */
  previous?: Attempt;
  onAnswered: (attempt: Attempt) => void;
  onNext: () => void;
  isLast: boolean;
}

/** Maps card state to the styling the blank should use. `Record` with a
 *  union key forces every case to be handled — add a state and this
 *  object stops compiling until you fill it in. */
const BLANK_STATUS: Record<CardState, BlankStatus> = {
  pending: "idle",
  pass: "correct",
  fail: "wrong",
  shown: "shown",
};

export function QuestionCard({
  question,
  position,
  total,
  previous,
  onAnswered,
  onNext,
  isLast,
}: QuestionCardProps) {
  const [value, setValue] = useState<string>(previous?.answer ?? "");
  const [state, setState] = useState<CardState>("pending");
  const [hintShown, setHintShown] = useState<boolean>(false);

  /* A correct answer advances on its own after a beat, so the tick is
     visible without costing a click. The handle lives in a ref because
     it must survive re-renders without causing one, and it has to be
     cancellable — leaving a timer running after this card has gone
     would advance the NEXT question out from under you. */
  const advanceTimer = useRef<number | undefined>(undefined);

  /* What was typed last time, held in a ref so the reset effect can read
     it without depending on it. */
  const previousAnswer = useRef<string>(previous?.answer ?? "");

  const cancelAdvance = (): void => {
    if (advanceTimer.current !== undefined) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = undefined;
    }
  };

  /* Reset everything when the parent swaps in a different question, and
     on unmount. The cleanup is what makes Skip and Reset safe mid-timer.

     `previous` is deliberately NOT a dependency. Submitting calls
     onAnswered, which writes a new progress object upstream, so
     `previous` arrives as a fresh identity on the very next render — as
     a dep it would run this cleanup and cancel the advance timer we
     just set, then reset the card to "pending", throwing away both the
     tick and the verdict. Its value is only ever needed as a starting
     point, and useState's initialiser already took it. */
  useEffect(() => {
    setValue(previousAnswer.current);
    setState("pending");
    setHintShown(false);
    return cancelAdvance;
  }, [question.id]);

  const answer = question.accepted[0] ?? "";
  const resolved = state !== "pending";

  const submit = (): void => {
    if (resolved) {
      // Pressing Enter again during the pause just goes now.
      cancelAdvance();
      onNext();
      return;
    }
    if (value.trim() === "") return;

    const correct = isCorrect(value, question.accepted);
    setState(correct ? "pass" : "fail");
    onAnswered({ answer: value, correct });

    /* Right: show the green blank, then move on by itself. Wrong or
       revealed: stay put, because that is where the explanation is. */
    if (correct) {
      advanceTimer.current = window.setTimeout(onNext, ADVANCE_MS);
    }
  };

  /* Showing the answer deliberately does NOT call onAnswered — peeking
     should not count for or against you in the score. */
  const reveal = (): void => {
    cancelAdvance();
    setValue(answer);
    setState("shown");
  };

  return (
    <article className="card">
      <div className="card__top">
        <span className="chip chip--topic">{question.topic}</span>
        {question.flagged && (
          <span className="chip chip--flag">you missed this before</span>
        )}
        <span className="qno">
          {String(position).padStart(2, "0")} / {total}
        </span>
      </div>

      <div className="card__body">
        {/* The link back to the previous question. Optional, so it is
            rendered with && rather than a ternary — there is nothing
            sensible to show in its place. */}
        {question.bridge && (
          <p
            className="bridge"
            dangerouslySetInnerHTML={{ __html: question.bridge }}
          />
        )}

        <p className="ask" dangerouslySetInnerHTML={{ __html: question.ask }} />

        <CodeBlank
          code={question.code}
          value={value}
          status={BLANK_STATUS[state]}
          disabled={resolved}
          onChange={setValue}
          onSubmit={submit}
        />

        {/* The idea, shown BEFORE the answer: teach, then ask. The
            explanation in <Verdict> comes after and does the opposite
            job — it says what the answer proved. */}
        {question.concept && (
          <div className="conceptbox">
            <span className="conceptbox__label">Concept</span>
            <p dangerouslySetInnerHTML={{ __html: question.concept }} />
          </div>
        )}

        <div className="actions">
          <button type="button" className="primary" onClick={submit}>
            {!resolved ? "Check" : isLast ? "Finish" : "Next question"}
          </button>

          {!resolved && (
            <>
              <button
                type="button"
                className="ghost"
                onClick={() => setHintShown(true)}
              >
                Hint
              </button>
              <button type="button" className="ghost" onClick={reveal}>
                Show answer
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  cancelAdvance();
                  onNext();
                }}
              >
                Skip
              </button>
              <span className="kbd">Enter to check</span>
            </>
          )}
        </div>

        {hintShown && !resolved && (
          <div className="hintbox">
            <strong>Shape of the answer:</strong> <code>{shapeHint(answer)}</code>
            {" — "}
            {answer.includes("|")
              ? "it is a union, so it needs a | with both sides written out."
              : answer.includes("=>")
                ? "it is a function type, so it needs (…) => and a return type."
                : "a single type name, nothing more."}
          </div>
        )}
      </div>

      {state === "pass" && (
        <div className="movingon" role="status">
          <span className="movingon__mark">&#10003;</span> Correct — next
          question&#8230;
        </div>
      )}

      {(state === "fail" || state === "shown") && (
        <Verdict outcome={state} answer={answer} why={question.why} />
      )}
    </article>
  );
}
