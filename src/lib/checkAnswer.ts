/* =====================================================================
   checkAnswer.ts — comparing what the user typed to the real answer.

   Two answers can be spelled differently and still be the same type:
     number | string   ===   string | number
     (id: number) => void  ===  (x: number) => void
   So we reduce both sides to a canonical form before comparing.
   ===================================================================== */

/** Split on `sep`, but only at the top level — so the `|` inside
 *  `Record<string, A | B>` is left alone. */
function splitTop(input: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const ch of input) {
    if (ch === "<" || ch === "(" || ch === "[") depth += 1;
    else if (ch === ">" || ch === ")" || ch === "]") depth -= 1;

    if (ch === sep && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

/** Reduce a type expression to a comparable form. */
export function canonical(raw: string): string {
  let t = raw.trim().replace(/[;,]+$/, "").replace(/\s+/g, " ").toLowerCase();

  t = t.replace(/'/g, '"');                       // 'admin' -> "admin"
  t = t
    .replace(/\s*\|\s*/g, "|")
    .replace(/\s*=>\s*/g, "=>")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*<\s*/g, "<")
    .replace(/\s*>\s*/g, ">")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .replace(/\s*\[\s*\]/g, "[]");

  t = t.replace(/^react\./, "");                  // React.ReactNode -> ReactNode
  t = t.replace(/^array<(.+)>$/, "$1[]");         // Array<string> -> string[]

  // Parameter NAMES are not part of a function type, so drop them.
  t = t.replace(/\(([^)]*)\)=>/g, (_match, inner: string) => {
    const stripped = inner
      .split(",")
      .map((param) => param.replace(/^[a-z0-9_$]+:/, ""))
      .join(",");
    return `(${stripped})=>`;
  });

  // Union members are unordered.
  const members = splitTop(t, "|");
  if (members.length > 1) {
    t = members.map((m) => m.trim()).sort().join("|");
  }

  return t;
}

export function isCorrect(raw: string, accepted: readonly string[]): boolean {
  if (raw.trim() === "") return false;
  return accepted.some((answer) => canonical(answer) === canonical(raw));
}

/** Masks the letters of an answer so its SHAPE is visible but the
 *  answer is not: `() => void` becomes `() => ••••` */
export function shapeHint(answer: string): string {
  return answer.replace(/[A-Za-z0-9_$."]/g, "•");
}
