/* Renders model text: ``` fences become code blocks, `ticks` inline code,
   and **double stars** bold. Everything else is plain text, which React
   escapes — model output is never injected as HTML. */

import type { ReactNode } from "react";

function inline(text: string, keyBase: string): ReactNode[] {
  return text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const fence = /```[\w+#.-]*\n?([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  const pushProse = (chunk: string, at: number): void => {
    chunk
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p, i) => blocks.push(<p key={`p${at}-${i}`}>{inline(p, `p${at}-${i}`)}</p>));
  };
  while ((match = fence.exec(text)) !== null) {
    pushProse(text.slice(last, match.index), last);
    blocks.push(
      <pre key={`c${match.index}`} className="pp-code">
        <code>{(match[1] ?? "").replace(/\n+$/, "")}</code>
      </pre>,
    );
    last = match.index + match[0].length;
  }
  pushProse(text.slice(last), last);
  return <div className="pp-rich">{blocks}</div>;
}
