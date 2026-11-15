/* SignInModal.tsx — the one place a guest is asked to sign in: writing
   their own answer on a card. Everything else works without an account. */

import { useEffect } from "react";
import { GoogleButton, signInUrl } from "../../auth/GoogleButton";

interface SignInModalProps {
  /** The deck to come back to after signing in. */
  deck: string;
  onClose: () => void;
}

export function SignInModal({ deck, onClose }: SignInModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content signin-modal" role="dialog" aria-modal="true" aria-label="Sign in to edit answers">
        <h2>✍️ Write your own answer</h2>
        <p className="modal-subtitle">
          Sign in with Google to edit answers in your own words. Your edits, and all your progress so far, are saved to
          your account and follow you to any device.
        </p>
        <div className="signin-modal__actions">
          <GoogleButton href={signInUrl(`/?open=cards&deck=${encodeURIComponent(deck)}`)} />
          <button type="button" className="close-btn" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
