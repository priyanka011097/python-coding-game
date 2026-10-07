/* =====================================================================
   llm.ts — talks to /api/llm (see server/nvidiaProxy.ts) and turns the
   model's replies into typed objects.

   Models do not always return clean JSON — some wrap it in ``` fences,
   reasoning models prepend <think> blocks — so every reply goes through
   extractJSON and a validator before the UI sees it.
   ===================================================================== */

import type { Evaluation, HistoryItem, Level, PrepQuestion, QuestionType } from "./types";
import { LEVEL_NAMES, topicLabel } from "./topics";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export class LlmError extends Error {
  constructor(message: string, readonly missingKey = false) {
    super(message);
  }
}

export interface LlmStatus {
  configured: boolean;
  model: string;
}

export async function llmStatus(): Promise<LlmStatus | null> {
  try {
    const res = await fetch("/api/llm");
    if (!res.ok) return null;
    return (await res.json()) as LlmStatus;
  } catch {
    return null;
  }
}

async function chat(
  messages: Message[],
  opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {},
): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, temperature: opts.temperature, maxTokens: opts.maxTokens }),
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new LlmError("Could not reach the local server. Is `npm run dev` running?");
  }
  const body = (await res.json().catch(() => ({}))) as { content?: string; error?: string };
  if (res.status === 503 && body.error === "missing_key") {
    throw new LlmError("No NVIDIA API key configured.", true);
  }
  if (!res.ok) throw new LlmError(body.error ?? `Request failed (${res.status})`);
  return body.content ?? "";
}

/** Pulls the first top-level JSON object out of a model reply. */
export function extractJSON(text: string): unknown {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const start = cleaned.indexOf("{");
  if (start === -1) throw new LlmError("The model did not return JSON. Try again.");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1));
        } catch {
          break;
        }
      }
    }
  }
  throw new LlmError("The model returned malformed JSON. Try again.");
}

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v.trim() : fallback);

const QUESTION_TYPES: readonly QuestionType[] = ["concept", "coding", "query", "debugging", "design"];

const LEVEL_GUIDE: Record<Level, string> = {
  1: "absolute fundamentals: syntax, what a keyword or basic command does",
  2: "basic everyday usage a junior developer must know cold",
  3: "easy practical tasks: small functions or simple queries, common built-ins",
  4: "easy-to-medium: common idioms, typical pitfalls, standard library or core features",
  5: "medium: a classic interview problem or a query with joins/grouping, plus its complexity",
  6: "medium-hard: internals, performance trade-offs, indexing, concurrency basics",
  7: "hard: non-trivial algorithm or query optimisation, memory/execution model, edge cases",
  8: "hard: production scenarios, debugging subtle bugs, scaling, transactions/isolation",
  9: "expert: deep internals, advanced concurrency, query planner, design trade-offs",
  10: "senior/staff level: system-level design and deep trade-off discussion in this technology",
};

/* DSA and system design are not languages, so the generic "write some
   code" framing would give them the wrong kind of question. */
interface TopicGuide {
  readonly ask: string;
  readonly grade: string;
}

const DEFAULT_GUIDE: TopicGuide = {
  ask: "Vary the question type across sessions: concept, coding, query (for databases), debugging (show a short buggy snippet), or design.",
  grade: "correctness first, then completeness, clarity and (for code) efficiency and edge cases. Minor syntax slips in otherwise-correct code should cost little.",
};

