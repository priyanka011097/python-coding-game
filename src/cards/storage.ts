/* =====================================================================
   cards/storage.ts — localStorage keys and safe read/write helpers.

   The keys are the ones the original standalone Study Cards app used,
   so the saved format is unchanged.
   ===================================================================== */

export const KEYS = {
  flags: "studycards_disliked_v1",
  viewed: "studycards_completed_v1",
  nav: "studycards_nav_v1",
  edits: "studycards_edits_v1",
  lastIndex: "studycards_lastindex_v1",
  name: "studycards_name_v1",
  readSpeed: "studycards_readspeed_v1",
  /** The decks the user chose to study: a JSON array of deck names.
   *  Absent means "all decks", so nobody's view changes until they choose. */
  decks: "studycards_decks_v1",
} as const;

export function loadJSON<T extends object>(key: string): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private browsing — nothing to do */
  }
}

export function loadString(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function saveString(key: string, value: string): void {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* private browsing — nothing to do */
  }
}

export function loadNumber(key: string, fallback: number): number {
  const raw = loadString(key);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function removeKeys(keys: readonly string[]): void {
  try {
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* private browsing — nothing to do */
  }
}

export const cardKey = (subject: string, index: number): string =>
  `${subject}::${index}`;
