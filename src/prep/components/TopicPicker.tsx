import { useState } from "react";
import type { Level, TopicKind } from "../types";
import { START_LEVELS, TOPICS } from "../topics";

interface TopicPickerProps {
  initial: readonly string[];
  busy: boolean;
  /** Shown right under the Start button, where the user is looking. */
  error: string | null;
  onStart: (topicIds: string[], startLevel: Level) => void;
}

const GROUPS: readonly { kind: TopicKind; title: string }[] = [
  { kind: "fundamentals", title: "Core CS" },
  { kind: "language", title: "Languages & frameworks" },
  { kind: "database", title: "Databases" },
];

export function TopicPicker({ initial, busy, error, onStart }: TopicPickerProps) {
  const [selected, setSelected] = useState<string[]>([...initial]);
  const [startLevel, setStartLevel] = useState<Level>(1);

  const toggle = (id: string): void =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="pp-card pp-setup">
      <h2 className="pp-h2">What is your next interview on?</h2>
      <p className="pp-muted">
        Pick one or more. You get one question at a time, starting simple and getting harder as
        you answer well. Topics take turns.
      </p>

      {GROUPS.map((group) => (
        <section key={group.kind} className="pp-group">
          <h3 className="pp-label">{group.title}</h3>
          <div className="pp-chips">
            {TOPICS.filter((t) => t.kind === group.kind).map((t) => {
              const on = selected.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  className={`pp-chip${on ? " pp-chip--on" : ""}`}
                  onClick={() => toggle(t.id)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <section className="pp-group">
        <h3 className="pp-label">Your experience (sets the starting difficulty for new topics)</h3>
        <div className="pp-seg" role="radiogroup" aria-label="Starting difficulty">
          {START_LEVELS.map((s) => (
            <button
              key={s.level}
              type="button"
              role="radio"
              aria-checked={startLevel === s.level}
              className={`pp-seg__btn${startLevel === s.level ? " pp-seg__btn--on" : ""}`}
              onClick={() => setStartLevel(s.level)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <div className="pp-actions">
        <button
          type="button"
          className="pp-btn pp-btn--primary"
          disabled={selected.length === 0 || busy}
          onClick={() => onStart(selected, startLevel)}
        >
          {busy ? "Preparing your first question…" : `Start interview prep (${selected.length})`}
        </button>
      </div>
      {error && (
        <p className="pp-error pp-error--inline" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
