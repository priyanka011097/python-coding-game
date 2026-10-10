/* =====================================================================
   HomeMode.tsx — the dashboard: progress across every section and its
   sub-sections, each one a shortcut into that part of the app.
   ===================================================================== */

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { TrackId } from "../types";
import type { HomeSummary, Tally, TrackSummary } from "./progressData";
import { pct, pctLabel, summarise } from "./progressData";
import { LEVEL_NAMES, topicLabel } from "../prep/topics";
import { READY_AT, readinessLabel } from "../prep/readiness";
import "./home.css";

export type HomeTarget =
  | { mode: "game"; track?: TrackId }
  | { mode: "cards"; deck?: string }
  | { mode: "prep" };

interface HomeModeProps {
  firstName: string | null;
  /** Omitted on the admin page: there the dashboard is read-only. */
  onOpen?: (target: HomeTarget) => void;
  /** Someone else's progress (admin page). Defaults to this browser's. */
  summary?: HomeSummary;
  title?: string;
  subtitle?: string;
}

/* ---------- small pieces ---------- */

/** One ratio against its total: accent fill on a lighter accent track. */
function Meter({ done, total, label }: Tally & { label: string }) {
  const p = pct({ done, total });
  return (
    <div
      className="hm-meter"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      title={`${label}: ${done} / ${total} (${p}%)`}
    >
      <div className="hm-meter__fill" style={{ width: `${p}%` }} />
    </div>
  );
}

/** Right and missed side by side, the rest untried. Always paired with a
 *  text count, so the colours never carry meaning on their own. */
function SplitMeter({ right, wrong, total, label }: { right: number; wrong: number; total: number; label: string }) {
  const r = total ? (right / total) * 100 : 0;
  const w = total ? (wrong / total) * 100 : 0;
  return (
    <div
      className="hm-meter"
      role="img"
      aria-label={`${label}: ${right} right, ${wrong} missed, ${total - right - wrong} not tried`}
      title={`${right} right · ${wrong} missed · ${total - right - wrong} not tried`}
    >
      {right > 0 && <div className="hm-meter__fill hm-meter__fill--pass" style={{ width: `${r}%` }} />}
      {wrong > 0 && <div className="hm-meter__fill hm-meter__fill--fail" style={{ width: `${w}%` }} />}
    </div>
  );
}

/** A button when it leads somewhere, plain text when read-only. */
function Row({ className, onClick, children }: { className: string; onClick?: () => void; children: ReactNode }) {
  return onClick ? (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  ) : (
    <div className={`${className} hm-static`}>{children}</div>
  );
}

function Stat({ label, value, detail, onClick }: { label: string; value: string; detail: string; onClick?: () => void }) {
  return (
    <Row className="hm-stat" onClick={onClick}>
      <span className="hm-stat__label">{label}</span>
      <span className="hm-stat__value">{value}</span>
      <span className="hm-stat__detail">{detail}</span>
    </Row>
  );
}

