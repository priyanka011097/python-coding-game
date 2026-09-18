/* RulesPanel.tsx — the things that actually trip you up, kept on screen.

   INTERVIEW POINT: `readonly Rule[]` says this component may read the
   list but never push to it. Small habit, prevents real mutation bugs. */

import type { Rule } from "../types";

interface RulesPanelProps {
  title: string;
  rules: readonly Rule[];
}

export function RulesPanel({ title, rules }: RulesPanelProps) {
  return (
    <section className="notes">
      <h2>{title}</h2>
      {rules.map((rule) => (
        <div className="rule" key={rule.title}>
          <b dangerouslySetInnerHTML={{ __html: rule.title }} />
          <p dangerouslySetInnerHTML={{ __html: rule.body }} />
        </div>
      ))}
    </section>
  );
}
