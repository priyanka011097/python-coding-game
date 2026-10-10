/* =====================================================================
   AdminMode.tsx — everyone who has signed in, and each user's progress.

   Data comes from /api/admin/overview, which the server only answers for
   emails in ADMIN_EMAILS. Each user's saved progress is summarised with
   the same code as Home (summarise), so the numbers match what that user
   sees on their own dashboard.
   ===================================================================== */

import { useEffect, useMemo, useState } from "react";
import { HomeMode } from "../home/HomeMode";
import { pctLabel, summarise } from "../home/progressData";
import type { HomeSummary } from "../home/progressData";
import "./admin.css";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  createdAt: string;
  lastLoginAt: string;
  lastActiveAt: string | null;
  entries: Record<string, string>;
}

interface Row extends AdminUser {
  summary: HomeSummary;
}

type Load =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; rows: Row[]; progressStored: boolean };

type SortKey = "lastLogin" | "joined" | "name" | "game" | "cards" | "readiness";

const SORTS: readonly { key: SortKey; label: string }[] = [
  { key: "lastLogin", label: "Last login" },
  { key: "joined", label: "Newest" },
  { key: "name", label: "Name" },
  { key: "game", label: "Coding Game" },
  { key: "cards", label: "Study Cards" },
  { key: "readiness", label: "Readiness" },
];

const date = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

