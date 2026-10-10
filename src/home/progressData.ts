/* =====================================================================
   progressData.ts — summarises saved progress for the Home dashboard.

   Reads the same saved keys the three modes write. By default from this
   browser (already synced from the account by the time Home mounts); the
   admin page passes another user's saved copy instead. Each summary
   applies the same rules its mode does, so they never disagree.
   ===================================================================== */

import type { TrackDef, TrackId } from "../types";
import { TRACKS } from "../data/tracks";
import type { Progress } from "../types";
import { DECKS, TOTAL_CARDS } from "../cards/data/decks";
import { KEYS } from "../cards/storage";
import type { HistoryItem, Level } from "../prep/types";
import { STORAGE_KEY as PREP_KEY, parsePrepState } from "../prep/PrepMode";
import { overallReadiness, topicReadiness } from "../prep/readiness";

/** Where saved values come from: a key -> its stored string (or null). */
export type ReadKey = (key: string) => string | null;

const fromThisBrowser: ReadKey = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

function json<T extends object>(read: ReadKey, key: string): T {
  try {
    const raw = read(key);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

export interface Tally {
  readonly done: number;
  readonly total: number;
}

export const pct = ({ done, total }: Tally): number => (total ? Math.round((done / total) * 100) : 0);

/** For display: some progress never reads as "0%" (3 of 1,103 is "<1%"). */
export const pctLabel = (t: Tally): string => (t.done > 0 && pct(t) === 0 ? "<1%" : `${pct(t)}%`);

/* ---------- Coding Game ---------- */

export interface TopicTally {
  readonly topic: string;
  readonly right: number;
  readonly wrong: number;
  readonly total: number;
}

export interface TrackSummary {
  readonly id: TrackId;
  readonly label: string;
  readonly right: number;
  readonly wrong: number;
  readonly total: number;
  /** Topics in curriculum order. */
  readonly topics: readonly TopicTally[];
}

function summariseTrack(track: TrackDef, read: ReadKey): TrackSummary {
  // Same key and shape useProgress writes (no track has a seed any more).
  const progress = json<Progress>(read, `type-check-progress:${track.id}`);
  const byTopic = new Map<string, { right: number; wrong: number; total: number }>();
  let right = 0;
  let wrong = 0;
  track.questions.forEach((q, index) => {
    const t = byTopic.get(q.topic) ?? { right: 0, wrong: 0, total: 0 };
    t.total += 1;
    const attempt = progress[index];
    if (attempt?.correct) {
      t.right += 1;
      right += 1;
    } else if (attempt) {
      t.wrong += 1;
      wrong += 1;
    }
    byTopic.set(q.topic, t);
  });
  return {
    id: track.id,
    label: track.label,
    right,
    wrong,
    total: track.questions.length,
    topics: [...byTopic].map(([topic, t]) => ({ topic, ...t })),
  };
}

/* ---------- Study Cards ---------- */

export interface DeckSummary {
  readonly name: string;
  readonly icon: string;
  readonly viewed: number;
  readonly total: number;
  readonly flagged: number;
}

export interface CardsSummary {
  readonly viewed: number;
  readonly total: number;
  readonly flagged: number;
  readonly edited: number;
  readonly decks: readonly DeckSummary[];
}

function countBySubject(map: Record<string, unknown>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const key of Object.keys(map)) {
    const subject = key.slice(0, key.lastIndexOf("::"));
    counts.set(subject, (counts.get(subject) ?? 0) + 1);
  }
  return counts;
}

function summariseCards(read: ReadKey): CardsSummary {
  const viewedMap = json<Record<string, 1>>(read, KEYS.viewed);
  const flagMap = json<Record<string, unknown>>(read, KEYS.flags);
  const edits = json<Record<string, string>>(read, KEYS.edits);
  const viewedBy = countBySubject(viewedMap);
  const flaggedBy = countBySubject(flagMap);
  const decks = DECKS.map((d) => ({
    name: d.name,
    icon: d.icon,
    viewed: Math.min(viewedBy.get(d.name) ?? 0, d.cards.length),
    total: d.cards.length,
    flagged: flaggedBy.get(d.name) ?? 0,
  }));
  return {
    viewed: decks.reduce((n, d) => n + d.viewed, 0),
    total: TOTAL_CARDS,
    flagged: Object.keys(flagMap).length,
    edited: Object.keys(edits).length,
    decks,
  };
}

/* ---------- Interview Prep ---------- */

export interface PrepTopicSummary {
  readonly id: string;
  readonly level: Level;
  readonly readiness: number;
  readonly answered: number;
  readonly avgScore: number | null;
}

export interface PrepSummary {
  readonly readiness: number;
  readonly answered: number;
  readonly avgScore: number | null;
  readonly lastAt: number | null;
  readonly topics: readonly PrepTopicSummary[];
}

const average = (items: readonly HistoryItem[]): number | null =>
  items.length ? Math.round((items.reduce((n, h) => n + h.evaluation.score, 0) / items.length) * 10) / 10 : null;

function summarisePrep(read: ReadKey): PrepSummary {
  const state = parsePrepState(read(PREP_KEY));
  const { history } = state;
  // The current selection first, then anything practised earlier.
  const ids = [...new Set([...state.topicIds, ...history.map((h) => h.question.topicId)])];
  return {
    readiness: overallReadiness(history, state.topicIds),
    answered: history.length,
    avgScore: average(history),
    lastAt: history.length ? history[history.length - 1]!.at : null,
    topics: ids.map((id) => {
      const mine = history.filter((h) => h.question.topicId === id);
      return {
        id,
        level: state.levels[id] ?? 1,
        readiness: topicReadiness(history, id),
        answered: mine.length,
        avgScore: average(mine),
      };
    }),
  };
}

/* ---------- everything ---------- */

export interface HomeSummary {
  readonly game: { readonly right: number; readonly attempted: number; readonly total: number; readonly tracks: readonly TrackSummary[] };
  readonly cards: CardsSummary;
  readonly prep: PrepSummary;
}

export function summarise(read: ReadKey = fromThisBrowser): HomeSummary {
  const tracks = TRACKS.map((t) => summariseTrack(t, read));
  return {
    game: {
      right: tracks.reduce((n, t) => n + t.right, 0),
      attempted: tracks.reduce((n, t) => n + t.right + t.wrong, 0),
      total: tracks.reduce((n, t) => n + t.total, 0),
      tracks,
    },
    cards: summariseCards(read),
    prep: summarisePrep(read),
  };
}
