/* Choose what to study, for all three sections in one place. Opened from
   Home; `focus` scrolls straight to one section's group. */

import { useEffect, useRef, useState } from "react";
import type { TrackId } from "../types";
import { TRACKS } from "../data/tracks";
import { DECKS } from "../cards/data/decks";
import { TOPICS } from "../prep/topics";
import type { TopicKind } from "../prep/types";
import type { SubjectChoice } from "./subjects";

export type SubjectSection = "game" | "cards" | "prep";

interface SubjectsModalProps {
  initial: SubjectChoice;
  focus?: SubjectSection;
  onSave: (choice: SubjectChoice) => void;
  onClose: () => void;
}

const PREP_GROUPS: readonly { kind: TopicKind; title: string }[] = [
  { kind: "fundamentals", title: "Core CS" },
  { kind: "language", title: "Languages & frameworks" },
  { kind: "database", title: "Databases" },
];

function useToggleSet<T>(initial: readonly T[]) {
  const [set, setSet] = useState<Set<T>>(() => new Set(initial));
  const toggle = (v: T): void =>
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  return [set, toggle, setSet] as const;
}

export function SubjectsModal({ initial, focus, onSave, onClose }: SubjectsModalProps) {
  const [tracks, toggleTrack] = useToggleSet<TrackId>(initial.tracks);
  const [decks, toggleDeck, setDecks] = useToggleSet<string>(initial.decks);
  const [topics, toggleTopic] = useToggleSet<string>(initial.prepTopics);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focus) body.current?.querySelector(`[data-group="${focus}"]`)?.scrollIntoView({ block: "start" });
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focus, onClose]);

  const total = tracks.size + decks.size + topics.size;

  return (
    <div
      className="hm-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hm-modal__box" role="dialog" aria-modal="true" aria-label="Choose your subjects">
        <div className="hm-modal__head">
          <h2>Choose your subjects</h2>
          <p>Pick what your next interview is about. Home shows progress for these only, and you can change them any time.</p>
        </div>

        <div className="hm-modal__body" ref={body}>
          <section data-group="game">
            <h3>⌨️ Coding Game tracks</h3>
            <div className="hm-pick">
              {TRACKS.map((t) => (
                <label key={t.id} className={`hm-pick__item${tracks.has(t.id) ? " hm-pick__item--on" : ""}`}>
                  <input type="checkbox" checked={tracks.has(t.id)} onChange={() => toggleTrack(t.id)} />
                  <span>{t.label}</span>
                  <small>{t.questions.length} questions</small>
                </label>
              ))}
            </div>
          </section>

          <section data-group="cards">
            <h3>
              🗂️ Study Cards decks
              <button type="button" className="hm-link" onClick={() => setDecks(new Set(DECKS.map((d) => d.name)))}>
                Select all
              </button>
            </h3>
            <div className="hm-pick">
              {DECKS.map((d) => (
                <label key={d.name} className={`hm-pick__item${decks.has(d.name) ? " hm-pick__item--on" : ""}`}>
                  <input type="checkbox" checked={decks.has(d.name)} onChange={() => toggleDeck(d.name)} />
                  <span>
                    <span aria-hidden="true">{d.icon}</span> {d.name}
                  </span>
                  <small>{d.cards.length} cards</small>
                </label>
              ))}
            </div>
          </section>

          <section data-group="prep">
            <h3>🎙️ Interview Prep topics</h3>
            {PREP_GROUPS.map((g) => (
              <div key={g.kind} className="hm-chips-group">
                <span className="hm-chips-group__title">{g.title}</span>
                <div className="hm-chips">
                  {TOPICS.filter((t) => t.kind === g.kind).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={topics.has(t.id)}
                      className={`hm-chip${topics.has(t.id) ? " hm-chip--on" : ""}`}
                      onClick={() => toggleTopic(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className="hm-modal__foot">
          <span className="hm-muted">
            {tracks.size} tracks · {decks.size} decks · {topics.size} topics
          </span>
          <button type="button" className="hm-btn hm-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="hm-btn"
            disabled={total === 0}
            onClick={() => onSave({ tracks: [...tracks], decks: [...decks], prepTopics: [...topics] })}
          >
            {total === 0 ? "Choose at least one" : "Save subjects"}
          </button>
        </div>
      </div>
    </div>
  );
}
