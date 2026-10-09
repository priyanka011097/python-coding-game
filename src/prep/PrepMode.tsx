/* =====================================================================
   PrepMode.tsx — AI interview practice, powered by an NVIDIA-hosted LLM.

   Pick languages / databases, then answer one generated question at a
   time. Each answer is graded 0–10; good answers raise that topic's
   difficulty, weak ones lower it, and a readiness score tracks whether
   you are acing hard questions in every topic.
   ===================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import type { HistoryItem, Level, PrepQuestion, PrepState } from "./types";
import { TOPIC_BY_ID, topicLabel } from "./topics";
import { nextLevel, overallReadiness } from "./readiness";
import type { ReadinessReport } from "./llm";
import { LlmError, evaluateAnswer, generateQuestion, llmStatus, readinessReport } from "./llm";
import { TopicPicker } from "./components/TopicPicker";
import { QuestionView } from "./components/QuestionView";
import { FeedbackView } from "./components/FeedbackView";
import { ReadinessPanel } from "./components/ReadinessPanel";
import "./prep.css";

export const STORAGE_KEY = "prep_session_v1";

const EMPTY: PrepState = { topicIds: [], levels: {}, history: [], turn: 0, screen: { phase: "setup" } };

export function loadState(): PrepState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw) as PrepState;
    // Drop topics that no longer exist, so a renamed id cannot wedge the session.
    const topicIds = saved.topicIds.filter((id) => TOPIC_BY_ID.has(id));
    return { ...EMPTY, ...saved, topicIds, screen: topicIds.length ? saved.screen : { phase: "setup" } };
  } catch {
    return EMPTY;
  }
}

type Busy = "none" | "question" | "grading" | "report";

export function PrepMode() {
  const [state, setState] = useState<PrepState>(loadState);
  const [busy, setBusy] = useState<Busy>("none");
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState<boolean>(false);
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private browsing — nothing to do */
    }
  }, [state]);

  useEffect(() => {
    void llmStatus().then((s) => {
      if (s && !s.configured) setMissingKey(true);
    });
    return () => abort.current?.abort();
  }, []);

  /** Runs one LLM call with shared busy / error / abort handling. */
  const run = useCallback(async <T,>(kind: Busy, task: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(kind);
    setError(null);
    try {
      return await task(controller.signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return null;
      if (err instanceof LlmError && err.missingKey) setMissingKey(true);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return null;
    } finally {
      if (abort.current === controller) setBusy("none");
    }
  }, []);

  const askNext = useCallback(
    async (base: PrepState): Promise<void> => {
      const topicId = base.topicIds[base.turn % base.topicIds.length]!;
      const level: Level = base.levels[topicId] ?? 1;
      const question = await run("question", (signal) =>
        generateQuestion(topicId, level, base.history, signal),
      );
      if (question) setState({ ...base, screen: { phase: "asking", question } });
      else setState(base);
    },
    [run],
  );

  const start = (topicIds: string[], startLevel: Level): void => {
    const levels: Record<string, Level> = { ...state.levels };
    for (const id of topicIds) levels[id] ??= startLevel;
    setReport(null);
    const base: PrepState = { ...state, topicIds, levels, turn: 0, screen: { phase: "setup" } };
    setState(base);
    void askNext(base);
  };

  const grade = async (question: PrepQuestion, answer: string, skipped: boolean): Promise<void> => {
    const evaluation = await run("grading", (signal) =>
      evaluateAnswer(question, skipped ? "" : answer, signal),
    );
    if (!evaluation) return;
    const item: HistoryItem = {
      question,
      answer: skipped ? "" : answer,
      evaluation: skipped ? { ...evaluation, score: 0 } : evaluation,
      skipped,
      at: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      history: [...prev.history, item],
      levels: { ...prev.levels, [question.topicId]: nextLevel(question.level, item.evaluation.score) },
      turn: prev.turn + 1,
      screen: { phase: "feedback", item },
    }));
  };

  const getReport = async (): Promise<void> => {
    const r = await run("report", (signal) =>
      readinessReport(state.history, state.topicIds, overallReadiness(state.history, state.topicIds), signal),
    );
    if (r) setReport(r);
  };

  const resetAll = (): void => {
    if (!window.confirm("Clear all Interview Prep history, levels and readiness?")) return;
    abort.current?.abort();
    setReport(null);
    setError(null);
    setState(EMPTY);
  };

  const { screen } = state;
  const inSession = screen.phase !== "setup" && state.topicIds.length > 0;

  return (
    <div className="pp">
      {/* Reset is reachable whenever there is something to reset, including
          from the topic picker — not only mid-session. */}
      {(inSession || state.history.length > 0) && (
        <div className="pp-head">
          <div className="pp-head__actions">
            {inSession && (
              <button
                type="button"
                className="pp-btn pp-btn--ghost"
                onClick={() => {
                  abort.current?.abort();
                  setState((prev) => ({ ...prev, screen: { phase: "setup" } }));
                }}
              >
                Change topics
              </button>
            )}
            <button type="button" className="pp-btn pp-btn--ghost" onClick={resetAll}>
              Reset
            </button>
          </div>
        </div>
      )}

      {missingKey && (
        <div className="pp-notice">
          <strong>Connect the NVIDIA API to start.</strong>
          <ol>
            <li>
              Get a free key at <span className="pp-mono">build.nvidia.com</span> (pick a model, then "Get API Key").
            </li>
            <li>
              Create <span className="pp-mono">study/.env.local</span> containing{" "}
              <span className="pp-mono">NVIDIA_API_KEY=nvapi-…</span>
            </li>
            <li>
              Restart <span className="pp-mono">npm run dev</span> and reload this page.
            </li>
          </ol>
          <p className="pp-small">The key stays on the local server and is never sent to the browser.</p>
        </div>
      )}

      {error && !missingKey && screen.phase !== "setup" && (
        <div className="pp-error" role="alert">
          <span>{error}</span>
          {screen.phase !== "asking" && state.topicIds.length > 0 && busy === "none" && (
            <button type="button" className="pp-btn pp-btn--ghost" onClick={() => void askNext(state)}>
              Retry
            </button>
          )}
        </div>
      )}

      {screen.phase === "setup" ? (
        <div className="pp-layout pp-layout--single">
          <TopicPicker
            initial={state.topicIds}
            busy={busy === "question"}
            error={missingKey ? "No NVIDIA API key is set up yet. See the steps at the top of the page." : error}
            onStart={start}
          />
          {state.history.length > 0 && (
            <p className="pp-small pp-center">
              {state.history.length} answered so far. Your levels per topic are kept when you
              change topics.
            </p>
          )}
        </div>
      ) : (
        <div className="pp-layout">
          <main className="pp-main">
            {screen.phase === "asking" && (
              <QuestionView
                key={`${screen.question.topicId}-${state.history.length}`}
                question={screen.question}
                number={state.history.length + 1}
                busy={busy === "grading"}
                onSubmit={(answer) => void grade(screen.question, answer, false)}
                onSkip={() => void grade(screen.question, "", true)}
              />
            )}
            {screen.phase === "feedback" && (
              <FeedbackView
                item={screen.item}
                number={state.history.length}
                newLevel={state.levels[screen.item.question.topicId] ?? screen.item.question.level}
                busy={busy === "question"}
                onNext={() => void askNext(state)}
              />
            )}

            {report && (
              <div className="pp-card pp-report">
                <div className="pp-card__body">
                  <h2 className="pp-title">Your readiness report</h2>
                  <p>{report.summary}</p>
                  {report.strengths.length > 0 && (
                    <>
                      <h3 className="pp-label">Strengths</h3>
                      <ul className="pp-list pp-list--pass">
                        {report.strengths.map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    </>
                  )}
                  {report.gaps.length > 0 && (
                    <>
                      <h3 className="pp-label">Gaps to close</h3>
                      <ul className="pp-list pp-list--fail">
                        {report.gaps.map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    </>
                  )}
                  {report.plan.length > 0 && (
                    <>
                      <h3 className="pp-label">Study plan</h3>
                      <ol className="pp-list">
                        {report.plan.map((s) => <li key={s}>{s}</li>)}
                      </ol>
                    </>
                  )}
                  <button type="button" className="pp-link" onClick={() => setReport(null)}>
                    Hide report
                  </button>
                </div>
              </div>
            )}
          </main>

          <ReadinessPanel
            topicIds={state.topicIds}
            levels={state.levels}
            history={state.history}
            onReport={() => void getReport()}
            reportBusy={busy === "report"}
          />
        </div>
      )}

      {state.history.length > 0 && screen.phase !== "setup" && (
        <details className="pp-card pp-history">
          <summary>History ({state.history.length})</summary>
          <ul>
            {[...state.history].reverse().map((h) => (
              <li key={h.at}>
                <span className={`pp-hscore pp-hscore--${h.evaluation.score >= 7 ? "pass" : h.evaluation.score >= 4 ? "mid" : "fail"}`}>
                  {h.evaluation.score}
                </span>
                <span className="pp-mono pp-hmeta">
                  {topicLabel(h.question.topicId)} L{h.question.level}
                </span>
                <span>{h.question.title}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