const TOPIC_GUIDES: Readonly<Record<string, TopicGuide>> = {
  dsa: {
    ask:
      "This is a data structures & algorithms round. Mostly ask coding problems (arrays, strings, hashing, two pointers, sliding window, stacks/queues, linked lists, trees, graphs/BFS/DFS, heaps, binary search, recursion/backtracking, dynamic programming, greedy, intervals, tries, union-find), scaled to the level; sometimes ask a concept question (complexity, choosing a data structure). Give a clear problem statement with one input/output example. The candidate may answer in any language or pseudocode and should state time and space complexity.",
    grade:
      "correctness of the approach first, then optimal time/space complexity (and whether they stated it), edge cases, and code clarity. Language choice does not matter; a correct brute force with stated complexity earns partial credit at higher levels.",
  },
  systemdesign: {
    ask:
      "This is a system design round. Low levels: fundamentals (load balancing, caching, CDNs, SQL vs NoSQL, replication, sharding, CAP, consistency models, queues, rate limiting). Medium: design a focused component (URL shortener, rate limiter, cache, notification service). High: full systems (news feed, chat, ride sharing, video streaming, distributed job scheduler) — but scope the question so it can be answered in a structured written outline, not an hour-long whiteboard. Ask for requirements, high-level components, data model, and key trade-offs/bottlenecks as appropriate.",
    grade:
      "clarity of requirements and scope, sound high-level architecture, appropriate data storage and scaling choices, awareness of bottlenecks, failure modes and trade-offs. Reward reasoning over buzzwords; a concise but well-justified outline can score highly.",
  },

  ml: {
    ask:
      "This is a machine learning round (classic ML, not generative AI). Low levels: supervised vs unsupervised learning, regression vs classification, overfitting and underfitting, train/validation/test splits, bias-variance, metrics (accuracy, precision, recall, F1, ROC-AUC, RMSE). Medium: specific algorithms and when to use them (linear/logistic regression, decision trees, random forests, gradient boosting, SVM, k-means, PCA), regularisation (L1/L2), cross-validation, feature engineering and scaling, data leakage, imbalanced data, hyperparameter tuning. High: neural network training (backpropagation, optimisers, vanishing gradients, batch norm, dropout), model debugging, deployment and monitoring (data drift), and ML system design (e.g. a recommendation or fraud-detection pipeline). Mix concept questions with occasional short coding tasks in NumPy, pandas or scikit-learn.",
    grade:
      "conceptual correctness first, then whether they explain why (the maths or intuition), awareness of practical pitfalls (data leakage, imbalanced data, wrong metric, overfitting) and clarity. For code, correctness of the approach matters more than exact API names.",
  },
  ai: {
    ask:
      "This is a generative AI / LLM engineering round (not classic ML). Low levels: what an LLM is, tokens and tokenisation, prompts, temperature and sampling, context windows, embeddings, hallucination. Medium: transformers and attention at a conceptual level, prompt engineering techniques (few-shot, chain-of-thought, structured output), embeddings and vector databases, RAG (chunking, retrieval, re-ranking), RAG vs fine-tuning, function/tool calling. High: building production LLM systems — agents and multi-step tool use, evaluation of LLM outputs, guardrails and prompt injection, latency/cost trade-offs, caching, fine-tuning methods (LoRA, RLHF/DPO at a conceptual level), and designing an AI feature end to end. Mix concept questions with occasional short coding tasks (calling an LLM API, building a simple RAG step).",
    grade:
      "correctness of the concepts first, then practical judgement (when to use RAG vs fine-tuning vs prompting, how to evaluate, cost/latency, safety and prompt injection), and clarity. Reward grounded engineering reasoning over hype.",
  },
  csbasics: {
    ask:
      "This is a computer science fundamentals round. Rotate across: operating systems (processes vs threads, scheduling, memory management, virtual memory, deadlocks, synchronisation), computer networks (OSI/TCP-IP layers, TCP vs UDP, HTTP/HTTPS, DNS, what happens when you type a URL), DBMS theory (normalisation, ACID, transactions and isolation levels, indexing), object-oriented programming (encapsulation, inheritance, polymorphism, SOLID, design patterns), and basics of computer architecture and compilers. Low levels are definitions; higher levels are how-it-works and scenario questions.",
    grade:
      "accuracy of the definitions and mechanisms first, then whether they explain how and why it works, relevant examples, and trade-offs. Reward precise, well-structured explanations over vague ones.",
  },
};

const guideFor = (topicId: string): TopicGuide => TOPIC_GUIDES[topicId] ?? DEFAULT_GUIDE;

const INTERVIEWER =
  "You are a senior technical interviewer at a top tech company. You run realistic, fair " +
  "interviews and you reply ONLY with a single JSON object — no prose before or after it.";