function ago(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

function Avatar({ user }: { user: AdminUser }) {
  const [ok, setOk] = useState<boolean>(Boolean(user.picture));
  return ok ? (
    <img className="ad-avatar" src={user.picture} alt="" referrerPolicy="no-referrer" onError={() => setOk(false)} />
  ) : (
    <span className="ad-avatar ad-avatar--text" aria-hidden="true">
      {(user.name || user.email).charAt(0).toUpperCase()}
    </span>
  );
}

export function AdminMode() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("lastLogin");
  const [nonce, setNonce] = useState<number>(0);

  useEffect(() => {
    let live = true;
    setLoad({ status: "loading" });
    void (async () => {
      try {
        const res = await fetch("/api/admin/overview", { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as {
          users?: AdminUser[];
          progressStored?: boolean;
          error?: string;
        };
        if (!live) return;
        if (res.status === 403) return setLoad({ status: "error", message: "This account is not an admin." });
        if (!res.ok || !body.users) return setLoad({ status: "error", message: body.error ?? `Could not load users (${res.status}).` });
        const rows = body.users.map((u) => ({
          ...u,
          summary: summarise((key) => u.entries[key] ?? null),
        }));
        setLoad({ status: "ready", rows, progressStored: body.progressStored ?? false });
      } catch {
        if (live) setLoad({ status: "error", message: "Could not reach the server." });
      }
    })();
    return () => {
      live = false;
    };
  }, [nonce]);

  const rows = load.status === "ready" ? load.rows : [];
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    const gamePct = (r: Row) => (r.summary.game.total ? r.summary.game.right / r.summary.game.total : 0);
    const cardPct = (r: Row) => (r.summary.cards.total ? r.summary.cards.viewed / r.summary.cards.total : 0);
    const cmp: Record<SortKey, (a: Row, b: Row) => number> = {
      lastLogin: (a, b) => b.lastLoginAt.localeCompare(a.lastLoginAt),
      joined: (a, b) => b.createdAt.localeCompare(a.createdAt),
      name: (a, b) => a.name.localeCompare(b.name),
      game: (a, b) => gamePct(b) - gamePct(a),
      cards: (a, b) => cardPct(b) - cardPct(a),
      readiness: (a, b) => b.summary.prep.readiness - a.summary.prep.readiness,
    };
    return [...list].sort(cmp[sort]);
  }, [rows, query, sort]);

  const chosen = rows.find((r) => r.id === selected) ?? null;

  if (chosen) {
    const first = chosen.name.split(" ")[0] ?? chosen.name;
    return (
      <div className="ad">
        <div className="ad-detail-head">
          <button type="button" className="ad-back" onClick={() => setSelected(null)}>
            ← All users
          </button>
          <div className="ad-who">
            <Avatar user={chosen} />
            <div>
              <div className="ad-who__name">{chosen.name}</div>
              <div className="ad-muted">
                {chosen.email} · joined {date(chosen.createdAt)} · last login {ago(chosen.lastLoginAt)} · last active{" "}
                {ago(chosen.lastActiveAt)}
              </div>
            </div>
          </div>
        </div>
        <HomeMode
          firstName={null}
          summary={chosen.summary}
          title={`${first}'s progress`}
          subtitle="Read-only view of this user's saved progress."
        />
      </div>
    );
  }

  return (
    <div className="ad">
      <div className="ad-head">
        <div>
          <h1 className="ad-title">Admin</h1>
          <p className="ad-muted">Everyone who has signed in, and how far they have got.</p>
        </div>
        <button type="button" className="ad-refresh" onClick={() => setNonce((n) => n + 1)} disabled={load.status === "loading"}>
          {load.status === "loading" ? "Loading…" : "Refresh"}
        </button>
      </div>

      {load.status === "error" && <p className="ad-error" role="alert">{load.message}</p>}

      {load.status === "ready" && (
        <>
          {!load.progressStored && (
            <p className="ad-note">MONGODB_URI is not set, so progress is only in each user's browser and shows as 0 here.</p>
          )}
          <div className="ad-stats">
            <div className="ad-stat"><span>Users</span><b>{rows.length}</b></div>
            <div className="ad-stat">
              <span>Active in the last 7 days</span>
              <b>{rows.filter((r) => r.lastActiveAt && Date.now() - new Date(r.lastActiveAt).getTime() < 7 * 86400e3).length}</b>
            </div>
            <div className="ad-stat">
              <span>Joined in the last 7 days</span>
              <b>{rows.filter((r) => Date.now() - new Date(r.createdAt).getTime() < 7 * 86400e3).length}</b>
            </div>
            <div className="ad-stat">
              <span>AI interview answers</span>
              <b>{rows.reduce((n, r) => n + r.summary.prep.answered, 0)}</b>
            </div>
          </div>

          <div className="ad-tools">
            <input
              className="ad-search"
              type="search"
              placeholder="Search name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search users"
            />
            <label className="ad-sort">
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                {SORTS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            <p className="ad-muted ad-empty">{rows.length ? "No users match that search." : "Nobody has signed in yet."}</p>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Joined</th>
                    <th>Last login</th>
                    <th>Last active</th>
                    <th className="num">Coding Game</th>
                    <th className="num">Study Cards</th>
                    <th className="num">Readiness</th>
                    <th className="num">AI answers</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const g = r.summary.game;
                    const c = r.summary.cards;
                    const p = r.summary.prep;
                    return (
                      <tr key={r.id} onClick={() => setSelected(r.id)} tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") setSelected(r.id); }}
                        aria-label={`Open ${r.name}'s progress`}>
                        <td>
                          <div className="ad-user">
                            <Avatar user={r} />
                            <div className="ad-user__text">
                              <span className="ad-user__name">{r.name}</span>
                              <span className="ad-muted">{r.email}</span>
                            </div>
                          </div>
                        </td>
                        <td title={date(r.createdAt)}>{ago(r.createdAt)}</td>
                        <td title={date(r.lastLoginAt)}>{ago(r.lastLoginAt)}</td>
                        <td title={date(r.lastActiveAt)}>{ago(r.lastActiveAt)}</td>
                        <td className="num">
                          <b>{pctLabel({ done: g.right, total: g.total })}</b>
                          <span className="ad-muted"> {g.right}/{g.total}</span>
                        </td>
                        <td className="num">
                          <b>{pctLabel({ done: c.viewed, total: c.total })}</b>
                          <span className="ad-muted"> {c.viewed}/{c.total}</span>
                        </td>
                        <td className="num"><b>{p.readiness}%</b></td>
                        <td className="num">{p.answered}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
