/* =====================================================================
   useReadAloud.ts — speaks a question using the browser's built-in
   text-to-speech. No network call and no API key.
   ===================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";

/** Questions shorter than this are quicker to read than to listen to. */
export const MIN_WORDS_TO_READ = 6;

/** Turns model markdown into something worth hearing: code blocks are
 *  announced rather than spelled out, and markup characters dropped. */
export function toSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ". The code is shown on screen. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    // "target. . The code…" -> "target. The code…"
    .replace(/([.!?:])(\s*\.)+/g, "$1")
    .trim();
}

/** Words in the question itself; code blocks do not count. */
export const wordCount = (text: string): number =>
  toSpeech(text.replace(/```[\s\S]*?```/g, " "))
    .split(" ")
    .filter((w) => /[A-Za-z0-9]/.test(w)).length;

export interface UseReadAloud {
  supported: boolean;
  speaking: boolean;
  toggle: (text: string) => void;
  stop: () => void;
}

export function useReadAloud(): UseReadAloud {
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined";
  const [speaking, setSpeaking] = useState<boolean>(false);
  /* cancel() fires onend on the old utterance a moment later; tracking the
     current one stops that stale event from resetting a fresh reading. */
  const current = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback((): void => {
    current.current = null;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const toggle = useCallback(
    (text: string): void => {
      if (!supported) return;
      if (current.current) {
        stop();
        return;
      }
      const speech = toSpeech(text);
      if (!speech) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(speech);
      u.lang = "en-US";
      u.rate = 1;
      const done = (): void => {
        if (current.current === u) {
          current.current = null;
          setSpeaking(false);
        }
      };
      u.onend = done;
      u.onerror = done;
      current.current = u;
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [stop, supported],
  );

  // Moving to another question (or another mode) silences the old one.
  useEffect(() => stop, [stop]);

  return { supported, speaking, toggle, stop };
}
