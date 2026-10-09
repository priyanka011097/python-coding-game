import type { Question, Rule, TrackDef, TrackId } from "../types";
import { tsQuestions } from "./tsQuestions";
import { pyBasics } from "./pyBasics";
import { pyQuestions } from "./pyQuestions";
import { pyFluency } from "./pyFluency";
import { pyDsa } from "./pyDsa";
import { aiQuestions } from "./aiQuestions";

/* The Python track is one continuous path, assembled from three files:
   pyBasics    — zero to everyday Python
   pyQuestions — type hints, the object model, the standard library
   pyFluency   — scope, closures, decorators, dunders, protocols, tests
   pyDsa       — data structures and algorithms
   Order is the curriculum, so never sort this. */
const pythonPath: readonly Question[] = [
  ...pyBasics,
  ...pyQuestions,
  ...pyFluency,
  ...pyDsa,
];

const TS_RULES: readonly Rule[] = [
  {
    title: "The annotation covers the variable's whole life",
    body: "In <code>let x: ___ = 10</code> the blank is not describing the <code>10</code>. Cover it with your finger and read the lines below. If it later holds <code>\"N/A\"</code>, the answer is <code>number | string</code>.",
  },
  {
    title: "A component name is never a type",
    body: "If it is declared with <code>function</code> and returns JSX, it draws HTML — it cannot go inside <code>useState&lt;&gt;</code>. Use the <code>interface</code> that names the data shape.",
  },
  {
    title: "The type describes the value, not what you compute from it",
    body: "<code>data?.length</code> is a question you ask the value. Its presence proves <code>data</code> is an array — it is not what <code>data</code> holds.",
  },
  {
    title: "<code>void</code> is only ever a return type",
    body: "No value is ever <code>void</code>. If a blank asks what something <em>holds</em>, <code>void</code> is never the answer.",
  },
  {
    title: "<code>[]</code> means “array of” — look at one item",
    body: "Name the type of a single item, then add <code>[]</code>. <code>\"react\"</code> → <code>string[]</code>.",
  },
  {
    title: "Trigger words for <code>boolean</code>",
    body: "“flag”, “true/false”, and anything named <code>is…</code>, <code>has…</code>, <code>can…</code>.",
  },
  {
    title: "A union lists exactly what is possible — no more",
    body: "<code>string | number | boolean</code> when boolean cannot happen is a bug TypeScript can no longer catch for you.",
  },
  {
    title: "<code>unknown</code> over <code>any</code>",
    body: "<code>any</code> switches checking off. <code>unknown</code> accepts anything but makes you narrow before use — the right choice for API responses and caught errors.",
  },
];

