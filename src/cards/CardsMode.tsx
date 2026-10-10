/* =====================================================================
   CardsMode.tsx — the Study Cards mode: a topic grid, then one flashcard
   at a time.

   Owns every piece of flashcard state and its persistence. The children
   are presentational and report back through callbacks.
   ===================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CardKey, CardsModal, CardsScreen, FlagInfo } from "./types";
import { DECKS, DECK_BY_NAME, cardCount, chosenDecks } from "./data/decks";
import {
  KEYS, cardKey, loadJSON, loadString, removeKeys, saveJSON, saveString,
} from "./storage";
import { useSpeech } from "./hooks/useSpeech";
import { bumpDuck, resetDuck } from "../duck/duckBus";
import { Flashcard } from "./components/Flashcard";
import { FlaggedModal } from "./components/FlaggedModal";
import { ProgressBar } from "./components/ProgressBar";
import { SettingsModal } from "./components/SettingsModal";
import { TopicGrid } from "./components/TopicGrid";
import { TopicsModal } from "./components/TopicsModal";
import "./cards.css";

type Flags = Record<CardKey, FlagInfo>;
type Viewed = Record<CardKey, 1>;
type Edits = Record<CardKey, string>;
type LastIndex = Record<string, number>;

/** State that is read once from storage and written back on every change. */
function useStored<T extends object>(key: string): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => loadJSON<T>(key));
  useEffect(() => saveJSON(key, value), [key, value]);
  return [value, setValue];
}

const FIRST_DECK = DECKS[0]!;

interface CardsModeProps {
  /** Open straight onto this deck (at its saved position), e.g. from Home. */
  openDeck?: string;
  /** The signed-in user's first name, for the greeting. */
  firstName?: string;
}

