/* =====================================================================
   HomeMode.tsx — the dashboard: progress across every section and its
   sub-sections, each one a shortcut into that part of the app.
   ===================================================================== */

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { TrackId } from "../types";
import type { HomeSummary, Tally, TrackSummary } from "./progressData";
import { pct, pctLabel, summarise } from "./progressData";
import { LEVEL_NAMES, topicLabel } from "../prep/topics";
import { READY_AT, readinessLabel } from "../prep/readiness";
import { saveSubjects } from "./subjects";
import { SubjectsModal } from "./SubjectsModal";
import type { SubjectSection } from "./SubjectsModal";
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

/** Shown instead of a bare "0%" before any progress: a friendly nudge. */
interface Start {
  icon: string;
  cta: string;
  hint: string;
}

function Stat({ label, value, detail, onClick, start }: {
  label: string;
  value: string;
  detail: string;
  onClick?: () => void;
  /** Set when nothing has been done here yet. */
  start?: Start;
}) {
  if (start) {
    return (
      <Row className="hm-stat hm-stat--start" onClick={onClick}>
        <span className="hm-stat__label">{label}</span>
        {onClick ? (
          // The whole tile is the button; this pill just looks like one.
          <span className="hm-start">
            <span className="hm-start__icon" aria-hidden="true">{start.icon}</span>
            {start.cta}
            <span aria-hidden="true">→</span>
          </span>
        ) : (
          <span className="hm-start hm-start--static">
            <span className="hm-start__icon" aria-hidden="true">{start.icon}</span>
            Not started yet
          </span>
        )}
        <span className="hm-stat__detail">{start.hint}</span>
      </Row>
    );
  }
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
  // `version` bumps after choosing subjects, to re-read the new choice.
  const [version, setVersion] = useState<number>(0);
  const local = useMemo(() => (summary ? null : summarise()), [summary, version]);
  const s = summary ?? local!;
  const go = (target: HomeTarget) => (onOpen ? () => onOpen(target) : undefined);
  const { game, cards, prep } = s;
  /** Your own Home can choose subjects; the admin's read-only view cannot. */
  const editable = !summary;
  const [chooser, setChooser] = useState<SubjectSection | "all" | null>(null);
  const nothingChosen = game.needsChoice && cards.needsChoice && prep.needsChoice;

  const choose = (section: SubjectSection | "all", label: string) =>
    editable ? (
      <button type="button" className="hm-btn" onClick={() => setChooser(section)}>
        {label}
      </button>
    ) : null;
  const edit = (section: SubjectSection) =>
    editable ? (
      <button type="button" className="hm-link" onClick={() => setChooser(section)}>
        Edit
      </button>
    ) : null;
  /* Chosen but untouched: a friendly start instead of rows of empty bars. */
  const startHere = (icon: string, cta: string, what: string, names: readonly string[], target: HomeTarget) => (
    <div className="hm-fresh">
      {onOpen ? (
        <button type="button" className="hm-start hm-start--button" onClick={() => onOpen(target)}>
          <span className="hm-start__icon" aria-hidden="true">{icon}</span>
          {cta}
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <span className="hm-start hm-start--static">
          <span className="hm-start__icon" aria-hidden="true">{icon}</span>
          Not started yet
        </span>
      )}
      <p className="hm-line">
        {what}: <b>{names.join(", ")}</b>
      </p>
    </div>
  );
  const pickPrompt = (section: SubjectSection, text: string, label: string) => (
    <div className="hm-pickme">
      <p>{editable ? text : "Not chosen yet."}</p>
      {choose(section, label)}
    </div>
  );

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
          start={
            game.attempted === 0
              ? { icon: "🐣", cta: "Answer your first question", hint: `${game.total} questions waiting for you` }
              : undefined
          }
        />
        <Stat
          label="Study Cards viewed"
          value={pctLabel({ done: cards.viewed, total: cards.total })}
          detail={`${cards.viewed} of ${cards.total.toLocaleString()} cards`}
          onClick={go({ mode: "cards" })}
          start={
            cards.viewed === 0
              ? { icon: "🌱", cta: "Flip your first card", hint: `${cards.total.toLocaleString()} cards ready when you are` }
              : undefined
          }
        />
        <Stat
          label="Interview readiness"
          value={`${prep.readiness}%`}
          detail={`${readinessLabel(prep.readiness)} · ready at ${READY_AT}%`}
          onClick={go({ mode: "prep" })}
          start={
            prep.answered === 0
              ? { icon: "🦆", cta: "Start your first interview", hint: "An AI interviewer, one question at a time" }
              : undefined
          }
        />
      </div>

      {nothingChosen ? (
        <section className="hm-card hm-welcome">
          <span className="hm-welcome__icon" aria-hidden="true">🧭</span>
          <h2>{editable ? "Pick your subjects" : "No subjects chosen yet"}</h2>
          <p>
            {editable
              ? "Tell us what your next interview is about: Coding Game tracks, Study Cards decks and Interview Prep topics. Your progress for them will show up right here."
              : "This user has not chosen any subjects or started practising yet."}
          </p>
          {choose("all", "Choose your subjects")}
        </section>
      ) : (
      <div className="hm-grid">
        {/* Coding Game */}
        <section className="hm-card">
          <div className="hm-card__head">
            <h2>Coding Game {!game.needsChoice && edit("game")}</h2>
            {!game.needsChoice && game.attempted > 0 && (
              <span className="hm-legend">
                <span><i className="hm-dot hm-dot--pass" /> right</span>
                <span><i className="hm-dot hm-dot--fail" /> missed</span>
                <span><i className="hm-dot" /> not tried</span>
              </span>
            )}
          </div>
          {game.needsChoice ? (
            pickPrompt("game", "Choose the tracks you want to drill: TypeScript + React, Python or Data + AI.", "Choose tracks")
          ) : game.attempted === 0 ? (
            startHere("🐣", "Answer your first question", "Your tracks", game.tracks.map((t) => t.label), {
              mode: "game",
              track: game.tracks[0]?.id,
            })
          ) : (
            <ul className="hm-list">
              {game.tracks.map((t) => (
                <TrackRow key={t.id} track={t} onOpen={go({ mode: "game", track: t.id })} />
              ))}
            </ul>
          )}
        </section>

        {/* Interview Prep */}
        <section className="hm-card">
          <div className="hm-card__head">
            <h2>Interview Prep {!prep.needsChoice && edit("prep")}</h2>
            {prep.lastAt !== null && <span className="hm-muted">Last practised {ago(prep.lastAt)}</span>}
          </div>
          {prep.needsChoice ? (
            pickPrompt("prep", "Choose the topics your interview is on, from DSA and System Design to 30 languages and databases.", "Choose topics")
          ) : prep.answered === 0 ? (
            <div className="hm-empty">
              <p className="hm-line">
                Your topics: <b>{prep.topics.map((t) => topicLabel(t.id)).join(", ")}</b>
              </p>
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
            <h2>Study Cards {!cards.needsChoice && edit("cards")}</h2>
            {!cards.needsChoice && cards.viewed > 0 && (
              <span className="hm-muted">
                🚩 {cards.flagged} flagged · ✏️ {cards.edited} edited
              </span>
            )}
          </div>
          {cards.needsChoice ? (
            pickPrompt("cards", "Choose the flashcard decks you want to study: React, system design, databases, DSA and more.", "Choose decks")
          ) : cards.viewed === 0 ? (
            startHere("🌱", "Flip your first card", "Your decks", cards.decks.map((d) => d.name), {
              mode: "cards",
              deck: cards.decks[0]?.name,
            })
          ) : (
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
          )}
        </section>
      </div>
      )}

      {chooser && (
        <SubjectsModal
          initial={{
            tracks: game.tracks.map((t) => t.id),
            decks: cards.decks.map((d) => d.name),
            prepTopics: prep.topics.map((t) => t.id),
          }}
          focus={chooser === "all" ? undefined : chooser}
          onClose={() => setChooser(null)}
          onSave={(choice) => {
            saveSubjects(choice);
            setChooser(null);
            setVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
