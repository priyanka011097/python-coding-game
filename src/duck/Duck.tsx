import type { DuckShow } from "./useDuck";
import { DUCK_BIG_EVERY } from "./useDuck";

interface DuckProps {
  duck: DuckShow;
}

export function Duck({ duck }: DuckProps) {
  const className =
    duck.mode === "big"
      ? "duck-celebration show"
      : `duck-celebration show-quick corner-${duck.corner}`;

  return (
    <div className={className} aria-hidden="true">
      <div className="duck-bubble">
        {duck.mode === "big" ? (
          <>
            <span className="duck-bubble-text">Quack!</span>
            <span className="duck-bubble-count">+{DUCK_BIG_EVERY}</span>
          </>
        ) : (
          duck.text
        )}
      </div>
      <svg className="duck-svg" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="55" cy="65" rx="32" ry="22" fill="#facc15" />
        <circle cx="78" cy="40" r="20" fill="#facc15" />
        <ellipse className="duck-wing" cx="48" cy="62" rx="15" ry="10" fill="#eab308" />
        <path d="M95,38 Q108,42 95,46 Z" fill="#f97316" />
        <circle cx="82" cy="36" r="3" fill="#1f2937" />
        <circle cx="83" cy="35.2" r="1" fill="#fff" />
        <ellipse cx="42" cy="86" rx="6" ry="3" fill="#f97316" />
        <ellipse cx="62" cy="86" rx="6" ry="3" fill="#f97316" />
      </svg>
    </div>
  );
}
