/* =====================================================================
   CodeBlank.tsx — renders a code block with an <input> where the `~` is.

   INTERVIEW POINTS in this file:
     - typed props, including a function prop and a union prop
     - a typed DOM event  (React.ChangeEvent<HTMLInputElement>)
     - a typed ref        (useRef<HTMLInputElement>(null))
   ===================================================================== */

import { useEffect, useRef } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

/** `status` is a union of literals, so a typo like "corect" is a
 *  compile error rather than a silently broken class name. */
export type BlankStatus = "idle" | "correct" | "wrong" | "shown";

interface CodeBlankProps {
  /** Code containing exactly one `~` marking the blank. */
  code: string;
  value: string;
  status: BlankStatus;
  disabled: boolean;
  /** A function prop: takes the new text, returns nothing. */
  onChange: (next: string) => void;
  onSubmit: () => void;
}

export function CodeBlank({
  code,
  value,
  status,
  disabled,
  onChange,
  onSubmit,
}: CodeBlankProps) {
  // useRef<T>(null) — the generic names the element, so `input.current`
  // is `HTMLInputElement | null` and TypeScript forces the null check.
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled, code]);

  const [before, after] = code.split("~");

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <pre className="code">
      {before}
      <input
        ref={inputRef}
        className={`blank blank--${status}`}
        value={value}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        aria-label="your answer"
        style={{ width: `${Math.max(9, value.length + 2)}ch` }}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {after}
    </pre>
  );
}
