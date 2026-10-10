/* =====================================================================
   subjects.ts — what the user chose to study, per section.

     Coding Game     home_tracks_v1        JSON array of track ids
     Study Cards     studycards_decks_v1   JSON array of deck names
     Interview Prep  prep_session_v1       its own saved session (topicIds)

   Home shows a section's progress only for its chosen subjects, and asks
   the user to choose when there are none. All three keys are synced to the
   account like the rest of the progress.
   ===================================================================== */

import type { TrackId } from "../types";
import { TRACKS } from "../data/tracks";
import { KEYS } from "../cards/storage";
import { DECKS } from "../cards/data/decks";
import { STORAGE_KEY as PREP_KEY, parsePrepState } from "../prep/PrepMode";
import { TOPIC_BY_ID } from "../prep/topics";

export const TRACKS_KEY = "home_tracks_v1";

/** The chosen Coding Game tracks, or null if the user never chose. */
export function chosenTrackIds(raw: string | null): TrackId[] | null {
  try {
    const ids = raw ? (JSON.parse(raw) as unknown) : null;
    if (!Array.isArray(ids)) return null;
    return TRACKS.map((t) => t.id).filter((id) => ids.includes(id));
  } catch {
    return null;
  }
}

export interface SubjectChoice {
  tracks: readonly TrackId[];
  decks: readonly string[];
  prepTopics: readonly string[];
}

/** Saves the choice. Writes go through localStorage, so they sync. */
export function saveSubjects(choice: SubjectChoice): void {
  try {
    const ls = window.localStorage;
    ls.setItem(TRACKS_KEY, JSON.stringify(TRACKS.map((t) => t.id).filter((id) => choice.tracks.includes(id))));
    // An empty deck list means "never chosen" to Study Cards (= all decks);
    // store it only when something is chosen.
    const decks = DECKS.map((d) => d.name).filter((n) => choice.decks.includes(n));
    if (decks.length) ls.setItem(KEYS.decks, JSON.stringify(decks));
    else ls.removeItem(KEYS.decks);
    // Interview Prep keeps its history and levels; only the topics change.
    const prep = parsePrepState(ls.getItem(PREP_KEY));
    const topicIds = choice.prepTopics.filter((id) => TOPIC_BY_ID.has(id));
    ls.setItem(
      PREP_KEY,
      JSON.stringify({
        ...prep,
        topicIds,
        turn: 0,
        // Mid-question on a topic that is no longer chosen: back to the picker.
        screen: topicIds.length && prep.screen.phase !== "setup" ? prep.screen : { phase: "setup" },
      }),
    );
  } catch {
    /* private browsing — nothing to do */
  }
}
