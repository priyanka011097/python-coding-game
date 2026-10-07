/* =====================================================================
   useSpeech.ts — read an answer aloud, at an adjustable speed.
   ===================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import { KEYS, loadNumber, saveString } from "../storage";

export const READ_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type ReadSpeed = (typeof READ_SPEEDS)[number];

const isReadSpeed = (n: number): n is ReadSpeed =>
  (READ_SPEEDS as readonly number[]).includes(n);

/** Code blocks read aloud are noise, so each one becomes a pause. */
const toSpeech = (answer: string): string =>
  answer.replace(/~~~[\s\S]*?~~~/g, ". ").replace(/\s+/g, " ").trim();

export interface UseSpeech {
  speaking: boolean;
  speed: ReadSpeed;
  /** Starts reading, or stops if something is already being read. */
  toggle: (text: string) => void;
  stop: () => void;
  /** Steps the speed; restarts the current reading at the new rate. */
  step: (direction: -1 | 1, text: string) => void;
}

export function useSpeech(): UseSpeech {
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [speed, setSpeed] = useState<ReadSpeed>(() => {
    const saved = loadNumber(KEYS.readSpeed, 1);
    return isReadSpeed(saved) ? saved : 1;
  });

  /* Cancelling fires `onend`/`onerror` on the old utterance a moment
     later. Remembering the current one means a stale event cannot switch
     off the indicator for a reading that has just been restarted. */
  const current = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback((): void => {
    current.current = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, rate: ReadSpeed): void => {
    const speech = toSpeech(text);
    if (!speech) return;
    const u = new SpeechSynthesisUtterance(speech);
    u.rate = rate;
    u.pitch = 1;
    u.lang = "en-US";
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
  }, []);

  const toggle = useCallback(
    (text: string): void => {
      if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
        window.alert("Sorry, your browser does not support text-to-speech.");
        return;
      }
      if (window.speechSynthesis.speaking) {
        stop();
        return;
      }
      speak(text, speed);
    },
    [speak, speed, stop],
  );

  const step = useCallback(
    (direction: -1 | 1, text: string): void => {
      const next = READ_SPEEDS[READ_SPEEDS.indexOf(speed) + direction];
      if (next === undefined) return;
      setSpeed(next);
      saveString(KEYS.readSpeed, String(next));
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        stop();
        speak(text, next);
      }
    },
    [speak, speed, stop],
  );

  // Leaving the cards mode must not leave a voice talking.
  useEffect(() => stop, [stop]);

  return { speaking, speed, toggle, stop, step };
}