function ago(ms: number): string {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

function TrackRow({ track, onOpen }: { track: TrackSummary; onOpen?: () => void }) {
  const tried = track.right + track.wrong;
  return (
    <li className="hm-track">
      <Row className="hm-row" onClick={onOpen}>
        <span className="hm-row__name">{track.label}</span>
        <span className="hm-row__nums">
          <b>{track.right}</b> right · {track.wrong} missed · {track.total - tried} to go
        </span>
        <SplitMeter right={track.right} wrong={track.wrong} total={track.total} label={track.label} />
      </Row>
      <details className="hm-topics">
        <summary>By topic ({track.topics.length})</summary>
        <ul>
          {track.topics.map((t) => (
            <li key={t.topic}>
              <span className="hm-topics__name">{t.topic}</span>
              <span className="hm-topics__num">
                {t.right}/{t.total}
              </span>
              <SplitMeter right={t.right} wrong={t.wrong} total={t.total} label={t.topic} />
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

/* ---------- the page ---------- */

export function HomeMode({ firstName, onOpen, summary, title, subtitle }: HomeModeProps) {
  // Read once per visit: every mode unmounts on the way here, so its
  // latest saves are already in storage.
  const local = useMemo(() => (summary ? null : summarise()), [summary]);
  const s = summary ?? local!;
  const go = (target: HomeTarget) => (onOpen ? () => onOpen(target) : undefined);
  const { game, cards, prep } = s;

  return (
    <div className="hm">
      <div className="hm-head">
        <h1 className="hm-title">{title ?? (firstName ? `Hi, ${firstName}` : "Your progress")}</h1>
        <p className="hm-sub">{subtitle ?? "Where you stand across everything, and where to pick up next."}</p>
      </div>

      <div className="hm-stats">
        <Stat
          label="Coding Game questions right"
          value={pctLabel({ done: game.right, total: game.total })}
          detail={`${game.right} of ${game.total} · ${game.attempted} attempted`}
          onClick={go({ mode: "game" })}
        />
        <Stat
          label="Study Cards viewed"
          value={pctLabel({ done: cards.viewed, total: cards.total })}
          detail={`${cards.viewed} of ${cards.total.toLocaleString()} cards`}
          onClick={go({ mode: "cards" })}
        />
        <Stat
          label="Interview readiness"
          value={`${prep.readiness}%`}
          detail={prep.answered ? `${readinessLabel(prep.readiness)} · ready at ${READY_AT}%` : "No AI interviews yet"}
          onClick={go({ mode: "prep" })}
        />
      </div>

      <div className="hm-grid">
        {/* Coding Game */}
        <section className="hm-card">
          <div className="hm-card__head">
            <h2>Coding Game</h2>
            <span className="hm-legend">
              <span><i className="hm-dot hm-dot--pass" /> right</span>
              <span><i className="hm-dot hm-dot--fail" /> missed</span>
              <span><i className="hm-dot" /> not tried</span>
            </span>
          </div>
          <ul className="hm-list">
            {game.tracks.map((t) => (
              <TrackRow key={t.id} track={t} onOpen={go({ mode: "game", track: t.id })} />
            ))}
          </ul>
        </section>

        {/* Interview Prep */}
        <section className="hm-card">
          <div className="hm-card__head">
            <h2>Interview Prep</h2>
            {prep.lastAt !== null && <span className="hm-muted">Last practised {ago(prep.lastAt)}</span>}
          </div>
          {prep.answered === 0 ? (
            <div className="hm-empty">
              <p>Practise with the AI interviewer: one question at a time, simple to hard, with a score and a model answer each time.</p>
              {onOpen && (
                <button type="button" className="hm-btn" onClick={() => onOpen({ mode: "prep" })}>
                  Start your first interview
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="hm-line">
                <b>{prep.answered}</b> answered · average <b>{prep.avgScore ?? 0}</b>/10
              </p>
              <ul className="hm-list">
                {prep.topics.map((t) => (
                  <li key={t.id}>
                    <Row className="hm-row" onClick={go({ mode: "prep" })}>
                      <span className="hm-row__name">{topicLabel(t.id)}</span>
                      <span className="hm-row__nums">
                        L{t.level} {LEVEL_NAMES[t.level]} · {t.answered} answered
                        {t.avgScore !== null && ` · avg ${t.avgScore}`} · <b>{t.readiness}%</b> ready
                      </span>
                      <Meter done={t.readiness} total={100} label={`${topicLabel(t.id)} readiness`} />
                    </Row>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Study Cards */}
        <section className="hm-card hm-card--wide">
          <div className="hm-card__head">
            <h2>Study Cards</h2>
            <span className="hm-muted">
              🚩 {cards.flagged} flagged · ✏️ {cards.edited} edited
            </span>
          </div>
          <ul className="hm-decks">
            {cards.decks.map((d) => (
              <li key={d.name}>
                <Row className="hm-row" onClick={go({ mode: "cards", deck: d.name })}>
                  <span className="hm-row__name">
                    <span className="hm-icon" aria-hidden="true">{d.icon}</span>
                    {d.name}
                  </span>
                  <span className="hm-row__nums">
                    {d.viewed}/{d.total}
                    {d.flagged > 0 && ` · ${d.flagged} flagged`}
                  </span>
                  <Meter done={d.viewed} total={d.total} label={`${d.name} viewed`} />
                </Row>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
