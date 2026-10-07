import type { CardKey, FlagInfo } from "../types";

interface FlaggedModalProps {
  flags: Readonly<Record<CardKey, FlagInfo>>;
  onJump: (subject: string, index: number) => void;
  onRemove: (key: CardKey) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function FlaggedModal({ flags, onJump, onRemove, onClearAll, onClose }: FlaggedModalProps) {
  const entries = Object.entries(flags)
    .map(([key, info]) => ({ key, ...info }))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div
      className="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" role="dialog" aria-modal="true" aria-label="Flagged cards">
        <h2>Flagged as Unclear</h2>
        <p className="modal-subtitle">
          Tap to jump to a card. Tap the trash icon to remove the flag.
        </p>
        <ul className="disliked-list">
          {entries.length === 0 ? (
            <li className="empty">Nothing flagged yet. Tap "Unclear" on a card to mark it.</li>
          ) : (
            entries.map(({ key, subject, index, question }) => (
              <li key={key}>
                <div className="item-text" onClick={() => onJump(subject, index)}>
                  <span className="item-topic">{subject}</span>
                  <div>{question}</div>
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  title="Remove flag"
                  aria-label="Remove flag"
                  onClick={() => onRemove(key)}
                >
                  <svg
                    viewBox="0 0 24 24" width="16" height="16" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="modal-actions">
          <button type="button" className="close-btn danger" onClick={onClearAll}>
            Clear all
          </button>
          <button type="button" className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
