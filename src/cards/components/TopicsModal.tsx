/* Choose which decks to study. Only the chosen decks appear on the Study
   Cards home and count towards progress on the Home dashboard. Progress in
   an unchosen deck is kept, and comes back if the deck is chosen again. */

import { useEffect, useState } from "react";
import type { Deck } from "../types";

interface TopicsModalProps {
  decks: readonly Deck[];
  chosen: readonly string[];
  viewedIn: (deck: string) => number;
  onSave: (names: string[]) => void;
  onClose: () => void;
}

export function TopicsModal({ decks, chosen, viewedIn, onSave, onClose }: TopicsModalProps) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(chosen));

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (name: string): void =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const cards = decks.filter((d) => picked.has(d.name)).reduce((n, d) => n + d.cards.length, 0);

  return (
    <div
      className="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" role="dialog" aria-modal="true" aria-label="Choose topics">
        <h2>Choose topics</h2>
        <p className="modal-subtitle">
          Pick what you are studying. Only these decks show here and on your Home dashboard. Progress in
          other decks is kept.
        </p>

        <div className="topics-quick">
          <button type="button" className="topics-link" onClick={() => setPicked(new Set(decks.map((d) => d.name)))}>
            Select all
          </button>
          <button type="button" className="topics-link" onClick={() => setPicked(new Set())}>
            Clear
          </button>
          <span className="topics-count">
            {picked.size} of {decks.length} decks · {cards.toLocaleString()} cards
          </span>
        </div>

        <ul className="topics-list">
          {decks.map((d) => {
            const on = picked.has(d.name);
            return (
              <li key={d.name}>
                <label className={`topics-item${on ? " topics-item--on" : ""}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(d.name)} />
                  <span className="topics-item__icon" aria-hidden="true">{d.icon}</span>
                  <span className="topics-item__name">{d.name}</span>
                  <span className="topics-item__count">
                    {viewedIn(d.name)}/{d.cards.length}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="modal-actions">
          <button type="button" className="close-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="close-btn topics-save"
            disabled={picked.size === 0}
            title={picked.size === 0 ? "Choose at least one deck" : undefined}
            onClick={() => onSave(decks.filter((d) => picked.has(d.name)).map((d) => d.name))}
          >
            {picked.size === 0 ? "Choose at least one" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