const PY_RULES: readonly Rule[] = [
  {
    title: "Never use a mutable default argument",
    body: "<code>def f(items=[])</code> creates that list <strong>once</strong> and shares it across every call. Use <code>None</code> and build inside the function.",
  },
  {
    title: "<code>is</code> for identity, <code>==</code> for value",
    body: "Always <code>x is None</code>, never <code>x == None</code>. <code>is</code> compares object identity and cannot be overridden by a class.",
  },
  {
    title: "The separator owns <code>.join()</code>",
    body: "<code>\", \".join(words)</code> — not <code>words.join(\", \")</code>. Its inverse is <code>line.split(\",\")</code>.",
  },
  {
    title: "<code>None</code> is Python's <code>void</code>",
    body: "A function with no <code>return</code> gives back <code>None</code>. Written as a hint: <code>-&gt; None</code>.",
  },
  {
    title: "Modern hints use built-ins and <code>|</code>",
    body: "<code>list[str]</code> and <code>str | None</code> (3.9/3.10+) replace <code>List[str]</code> and <code>Optional[str]</code>. Recognise both — plenty of live code still uses the old form.",
  },
  {
    title: "Assignment copies the reference, not the list",
    body: "<code>b = a</code> means both names point at one list. <code>a[:]</code> or <code>a.copy()</code> makes a shallow copy.",
  },
  {
    title: "Falsy covers more than <code>False</code>",
    body: "<code>0</code>, <code>\"\"</code>, <code>[]</code>, <code>{}</code> and <code>None</code> are all falsy, which is why <code>if not items:</code> is the idiomatic emptiness check.",
  },
  {
    title: "Generators are lazy",
    body: "<code>yield</code> produces values on demand, so memory stays flat over huge inputs. <code>any()</code> and <code>all()</code> short-circuit over them.",
  },
  {
    title: "Optimising means: stop recomputing",
    body: "Hash map (what have I seen), sliding window (the current total), memoisation (this subproblem's answer), heap (the ordering). Four ways to say the same thing — find the repeated work, store it.",
  },
  {
    title: "Sorted input? Ask it every time",
    body: "Sorted unlocks binary search (O(log n)) and two pointers (O(1) space). If it is not sorted, sorting costs O(n log n) — which is often still worth it.",
  },
  {
    title: "Queue means <code>deque</code>, never a list",
    body: "<code>list.pop(0)</code> shifts every remaining element, so a list-as-queue is a silent O(n²). <code>collections.deque</code> is O(1) at both ends.",
  },
  {
    title: "BFS for shortest, DFS for everything else",
    body: "Unweighted shortest path and level-order → BFS with a queue. Cycles, components, topological sort, backtracking → DFS. Weighted edges → Dijkstra (a heap).",
  },
  {
    title: "Graph traversal without a <code>visited</code> set is an infinite loop",
    body: "The one thing trees never needed. Add it before you write the recursion, not after it hangs.",
  },
  {
    title: "Say the complexity out loud",
    body: "Brute force → state its Big-O → name the repeated work → pick the structure that removes it → state the new Big-O. That narration is most of what is being marked.",
  },
];

const AI_RULES: readonly Rule[] = [
  {
    title: "Vectorise instead of looping",
    body: "<code>df[\"a\"] * df[\"b\"]</code> runs in C over the whole column; <code>.apply(axis=1)</code> loops in Python. Often 10–100× faster, and the most common pandas interview question.",
  },
  {
    title: "Fit on train, transform on test",
    body: "<code>fit_transform</code> on training data, <code>transform</code> on test. Fitting a scaler on the test set leaks it into training and inflates your score. A <code>Pipeline</code> enforces this for you.",
  },
  {
    title: "Accuracy lies on imbalanced data",
    body: "If 99% of rows are one class, predicting that class always scores 99%. Report precision, recall, F1 or AUC, and use <code>stratify=y</code> when splitting.",
  },
  {
    title: "RAG for knowledge, fine-tuning for behaviour",
    body: "Changing facts, citations and freshness → retrieval. Tone, format and a narrow repeated task → fine-tuning. This is the LLM architecture question you will be asked.",
  },
  {
    title: "Everything is tokens",
    body: "Cost, rate limits and the context window are all counted in tokens (≈4 characters of English). The prompt and the answer share one budget.",
  },
];

export const TRACKS: readonly TrackDef[] = [
  {
    id: "ts",
    label: "TypeScript + React",
    sub: `${tsQuestions.length} questions`,
    questions: tsQuestions,
    rules: TS_RULES,
    /* No seed: this track used to start with Q1–Q39 pre-marked as done
       (worked through before the app existed), which made every new
       account start at 39 right instead of zero. */
  },
  {
    id: "py",
    label: "Python — zero to DSA",
    sub: `${pythonPath.length} questions, in order`,
    questions: pythonPath,
    rules: PY_RULES,
  },
  {
    id: "ai",
    label: "Data + AI",
    sub: `${aiQuestions.length} questions`,
    questions: aiQuestions,
    rules: AI_RULES,
  },
];

/** Lookup that cannot return undefined, because TrackId is a closed union
 *  and Record forces every member to be present. */
export const TRACK_BY_ID: Record<TrackId, TrackDef> = {
  ts: TRACKS[0]!,
  py: TRACKS[1]!,
  ai: TRACKS[2]!,
};
