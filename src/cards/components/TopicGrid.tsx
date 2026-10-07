import type { Deck } from "../types";

interface TopicGridProps {
  decks: readonly Deck[];
  viewedIn: (subject: string) => number;
  onPick: (subject: string) => void;
}

export function TopicGrid({ decks, viewedIn, onPick }: TopicGridProps) {
  return (
    <div className="topic-grid">
      {decks.map((deck) => {
        const total = deck.cards.length;
        const done = viewedIn(deck.name);
        const pct = total ? (done / total) * 100 : 0;
        return (
          <div
            key={deck.name}
            className="topic-card"
            role="button"
            tabIndex={0}
            onClick={() => onPick(deck.name)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick(deck.name);
              }
            }}
          >
            <div className="topic-card-top">
              <span className="topic-card-icon">{deck.icon}</span>
              <div className="topic-card-info">
                <div className="topic-card-name">{deck.name}</div>
                <div className="topic-card-count">
                  {done} / {total} viewed
                </div>
              </div>
            </div>
            <div className="subject-bar">
              <div className="subject-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
