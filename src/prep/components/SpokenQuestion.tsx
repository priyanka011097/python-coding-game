/* =====================================================================
   SpokenQuestion.tsx — a question's title and text. When the question is
   longer than five words, clicking it (or the 🔊 button) reads it aloud;
   clicking again stops.
   ===================================================================== */

import type { PrepQuestion } from "../types";
import { MIN_WORDS_TO_READ, useReadAloud, wordCount } from "../useReadAloud";
import { RichText } from "./RichText";

export function SpokenQuestion({ question }: { question: PrepQuestion }) {
  const speech = useReadAloud();
  const readable = speech.supported && wordCount(question.question) >= MIN_WORDS_TO_READ;
  const listen = (): void => speech.toggle(`${question.title}. ${question.question}`);

  if (!readable) {
    return (
      <>
        <h2 className="pp-title">{question.title}</h2>
        <RichText text={question.question} />
      </>
    );
  }

  return (
    <>
      <div className="pp-title-row">
        <h2 className="pp-title">{question.title}</h2>
        <button
          type="button"
          className={`pp-speak${speech.speaking ? " pp-speak--on" : ""}`}
          aria-pressed={speech.speaking}
          aria-label={speech.speaking ? "Stop reading the question" : "Read the question aloud"}
          title={speech.speaking ? "Stop" : "Listen to the question"}
          onClick={listen}
        >
          <span aria-hidden="true">{speech.speaking ? "⏹" : "🔊"}</span>
          {speech.speaking ? "Stop" : "Listen"}
        </button>
      </div>
      <div
        className={`pp-spoken${speech.speaking ? " pp-spoken--on" : ""}`}
        title={speech.speaking ? "Click to stop" : "Click to listen"}
        onClick={() => {
          // Selecting text to copy it should not start the voice.
          if (window.getSelection()?.toString()) return;
          listen();
        }}
      >
        <RichText text={question.question} />
      </div>
    </>
  );
}
