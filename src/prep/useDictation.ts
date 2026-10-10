/* =====================================================================
   useDictation.ts — speech-to-text for the answer box, using the
   browser's Web Speech API (Chrome, Edge; partially Safari).

   Recognised phrases are handed to `onFinal` as they settle; the words
   still being worked out are exposed as `interim` for a live preview.
   ===================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";

/* The Web Speech recognition API is not in TypeScript's DOM lib, so the
   small part used here is typed by hand. */
interface RecognitionAlternative { transcript: string }
interface RecognitionResult { readonly isFinal: boolean; readonly 0: RecognitionAlternative }
interface RecognitionEvent { readonly resultIndex: number; readonly results: ArrayLike<RecognitionResult> }
interface RecognitionErrorEvent { readonly error: string }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in the browser's address bar, then try again.",
  "service-not-allowed": "Speech recognition is not allowed here. It needs localhost or an https:// address.",
  "audio-capture": "No microphone was found.",
  network: "The browser's speech service could not be reached. Check your internet connection.",
};

/* Phones run recognition one phrase at a time: Android Chrome's
   continuous mode re-sends earlier words inside every new result. */
const IS_MOBILE = typeof navigator !== "undefined" && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

const norm = (t: string): string =>
  t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();

/** The words in `next` that were not already committed as `prev`.
 *  Browsers often re-send a finished phrase, or send it again with more
 *  words on the end ("hello" -> "hello world"); only the new part counts. */
export function newWords(prev: string, next: string): string {
  const p = norm(prev);
  const n = norm(next);
  if (!n || n === p) return "";
  if (p && n.startsWith(p + " ")) {
    // Drop as many leading words of `next` as `prev` had.
    return next.trim().split(/\s+/).slice(p.split(" ").length).join(" ");
  }
  return next.trim();
}

export interface UseDictation {
  supported: boolean;
  listening: boolean;
  interim: string;
  error: string | null;
  toggle: () => void;
  stop: () => void;
}

export function useDictation(onFinal: (text: string) => void): UseDictation {
  const Ctor = recognitionCtor();
  const [listening, setListening] = useState<boolean>(false);
  const [interim, setInterim] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  /* Chrome ends a session after a pause in speech. While the user still
     has the mic on, it is quietly restarted. */
  const wanted = useRef<boolean>(false);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  /** The last phrase committed in this listening run, for de-duplication. */
  const lastFinal = useRef<string>("");

  const stop = useCallback((): void => {
    wanted.current = false;
    rec.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback((): void => {
    if (!Ctor) return;
    // Do not transcribe the question being read aloud.
    window.speechSynthesis?.cancel();
    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = !IS_MOBILE;
    r.interimResults = true;
    lastFinal.current = "";
    /* Which results of the current session are already committed. The
       whole list is re-scanned on every event (some browsers report
       resultIndex 0 each time), so this is what stops a phrase being
       typed again on every update. */
    let committed = new Set<number>();
    r.onresult = (e) => {
      let pending = "";
      for (let i = 0; i < e.results.length; i += 1) {
        const result = e.results[i]!;
        const text = result[0].transcript;
        if (result.isFinal) {
          if (committed.has(i)) continue;
          committed.add(i);
          const fresh = newWords(lastFinal.current, text);
          if (text.trim()) lastFinal.current = text.trim();
          if (fresh) onFinalRef.current(fresh);
        } else {
          pending += text;
        }
      }
      // Live preview of words not committed yet, minus any repeat.
      setInterim(newWords(lastFinal.current, pending));
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      wanted.current = false;
      setError(ERRORS[e.error] ?? `Voice input failed (${e.error}).`);
    };
    r.onend = () => {
      setInterim("");
      if (wanted.current) {
        try {
          committed = new Set(); // a new session numbers its results from 0
          r.start();
          return;
        } catch {
          wanted.current = false;
        }
      }
      setListening(false);
    };
    rec.current = r;
    wanted.current = true;
    setError(null);
    try {
      r.start();
      setListening(true);
    } catch {
      wanted.current = false;
      setError("Could not start the microphone.");
    }
  }, [Ctor]);

  const toggle = useCallback((): void => {
    if (wanted.current) stop();
    else start();
  }, [start, stop]);

  // Leaving the question turns the mic off.
  useEffect(
    () => () => {
      wanted.current = false;
      rec.current?.abort();
    },
    [],
  );

  return { supported: Ctor !== null, listening, interim, error, toggle, stop };
}
