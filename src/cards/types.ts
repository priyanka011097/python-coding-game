/* =====================================================================
   cards/types.ts — shapes for the Study Cards mode.

   The flashcards are plain question/answer pairs. Answers may contain
   code fenced with ~~~ … ~~~, which the card renders as a code block.
   ===================================================================== */

export interface Flashcard {
  readonly q: string;
  readonly a: string;
}

export interface Deck {
  readonly name: string;
  readonly icon: string;
  readonly cards: readonly Flashcard[];
}

/** What a flag remembers, so the flagged list can show the question
 *  without looking the card up again. */
export interface FlagInfo {
  readonly subject: string;
  readonly index: number;
  readonly question: string;
  readonly timestamp: number;
}

/** Every per-card map is keyed by `${subject}::${index}`. */
export type CardKey = string;

export type CardsScreen = "home" | "card";

export type CardsModal = "none" | "flagged" | "settings" | "topics";
