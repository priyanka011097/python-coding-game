/* Renders an answer, turning each ~~~ … ~~~ fence into a code block.
   React escapes text for us, so no hand-rolled HTML escaping is needed. */

import { forwardRef } from "react";
import type { ReactNode } from "react";

function split(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const fence = /~~~([\s\S]*?)~~~/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const code = (match[1] ?? "").replace(/^\n+/, "").replace(/\n+$/, "");
    parts.push(
      <pre key={match.index} className="code-block">
        <code>{code}</code>
      </pre>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

interface AnswerTextProps {
  text: string;
}

export const AnswerText = forwardRef<HTMLDivElement, AnswerTextProps>(
  function AnswerText({ text }, ref) {
    return (
      <div ref={ref} className="answer">
        {split(text)}
      </div>
    );
  },
);
