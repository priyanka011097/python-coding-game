/* =====================================================================
   prep/types.ts — shapes for the AI-driven Interview Prep mode.
   ===================================================================== */

export type TopicKind = "fundamentals" | "language" | "database";

export interface PrepTopic {
  readonly id: string;
  readonly label: string;
  readonly kind: TopicKind;
}

/** 1 (absolute basics) to 10 (senior/expert). */
export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type QuestionType = "concept" | "coding" | "query" | "debugging" | "design";

/** What the LLM is asked to return for a new question. */
export interface PrepQuestion {
  readonly topicId: string;
  readonly level: Level;
  readonly type: QuestionType;
  readonly title: string;
  readonly question: string;
  readonly hint: string;
}

/** What the LLM is asked to return when grading an answer. */
export interface Evaluation {
  /** 0–10. */
  readonly score: number;
  readonly verdict: string;
  readonly feedback: string;
  readonly idealAnswer: string;
  readonly missed: readonly string[];
}

export interface HistoryItem {
  readonly question: PrepQuestion;
  readonly answer: string;
  readonly evaluation: Evaluation;
  readonly skipped: boolean;
  readonly at: number;
}

/** The session is a state machine; each phase carries exactly the data it
 *  needs, so "feedback without a question" cannot be represented. */
export type PrepPhase =
  | { phase: "setup" }
  | { phase: "asking"; question: PrepQuestion }
  | { phase: "feedback"; item: HistoryItem };

export interface PrepState {
  readonly topicIds: readonly string[];
  readonly levels: Readonly<Record<string, Level>>;
  readonly history: readonly HistoryItem[];
  /** Index into topicIds of the topic the next question is about. */
  readonly turn: number;
  readonly screen: PrepPhase;
}
