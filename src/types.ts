/* =====================================================================
   types.ts — every shape the app uses, in one place.

   INTERVIEW POINT: `interface` vs `type`.
   Both describe a shape. Use `interface` for object shapes others might
   extend, and `type` for unions, primitives and aliases — because only
   `type` can express `"a" | "b"`.
   ===================================================================== */

/** The app's sections: fill-in-the-blank drills, flashcards, or the
 *  AI-driven interview practice. */
export type AppMode = "game" | "cards" | "prep";

/** Which drill set is on screen. A union of literals, so a typo is a
 *  compile error rather than a silently empty tab. */
export type TrackId = "ts" | "py" | "ai";

/** Topics for the TypeScript + React track. */
export type TsTopic =
  | "Basics" | "Arrays" | "Interfaces" | "Functions" | "Optional"
  | "Unions" | "Callbacks" | "Narrowing" | "Utility types" | "Generics"
  | "React props" | "React state" | "React events" | "React hooks"
  | "API types";

/** Topics for the Python track. Ordered the way the drill runs:
 *  absolute beginner -> everyday Python -> the object model and the
 *  standard library -> data structures and algorithms. */
export type PyTopic =
  // Step 1 - the very first ideas
  | "First steps" | "Variables" | "Numbers" | "Text" | "Truth"
  | "Decisions" | "Lists" | "Loops" | "Dicts" | "Sets & tuples"
  // Step 2 - everyday Python
  | "Functions" | "Strings" | "Errors" | "Files" | "Modules"
  | "Classes" | "Comprehensions" | "Iteration" | "Collections"
  | "Gotchas" | "Stdlib" | "Performance" | "Type hints"
  // Step 3 - the parts that make you fluent rather than fluent-ish
  | "Scope" | "Decorators" | "Dunder methods" | "Protocols" | "Testing"
  // Step 4 - data structures and algorithms
  | "Big-O" | "Arrays" | "Prefix sums" | "Two pointers" | "Hashing"
  | "Stacks" | "Queues" | "Linked lists" | "Recursion" | "Sorting"
  | "Binary search" | "Trees" | "Graphs" | "Heaps" | "Tries"
  | "Union-find" | "DP" | "Backtracking" | "Greedy" | "Bit tricks"
  | "Matrix" | "Intervals" | "Design";

/** Topics for the data + AI track, which lives in its own tab. */
export type AiTopic =
  | "pandas" | "NumPy" | "scikit-learn" | "ML concepts" | "LLMs";

export type Topic = TsTopic | PyTopic | AiTopic;

/** One drill question. */
export interface Question {
  readonly id: number;
  readonly topic: Topic;
  /** One line linking this question back to the previous one, so the
   *  drill reads as a path rather than a pile. Shown above the prompt. */
  readonly bridge?: string;
  /** The prompt. May contain <em> and <code>. */
  readonly ask: string;
  /** Code with a single `~` marking where the blank goes. */
  readonly code: string;
  /** Accepted answers. The first is shown as *the* answer. */
  readonly accepted: readonly string[];
  /** The idea being taught, shown UNDER the code before you answer.
   *  Teach first, then ask - it should set the question up without
   *  handing over the literal answer. */
  readonly concept?: string;
  /** Explanation shown once the question is resolved. */
  readonly why: string;
  /** True for questions this user has previously got wrong. */
  readonly flagged?: boolean;
}

/** A rule card in the panel under the drill. */
export interface Rule {
  readonly title: string;
  readonly body: string;
}

/** Everything one tab needs. */
export interface TrackDef {
  readonly id: TrackId;
  readonly label: string;
  readonly sub: string;
  readonly questions: readonly Question[];
  readonly rules: readonly Rule[];
  /** Questions already worked through outside the app, marked done on
   *  first load. Cleared for good by "Reset track". */
  readonly seed?: Progress;
}

/** What we remember about one attempt. An unattempted question has no
 *  Attempt at all, which is why `answer` is `string` and not
 *  `string | null` — null would be a second way to say the same thing. */
export interface Attempt {
  readonly answer: string;
  readonly correct: boolean;
}

/** An index signature: "any number key maps to an Attempt".
 *  Reading a missing key gives `Attempt | undefined`, which is why every
 *  read site has to check before using it. */
export type Progress = Record<number, Attempt>;

/** A discriminated union — the classic interview question. `phase` is
 *  the discriminant: once you check it, TypeScript knows exactly which
 *  other fields exist. */
export type Screen =
  | { phase: "drill"; index: number }
  | { phase: "summary" };
