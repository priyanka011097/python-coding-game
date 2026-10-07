import { useEffect, useRef, useState } from "react";

interface SettingsModalProps {
  name: string;
  /** Closing always commits the name, however the modal is closed. */
  onClose: (name: string) => void;
  onRestart: () => void;
}

export function SettingsModal({ name, onClose, onRestart }: SettingsModalProps) {
  const [draft, setDraft] = useState<string>(name);
  const input = useRef<HTMLInputElement>(null);

  const close = (): void => onClose(draft.trim());

  useEffect(() => {
    const t = window.setTimeout(() => input.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, []);

  /* Escape closes (and saves) from anywhere in the modal, not just the
     input. The listener is re-bound per render so it sees the latest draft. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose(draft.trim());
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [draft, onClose]);

  return (
    <div
      className="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-content" role="dialog" aria-modal="true" aria-label="Settings">
        <h2>Settings</h2>

        <div className="settings-section">
          <label htmlFor="sc-name" className="settings-label">
            Your name
          </label>
          <input
            id="sc-name"
            ref={input}
            className="settings-input"
            type="text"
            placeholder="What should we call you?"
            maxLength={40}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                close();
              }
            }}
          />
          <p className="settings-help">Shown as a greeting on the home screen.</p>
        </div>

        <div className="settings-section">
          <div className="settings-label">Reset progress</div>
          <p className="settings-help">
            Clears all viewed cards, flagged answers, edited answers, and saved positions. Your
            name is kept.
          </p>
          <button type="button" className="danger-btn" onClick={onRestart}>
            Restart Study
          </button>
        </div>

        <button type="button" className="close-btn" onClick={close}>
          Done
        </button>
      </div>
    </div>
  );
}