export async function generateQuestion(
  topicId: string,
  level: Level,
  history: readonly HistoryItem[],
  signal?: AbortSignal,
): Promise<PrepQuestion> {
  const topic = topicLabel(topicId);
  const asked = history
    .filter((h) => h.question.topicId === topicId)
    .slice(-25)
    .map((h) => `- ${h.question.title}`)
    .join("\n");

  const prompt = `Write ONE ${topic} interview question.

Difficulty: level ${level}/10 (${LEVEL_NAMES[level]}) — ${LEVEL_GUIDE[level]}.
It must be answerable in a few sentences or at most ~25 lines of code/query (a structured outline for design).
${guideFor(topicId).ask}
${asked ? `Do NOT repeat or closely rephrase any of these already-asked questions:\n${asked}\n` : ""}
Return JSON exactly in this shape:
{"type": "concept|coding|query|debugging|design", "title": "short 3-8 word title", "question": "the full question; use \`\`\` fenced code blocks for any code", "hint": "one-sentence nudge that does not give the answer away"}`;

  const raw = await chat(
    [
      { role: "system", content: INTERVIEWER },
      { role: "user", content: prompt },
    ],
    { temperature: 0.8, maxTokens: 700, signal },
  );
  const data = extractJSON(raw) as Record<string, unknown>;
  const question = str(data.question);
  if (!question) throw new LlmError("The model returned an empty question. Try again.");
  const type = QUESTION_TYPES.includes(data.type as QuestionType) ? (data.type as QuestionType) : "concept";
  return {
    topicId,
    level,
    type,
    title: str(data.title, "Interview question"),
    question,
    hint: str(data.hint),
  };
}

export async function evaluateAnswer(
  question: PrepQuestion,
  answer: string,
  signal?: AbortSignal,
): Promise<Evaluation> {
  const topic = topicLabel(question.topicId);
  const prompt = `Grade this ${topic} interview answer.

Question (level ${question.level}/10, ${question.type}):
${question.question}

Candidate's answer:
"""
${answer.trim() || "(no answer — the candidate did not know)"}
"""

Grade like a real interviewer for this level: ${guideFor(question.topicId).grade} An empty or "don't know" answer scores 0.

Return JSON exactly in this shape:
{"score": <integer 0-10>, "verdict": "one short sentence", "feedback": "2-4 sentences: what was right, what was wrong, how to improve", "ideal_answer": "a concise model answer an interviewer would love; use \`\`\` fenced code blocks for code", "missed": ["key point the candidate missed", "..."]}`;

  const raw = await chat(
    [
      { role: "system", content: INTERVIEWER },
      { role: "user", content: prompt },
    ],
    { temperature: 0.2, maxTokens: 1200, signal },
  );
  const data = extractJSON(raw) as Record<string, unknown>;
  const score = Number(data.score);
  return {
    score: Number.isFinite(score) ? Math.min(10, Math.max(0, Math.round(score))) : 0,
    verdict: str(data.verdict),
    feedback: str(data.feedback),
    idealAnswer: str(data.ideal_answer),
    missed: Array.isArray(data.missed)
      ? data.missed.filter((m): m is string => typeof m === "string" && m.trim() !== "")
      : [],
  };
}

export interface ReadinessReport {
  readonly summary: string;
  readonly strengths: readonly string[];
  readonly gaps: readonly string[];
  readonly plan: readonly string[];
}

export async function readinessReport(
  history: readonly HistoryItem[],
  topicIds: readonly string[],
  readiness: number,
  signal?: AbortSignal,
): Promise<ReadinessReport> {
  const log = history
    .slice(-40)
    .map(
      (h) =>
        `[${topicLabel(h.question.topicId)} L${h.question.level}] ${h.question.title} — ${h.evaluation.score}/10` +
        (h.evaluation.missed.length ? ` (missed: ${h.evaluation.missed.slice(0, 3).join("; ")})` : ""),
    )
    .join("\n");

  const prompt = `A candidate is preparing for interviews in: ${topicIds.map(topicLabel).join(", ")}.
Their computed readiness score is ${readiness}%.
Here is their practice log (topic, difficulty level 1-10, question, score):
${log}

Give an honest, specific readiness assessment for their next interview.
Return JSON exactly in this shape:
{"summary": "2-3 sentences: are they ready, and for what level of role", "strengths": ["..."], "gaps": ["specific concept or skill to fix"], "plan": ["concrete next study step", "..."]}`;

  const raw = await chat(
    [
      { role: "system", content: INTERVIEWER },
      { role: "user", content: prompt },
    ],
    { temperature: 0.3, maxTokens: 900, signal },
  );
  const data = extractJSON(raw) as Record<string, unknown>;
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
  return {
    summary: str(data.summary),
    strengths: list(data.strengths),
    gaps: list(data.gaps),
    plan: list(data.plan),
  };
}
