/* =====================================================================
   Flashcard.tsx — one card: question, answer, and the answer toolbar
   (read aloud, speed, edit, flag).

   CardsMode renders this with a key that changes on every navigation, so
   moving to another card remounts it: edit mode closes, the slide-in
   animation replays, and the answer scrolls back to the top — all for free.
   ===================================================================== */

import { useEffect, useRef, useState } from "react";
import type { Flashcard as FlashcardData } from "../types";
import type { UseSpeech } from "../hooks/useSpeech";
import { READ_SPEEDS } from "../hooks/useSpeech";
import { AnswerText } from "./AnswerText";

interface FlashcardProps {
  card: FlashcardData;
  /** The user's edited answer if there is one, else the original. */
  answer: string;
  edited: boolean;
  flagged: boolean;
  speech: UseSpeech;
  onToggleFlag: () => void;
  /** `null` drops the edit and restores the original answer. */
  onSaveEdit: (text: string | null) => void;
}

const formatSpeed = (s: number): string => `${s}x`;

export function Flashcard({
  card, answer, edited, flagged, speech, onToggleFlag, onSaveEdit,
}: FlashcardProps) {
  const [editing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>("");
  /* Bumped on every new flag so the heartbreak element remounts and its
     animation plays again. */
  const [heartbreak, setHeartbreak] = useState<number>(0);
  const answerRef = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (answerRef.current) answerRef.current.scrollTop = 0;
  }, [answer]);

  useEffect(() => {
    if (editing) textarea.current?.focus();
  }, [editing]);

  const startEdit = (): void => {
    setDraft(answer);
    setEditing(true);
  };

  const save = (): void => {
    const text = draft.trim();
    if (!text) return;
    onSaveEdit(text === card.a ? null : text);
    setEditing(false);
  };

  const flag = (): void => {
    if (!flagged) setHeartbreak((n) => n + 1);
    onToggleFlag();
  };

  const speedIndex = READ_SPEEDS.indexOf(speech.speed);

  return (
    <div className="flashcard">
      <div className="card-face">
        <div className="label">Question</div>
        <div className="question">{card.q}</div>
        <div className="divider" />
        <div className="answer-header">
          <div className="answer-label-group">
            <div className="label">Answer</div>
            {edited && !editing && <span className="edited-badge">✨ your version</span>}
          </div>
          <div className="answer-actions">
            <button
              type="button"
              className={`read-btn${speech.speaking ? " active" : ""}`}
              title="Read answer aloud"
              aria-label="Read aloud"
              onClick={() => speech.toggle(answer)}
            >
              <span aria-hidden="true">🔊</span>
            </button>
            <div className="speed-group" role="group" aria-label="Reading speed">
              <button
                type="button"
                className="speed-step"
                title="Slower"
                aria-label="Slower"
                disabled={speedIndex <= 0}
                onClick={() => speech.step(-1, answer)}
              >
                −
              </button>
              <span className="speed-display">{formatSpeed(speech.speed)}</span>
              <button
                type="button"
                className="speed-step"
                title="Faster"
                aria-label="Faster"
                disabled={speedIndex >= READ_SPEEDS.length - 1}
                onClick={() => speech.step(1, answer)}
              >
                +
              </button>
            </div>
            <button
              type="button"
              className={`edit-btn${edited ? " has-edit" : ""}`}
              title="Edit this answer"
              aria-label="Edit answer"
              onClick={startEdit}
            >
              <span aria-hidden="true">✏️</span>
            </button>
            <button
              type="button"
              className={`dislike-btn${flagged ? " active" : ""}`}
              title={flagged ? "Flagged as unclear — tap to remove flag" : "Mark this answer as unclear"}
              onClick={flag}
            >
              <span className="dislike-icon" aria-hidden="true">👎</span>
              {heartbreak > 0 && (
                <span key={heartbreak} className="heartbreak animate" aria-hidden="true">
                  💔
                </span>
              )}
            </button>
          </div>
        </div>

        {editing ? (
          <div className="answer-editor">
            <textarea
              ref={textarea}
              className="answer-textarea"
              rows={6}
              spellCheck
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <div className="editor-actions">
              {edited && (
                <button
                  type="button"
                  className="editor-btn is-ghost"
                  onClick={() => {
                    onSaveEdit(null);
                    setEditing(false);
                  }}
                >
                  Reset to original
                </button>
              )}
              <div className="editor-spacer" />
              <button type="button" className="editor-btn is-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="button" className="editor-btn is-primary" onClick={save}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <AnswerText ref={answerRef} text={answer} />
        )}
      </div>
    </div>
  );
}