export function CardsMode({ openDeck, firstName }: CardsModeProps = {}) {
  const [screen, setScreen] = useState<CardsScreen>("home");
  const [subject, setSubject] = useState<string>(FIRST_DECK.name);
  const [index, setIndex] = useState<number>(0);
  /* Bumped on every navigation, even back to the same card, so the card
     remounts and its slide-in animation replays. */
  const [visit, setVisit] = useState<number>(0);
  const [modal, setModal] = useState<CardsModal>("none");
  /* From the Google account; the old "Your name" setting is gone. */
  const name = firstName?.trim() ?? "";

  const [flags, setFlags] = useStored<Flags>(KEYS.flags);
  const [viewed, setViewed] = useStored<Viewed>(KEYS.viewed);
  const [edits, setEdits] = useStored<Edits>(KEYS.edits);
  const [lastIndex, setLastIndex] = useStored<LastIndex>(KEYS.lastIndex);
  /* The decks this user chose to study (all of them until they choose). */
  const [chosen, setChosen] = useState<readonly string[]>(() =>
    chosenDecks(loadString(KEYS.decks) || null).map((d) => d.name),
  );
  const myDecks = DECKS.filter((d) => chosen.includes(d.name));
  const myTotal = cardCount(myDecks);

  const speech = useSpeech();
  const stopSpeech = speech.stop;

  const deck = DECK_BY_NAME.get(subject) ?? FIRST_DECK;
  const card = deck.cards[index] ?? deck.cards[0]!;
  const key = cardKey(subject, index);
  const answer = edits[key] ?? card.a;

  // Only cards in the chosen decks count towards "viewed".
  const viewedCount = Object.keys(viewed).filter((k) => chosen.includes(k.slice(0, k.lastIndexOf("::")))).length;
  const flagCount = Object.keys(flags).length;

  const viewedIn = (s: string): number => {
    const prefix = `${s}::`;
    return Object.keys(viewed).filter((k) => k.startsWith(prefix)).length;
  };

  // Landing on a card marks it viewed and remembers it as the deck's place.
  useEffect(() => {
    if (screen !== "card") return;
    const k = cardKey(subject, index);
    setViewed((prev) => (prev[k] ? prev : { ...prev, [k]: 1 }));
    setLastIndex((prev) => (prev[subject] === index ? prev : { ...prev, [subject]: index }));
  }, [screen, subject, index, visit, setViewed, setLastIndex]);

  const open = useCallback(
    (nextSubject: string, nextIndex: number, bump: boolean): void => {
      stopSpeech();
      setSubject(nextSubject);
      setIndex(nextIndex);
      setVisit((v) => v + 1);
      setScreen("card");
      if (bump) bumpDuck();
    },
    [stopSpeech],
  );

  const pickTopic = (s: string): void => {
    const saved = lastIndex[s];
    const size = DECK_BY_NAME.get(s)?.cards.length ?? 0;
    const start = typeof saved === "number" && saved >= 0 && saved < size ? saved : 0;
    open(s, start, s !== subject);
  };

  /* Once per mount. The ref stops StrictMode's double effect run from
     counting two navigations (which would trigger the duck). */
  const openedDeck = useRef<boolean>(false);
  useEffect(() => {
    if (openedDeck.current || !openDeck || !DECK_BY_NAME.has(openDeck)) return;
    openedDeck.current = true;
    pickTopic(openDeck);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const step = useCallback(
    (direction: -1 | 1): void => {
      const n = deck.cards.length;
      open(subject, (index + direction + n) % n, true);
    },
    [deck, index, open, subject],
  );

  const goHome = (): void => {
    stopSpeech();
    setScreen("home");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const toggleFlag = useCallback((): void => {
    setFlags((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { subject, index, question: card.q, timestamp: Date.now() };
      return next;
    });
  }, [card, index, key, setFlags, subject]);

  const removeFlag = (k: CardKey): void =>
    setFlags((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });

  const clearFlags = (): void => {
    if (window.confirm("Remove all unclear flags?")) setFlags({});
  };

  const jumpToFlag = (s: string, i: number): void => {
    const target = DECK_BY_NAME.get(s);
    if (!target || i < 0 || i >= target.cards.length) return;
    setModal("none");
    open(s, i, true);
  };

  const saveEdit = (text: string | null): void =>
    setEdits((prev) => {
      const next = { ...prev };
      if (text === null) delete next[key];
      else next[key] = text;
      return next;
    });

  const closeSettings = useCallback((): void => setModal("none"), []);

  const restart = (): void => {
    if (
      !window.confirm(
        "This will delete all viewed-card progress, flagged cards, edited answers, and saved positions. Continue?",
      )
    ) {
      return;
    }
    removeKeys([KEYS.viewed, KEYS.flags, KEYS.edits, KEYS.lastIndex, KEYS.nav]);
    setViewed({});
    setFlags({});
    setEdits({});
    setLastIndex({});
    resetDuck();
    setIndex(0);
    setModal("none");
  };

  /* Keyboard: ← / → move between cards, D flags. Escape closes the
     flagged list (settings handles its own Escape).
     Typing in an input or textarea is left alone. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (modal !== "none") {
        if (e.key === "Escape" && modal === "flagged") setModal("none");
        return;
      }
      const tag = document.activeElement?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (screen !== "card") return;
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "d" || e.key === "D") toggleFlag();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, screen, step, toggleFlag]);

  return (
    <div className="sc">
      {screen === "home" ? (
        <div className="screen home-screen">
          <div className="home-header">
            <div className="home-header-top">
              <h2 className="home-title">{name ? `Hi, ${name}!` : "Interview Study Cards"}</h2>
              <div className="home-header-actions">
              <button type="button" className="topics-btn" onClick={() => setModal("topics")}>
                Choose topics
                <span className="topics-btn__count">
                  {myDecks.length}/{DECKS.length}
                </span>
              </button>
              <button
                type="button"
                className="settings-btn"
                title="Settings"
                aria-label="Settings"
                onClick={() => setModal("settings")}
              >
                ⚙️
              </button>
              </div>
            </div>
            <p className="home-subtitle">Pick a topic to begin</p>
            <ProgressBar done={viewedCount} total={myTotal} />
          </div>
          <TopicGrid decks={myDecks} viewedIn={viewedIn} onPick={pickTopic} />
        </div>
      ) : (
        <div className="screen">
          <div className="sc-head">
            <h2>{subject}</h2>
            <div className="topic-row">
              <div className="topic-actions">
                <button type="button" className="topic-btn" onClick={goHome}>
                  ← Topics
                </button>
                <button
                  type="button"
                  className={`ghost-btn${flagCount > 0 ? " has-dislikes" : ""}`}
                  title="View flagged cards"
                  onClick={() => setModal("flagged")}
                >
                  <span aria-hidden="true">🚩</span>
                  <span>{flagCount}</span>
                </button>
              </div>
              <span className="counter">
                {index + 1} / {deck.cards.length}
              </span>
            </div>
            <ProgressBar done={viewedCount} total={myTotal} />
          </div>

          <div className="sc-main">
            <Flashcard
              key={`${key}#${visit}`}
              card={card}
              answer={answer}
              edited={edits[key] !== undefined}
              flagged={flags[key] !== undefined}
              speech={speech}
              onToggleFlag={toggleFlag}
              onSaveEdit={saveEdit}
            />
          </div>

          <div className="sc-foot">
            <button type="button" className="nav-btn" onClick={() => step(-1)}>
              ← Previous
            </button>
            <button type="button" className="nav-btn is-primary" onClick={() => step(1)}>
              Next →
            </button>
          </div>
        </div>
      )}

      {modal === "flagged" && (
        <FlaggedModal
          flags={flags}
          onJump={jumpToFlag}
          onRemove={removeFlag}
          onClearAll={clearFlags}
          onClose={() => setModal("none")}
        />
      )}
      {modal === "topics" && (
        <TopicsModal
          decks={DECKS}
          chosen={chosen}
          viewedIn={viewedIn}
          onClose={() => setModal("none")}
          onSave={(names) => {
            setChosen(names);
            saveString(KEYS.decks, JSON.stringify(names));
            setModal("none");
          }}
        />
      )}
      {modal === "settings" && (
        <SettingsModal onClose={closeSettings} onRestart={restart} />
      )}
    </div>
  );
}
