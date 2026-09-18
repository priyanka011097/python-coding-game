/* =====================================================================
   Verdict.tsx — the panel shown once a question is resolved.

   INTERVIEW POINT: `outcome` is a union of literals rather than a
   boolean. A boolean could only say pass/fail; adding "shown" as a
   third state would have meant a second boolean and four possible
   combinations, two of which are nonsense. A union has exactly three.
   ===================================================================== */

export type VerdictOutcome = "pass" | "fail" | "shown";

interface VerdictProps {
  outcome: VerdictOutcome;
  /** Only needed when the answer was not reached, so it is OPTIONAL. */
  answer?: string;
  /** Explanation HTML from the question data. */
  why: string;
}

const HEADINGS: Record<VerdictOutcome, string> = {
  pass: "Correct",
  fail: "Not quite",
  shown: "Answer",
};

const MARKS: Record<VerdictOutcome, string> = {
  pass: "✓",
  fail: "✕",
  shown: "i",
};

export function Verdict({ outcome, answer, why }: VerdictProps) {
  return (
    <div className={`verdict verdict--${outcome}`}>
      <div className="verdict__head">
        <span className="verdict__mark">{MARKS[outcome]}</span>
        {HEADINGS[outcome]}
      </div>

      {/* `answer &&` is the idiomatic way to render an optional prop.
          Because `answer` is `string | undefined`, TypeScript will not
          let you read it without narrowing first. */}
      {outcome !== "pass" && answer && (
        <div className="verdict__answer">
          <span className="label">Answer</span>
          <code>{answer}</code>
        </div>
      )}

      {/* The explanations contain <code> tags authored by us, not by a
          user, which is why this is safe here. */}
      <p className="why" dangerouslySetInnerHTML={{ __html: why }} />
    </div>
  );
}
