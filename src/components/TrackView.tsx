/* =====================================================================
   TrackView.tsx — one drill track: its progress and its questions.

   App renders this with key={track.id}, so switching tabs unmounts and
   remounts it. That is why useProgress can read localStorage once in its
   initialiser and never worry about the track changing underneath it.
   ===================================================================== */

import { useState } from "react";
import type { Attempt, Screen, TrackDef } from "../types";
import { useProgress } from "../hooks/useProgress";
import { QuestionCard } from "./QuestionCard";
import { ScoreStrip } from "./ScoreStrip";
import { Summary } from "./Summary";

interface TrackViewProps {
  track: TrackDef;
}

export function TrackView({ track }: TrackViewProps) {
  const { progress, record, clear, forget, correctCount, answeredCount } =
    useProgress(track.id, track.seed);

  /* Open on the first question with no attempt recorded, so a seeded
     track picks up where you actually left off. The lazy initialiser
     means this runs once per mount, not on every render. */
  const [screen, setScreen] = useState<Screen>(() => {
    const firstOpen = track.questions.findIndex(
      (_question, index) => progress[index] === undefined,
    );
    return { phase: "drill", index: firstOpen === -1 ? 0 : firstOpen };
  });

  const total = track.questions.length;
  const percent = total === 0 ? 0 : (answeredCount / total) * 100;

  const goTo = (index: number): void => setScreen({ phase: "drill", index });

  const advance = (from: number): void => {
    if (from + 1 >= total) setScreen({ phase: "summary" });
    else goTo(from + 1);
  };

  const missed: number[] = track.questions
    .map((_question, index) => index)
    .filter((index) => {
      const attempt = progress[index];
      return attempt !== undefined && !attempt.correct;
    });

  return (
    <>
      <div className="statusrow">
        <span className="meter__num">
          {correctCount} / {total} right
        </span>
        <div className="meter__track">
          <div className="meter__fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="statusrow__hint">
          {answeredCount === 0
            ? "nothing tried yet"
            : `${answeredCount} attempted`}
        </span>
        <button
          type="button"
          className="iconbtn"
          onClick={() => {
            clear();
            goTo(0);
          }}
        >
          Reset track
        </button>
      </div>

      {/* Narrowing on `phase` — inside this branch TypeScript knows
          `screen.index` exists; in the other branch it knows it does not. */}
      {screen.phase === "drill" ? (
        <QuestionCard
          key={`${track.id}-${screen.index}`}
          question={track.questions[screen.index]!}
          position={screen.index + 1}
          total={total}
          previous={progress[screen.index]}
          isLast={screen.index === total - 1}
          onAnswered={(attempt: Attempt) => record(screen.index, attempt)}
          onNext={() => advance(screen.index)}
        />
      ) : (
        <Summary
          correctCount={correctCount}
          total={total}
          missed={missed}
          onRedoMissed={() => {
            forget(missed);
            goTo(missed[0] ?? 0);
          }}
          onStartOver={() => {
            clear();
            goTo(0);
          }}
        />
      )}

      <ScoreStrip
        total={total}
        current={screen.phase === "drill" ? screen.index : -1}
        progress={progress}
        onJump={goTo}
      />

    </>
  );
}
