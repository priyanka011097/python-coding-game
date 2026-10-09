import { useEffect } from "react";

interface SettingsModalProps {
  onClose: () => void;
  onRestart: () => void;
}

/* Your name comes from your Google account, so the only setting left is
   resetting Study Cards progress. */
export function SettingsModal({ onClose, onRestart }: SettingsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" role="dialog" aria-modal="true" aria-label="Settings">
        <h2>Settings</h2>

        <div className="settings-section">
          <div className="settings-label">Reset progress</div>
          <p className="settings-help">
            Clears all viewed cards, flagged answers, edited answers, and saved positions.
          </p>
          <button type="button" className="danger-btn" onClick={onRestart}>
            Restart Study
          </button>
        </div>

        <button type="button" className="close-btn" onClick={onClose} autoFocus>
          Done
        </button>
      </div>
    </div>
  );
}
