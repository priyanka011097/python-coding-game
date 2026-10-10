/* =====================================================================
   progressSync.ts — keeps the app's localStorage in step with the
   signed-in user's progress in MongoDB (via /api/progress).

   Every mode still reads and writes localStorage exactly as before; none
   of them know syncing exists. Instead:

   1. hydrate()  — before the app mounts, merge server and local copies
                   key by key, newest change winning, and write the result
                   into localStorage so the app starts from it.
   2. track      — localStorage.setItem/removeItem are wrapped; changes to
                   the app's keys are batched and sent to the server.
   3. forget()   — on logout, send anything pending, then clear this
                   browser's copy so the next person starts clean.
   ===================================================================== */

/** The app's own storage keys. Mirrors KEY_PATTERN in server/progress.ts. */
const APP_KEY =
  /^(type-check-progress:[a-z]+|type-check-seeded-v2:[a-z]+|studycards_[a-z]+_v1|prep_session_v1|interview-prep-mode|home_[a-z]+_v1)$/;
/** Which account this browser's copy belongs to. */
const OWNER_KEY = "ip_sync_owner";
/** When each app key last changed here: { key: ms }. */
const META_KEY = "ip_sync_meta";
const FLUSH_DELAY_MS = 1200;

export type SyncStatus = "off" | "synced" | "saving" | "error";

interface Entry {
  value: string | null;
  t: number;
}
interface Change extends Entry {
  key: string;
}

/* The real Storage methods, captured before they are wrapped. */
const rawSet = Storage.prototype.setItem;
const rawRemove = Storage.prototype.removeItem;

let active = false;
let pending = new Map<string, Change>();
let timer: number | undefined;
let status: SyncStatus = "off";
const listeners = new Set<(s: SyncStatus) => void>();

function setStatus(next: SyncStatus): void {
  status = next;
  listeners.forEach((fn) => fn(next));
}

export function onSyncStatus(fn: (s: SyncStatus) => void): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

function readMeta(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function writeMeta(meta: Record<string, number>): void {
  rawSet.call(localStorage, META_KEY, JSON.stringify(meta));
}

function localAppKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && APP_KEY.test(k)) keys.push(k);
  }
  return keys;
}

function clearLocal(): void {
  for (const k of localAppKeys()) rawRemove.call(localStorage, k);
  rawRemove.call(localStorage, META_KEY);
  rawRemove.call(localStorage, OWNER_KEY);
}

async function send(changes: Change[], keepalive = false): Promise<boolean> {
  const body = JSON.stringify({ changes });
  try {
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      // keepalive lets a save finish while the tab closes, but is capped
      // at 64 KB by browsers.
      keepalive: keepalive && body.length < 60_000,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function flush(keepalive = false): Promise<void> {
  window.clearTimeout(timer);
  timer = undefined;
  if (pending.size === 0) return;
  const batch = [...pending.values()];
  pending = new Map();
  setStatus("saving");
  const ok = await send(batch, keepalive);
  if (!ok) {
    // Keep them for the next attempt, unless a newer change superseded one.
    for (const c of batch) if (!pending.has(c.key)) pending.set(c.key, c);
    setStatus("error");
    timer = window.setTimeout(() => void flush(), 10_000);
    return;
  }
  setStatus(pending.size ? "saving" : "synced");
  if (pending.size) timer = window.setTimeout(() => void flush(), FLUSH_DELAY_MS);
}

function record(key: string, value: string | null): void {
  const t = Date.now();
  const meta = readMeta();
  meta[key] = t;
  writeMeta(meta);
  pending.set(key, { key, value, t });
  setStatus("saving");
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void flush(), FLUSH_DELAY_MS);
}

let wrapped = false;
function wrapStorage(): void {
  if (wrapped) return;
  wrapped = true;
  Storage.prototype.setItem = function (key: string, value: string): void {
    // Skip writes that change nothing — every mode re-saves on mount.
    const unchanged = this === localStorage && this.getItem(key) === value;
    rawSet.call(this, key, value);
    if (active && this === localStorage && APP_KEY.test(key) && !unchanged) record(key, value);
  };
  Storage.prototype.removeItem = function (key: string): void {
    const existed = this === localStorage && this.getItem(key) !== null;
    rawRemove.call(this, key);
    if (active && this === localStorage && APP_KEY.test(key) && existed) record(key, null);
  };
  const flushNow = (): void => void flush(true);
  window.addEventListener("pagehide", flushNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushNow();
  });
}

export type HydrateResult = "synced" | "local-only" | "error";

/** Merges server and local progress for this user. Call before the app
 *  mounts, because every mode reads localStorage only once, on mount. */
export async function hydrate(userId: string): Promise<HydrateResult> {
  let enabled = false;
  let server: Record<string, Entry> = {};
  try {
    const res = await fetch("/api/progress", { cache: "no-store" });
    if (res.ok) {
      const body = (await res.json()) as { enabled: boolean; entries: Record<string, Entry> };
      enabled = body.enabled;
      server = body.entries ?? {};
    } else if (res.status !== 401) {
      setStatus("error");
      return "error";
    }
  } catch {
    setStatus("error");
    return "error";
  }
  if (!enabled) {
    setStatus("off");
    return "local-only";
  }

  // Another account's leftovers in this browser are not ours to merge.
  const owner = localStorage.getItem(OWNER_KEY);
  if (owner && owner !== userId) clearLocal();

  /* Local values with no timestamp predate syncing (t = 0): they fill gaps
     on the server, but never override something the server already has. */
  const meta = readMeta();
  const local = new Map<string, Entry>();
  for (const k of localAppKeys()) local.set(k, { value: localStorage.getItem(k), t: meta[k] ?? 0 });
  for (const [k, t] of Object.entries(meta)) {
    if (!local.has(k) && APP_KEY.test(k)) local.set(k, { value: null, t }); // deleted here
  }

  const upload: Change[] = [];
  const nextMeta: Record<string, number> = {};
  for (const key of new Set([...local.keys(), ...Object.keys(server)])) {
    const here = local.get(key);
    const there = server[key];
    if (here && (!there || here.t > there.t)) {
      const t = here.t || Date.now();
      upload.push({ key, value: here.value, t });
      nextMeta[key] = t;
    } else if (there) {
      if (there.value === null) rawRemove.call(localStorage, key);
      else rawSet.call(localStorage, key, there.value);
      nextMeta[key] = there.t;
    }
  }
  writeMeta(nextMeta);
  rawSet.call(localStorage, OWNER_KEY, userId);

  wrapStorage();
  active = true;
  if (upload.length) {
    for (const c of upload) pending.set(c.key, c);
    await flush();
  } else {
    setStatus("synced");
  }
  return "synced";
}

/** True if there are changes the server has not confirmed yet. */
export async function trySaveAll(): Promise<boolean> {
  await flush();
  return pending.size === 0;
}

/** On logout: stop syncing and remove this browser's copy. Call after
 *  trySaveAll(); with `keepLocal`, unsaved changes stay in this browser
 *  and are merged next time this same account signs in. */
export function forget(keepLocal = false): void {
  const wasActive = active;
  active = false;
  window.clearTimeout(timer);
  pending = new Map();
  if (wasActive && !keepLocal) clearLocal();
  setStatus("off");
}
