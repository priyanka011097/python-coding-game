# Interview Prep

One app, three modes — switch between them from the header — plus a **Home**
dashboard (the house button) showing progress across every section and
sub-section, with shortcuts into each. Light and dark mode via the sun/moon
button (follows the system setting until you pick one).

**Coding Game** — fill-in-the-blank, one question at a time, in three tracks:

- **TypeScript + React**
- **Python — zero to DSA**
- **Data + AI**

**Study Cards** — 1,103 question/answer flashcards across 11 decks (React,
JS/TS, Backend, Databases, System Design, AI, DevOps, Security, Testing, DSA,
and 100 Python coding problems). Per-deck and overall "viewed" progress, flag
unclear answers (`D`) and review them in one list, rewrite any answer in your
own words, read answers aloud at 0.5×–2×, `←`/`→` to move, a name greeting,
"Restart Study", and a duck that cheers you on every few cards. The mode is
lazy-loaded, so its decks stay out of the game's bundle.

**Interview Prep** — an AI interviewer on NVIDIA's hosted LLMs. Pick any of
DSA, System Design, Machine Learning, AI (GenAI & LLMs), CS Fundamentals, 18 languages and 12 databases, then answer one generated question at a time.
Each answer is graded 0–10 with feedback, what you missed, and a model answer.
A score of 7+ raises that topic's difficulty (levels 1–10, Basics → Expert),
3 or less lowers it, and topics take turns. A readiness score (70% = ready)
rewards acing *hard* questions, and an AI readiness report lists strengths,
gaps and a study plan.

Setup: put `NVIDIA_API_KEY=nvapi-…` in `.env.local` (or `.env`; both are
git-ignored), optionally `NVIDIA_MODEL=…`, and restart `npm run dev`. The key
stays on the local Vite server (`server/nvidiaProxy.ts` serves `/api/llm`) and
never reaches the browser. See `.env.example`.

Merged from the standalone `interviewPrepCards` app; it uses the same
localStorage keys (`studycards_*_v1`), so its saved data format is unchanged.

The Coding Game is Built for interview prep, so **the
source is meant to be read**, not just run: every file demonstrates a typing
pattern and says so in a comment at the top.

## Accounts and saved progress

- **Sign in with Google** (sign up = first sign-in). The OAuth flow runs on the
  local Vite server (`server/googleAuth.ts`); sessions are signed, HttpOnly
  cookies (`server/session.ts`). The AI endpoint requires sign-in.
- **Progress follows the account** when `MONGODB_URI` is set: accounts go to the
  `users` collection, and each mode's saved state is mirrored per user to
  `progress` (`server/progress.ts`, `src/sync/progressSync.ts`). The newest change
  wins per item, so two devices cannot overwrite each other with stale data.
  Logging out clears that browser's copy. Without MongoDB, progress stays in the
  browser and accounts go to `.data/users.json`.
- **Read aloud and voice input** in Interview Prep use the browser's built-in
  speech APIs (no key needed; voice input works in Chrome and Edge).

All keys live in `.env` (git-ignored) — see `.env.example` for every variable:
`NVIDIA_API_KEY`, `CLIENT_ID` / `CLIENT_SECRET` (Google OAuth, redirect URI
`http://localhost:5173/auth/google/callback`), `SESSION_SECRET`, `MONGODB_URI`.

## Run it

```bash
npm install     # once
npm run dev     # http://localhost:5173
```

Other scripts:

```bash
npm run typecheck   # browser code + server code (tsconfig.node.json)
npm run build       # typecheck + production bundle into dist/
```

## Where to look for each concept

| If they ask about… | Read |
|---|---|
| interfaces, unions, literal types, `Record` | `src/types.ts` |
| discriminated unions + narrowing | `src/types.ts` (`Screen`) and `src/App.tsx` |
| typed props, optional props, function props | `src/components/CodeBlank.tsx` |
| `useState<T>`, including `T \| null` | `src/components/QuestionCard.tsx` |
| a custom hook with a named return type | `src/hooks/useProgress.ts` |
| typed DOM events (`ChangeEvent`, `KeyboardEvent`) | `src/components/CodeBlank.tsx` |
| typed refs (`useRef<HTMLInputElement>(null)`) | `src/components/CodeBlank.tsx` |
| `readonly` arrays and immutability | `src/components/Summary.tsx` |
| `as const satisfies` | `src/data/questions.ts` |
| narrowing `HTMLElement \| null` | `src/main.tsx` |

## Things worth being able to explain out loud

- **`interface` vs `type`** — both describe object shapes; only `type` can
  express a union like `"a" | "b"`.
- **Why `strict: true` matters** — see `tsconfig.json`. Turning it off is how
  teams end up with untyped React.
- **Why `useState<User | null>(null)`** — without the `| null`, TypeScript
  refuses the initial value.
- **`React.ReactNode` vs `JSX.Element`** for `children` — `JSX.Element`
  rejects plain strings, numbers and arrays.
- **Why a discriminated union beats two booleans** — the invalid combination
  becomes unrepresentable rather than merely unlikely.

## Layout

```
src/
├── main.tsx                  entry point
├── App.tsx                   which mode (game / cards) and track is on screen
├── types.ts                  every shape in one place
├── styles.css                design tokens, light + dark
├── data/
│   ├── tracks.ts             the two tabs + their rule cards
│   ├── tsQuestions.ts        72 TypeScript + React questions
│   └── pyQuestions.ts        45 Python questions
├── lib/checkAnswer.ts        answer comparison (pure, no React)
├── hooks/useProgress.ts      localStorage progress, per track
├── examples/LengthDemo.tsx   the User[] vs number worked example
└── components/
    ├── Tabs.tsx
    ├── TrackView.tsx         one track: progress, questions, rules
    ├── QuestionCard.tsx
    ├── CodeBlank.tsx
    ├── Verdict.tsx
    ├── ScoreStrip.tsx
    ├── RulesPanel.tsx
    └── Summary.tsx

src/cards/                    the Study Cards mode
├── CardsMode.tsx             all flashcard state + persistence, keyboard
├── types.ts                  Flashcard, Deck, FlagInfo
├── storage.ts                localStorage keys and safe helpers
├── cards.css                 scoped under .sc, uses the shared tokens
├── data/
│   ├── decks.ts              deck order, icons, totals
│   └── *.ts                  one file per deck
├── hooks/
│   ├── useSpeech.ts          read-aloud with adjustable speed
│   └── useDuck.ts            the celebration duck
└── components/
    ├── TopicGrid.tsx         home screen deck picker
    ├── Flashcard.tsx         question, answer, toolbar, editor
    ├── AnswerText.tsx        ~~~ fences -> code blocks
    ├── ProgressBar.tsx
    ├── FlaggedModal.tsx
    ├── SettingsModal.tsx
    └── Duck.tsx
```

## Coverage

**TypeScript + React (72)** — primitives, arrays, interfaces, optional props,
unions and literal unions, function types, narrowing (`typeof`, guard clauses,
`unknown` in `catch`, `never` exhaustiveness), utility types (`Partial`, `Pick`,
`Omit`, `Record`), `extends` vs `&`, generics with `keyof` / `T[K]` constraints,
`as const` and `typeof x[number]`, typed props and children, native prop
extension, typed events (`ChangeEvent`, `FormEvent`, `MouseEvent`), hooks
(`useState`, `useRef`, `useEffect` cleanup, `useReducer`, `createContext`,
`Dispatch<SetStateAction<T>>`), and typed API layers (`Promise<T>`, `axios.get<T>`,
`Promise.all` tuples, a generic `apiGet<T>`).

**Python + AI (90)**

*Language (55)* — type hints (`list[str]`, `X | None`, `Callable`, `TypeVar`),
collections and slicing, comprehensions, `*args`/`**kwargs`, f-strings and string
methods, classes (`__init__`, `super()`, `@property`, `@staticmethod`,
`@dataclass`), exceptions and context managers, generators, stdlib (`Counter`,
`defaultdict`, `lru_cache`), the walrus operator, starred unpacking, dict merge,
set-vs-list lookup cost, the GIL, and the classic gotchas — mutable default
arguments, `is` vs `==`, reference copying, hashability, and what counts as falsy.

*pandas & NumPy (14)* — `read_csv`, `shape`, null counts, `groupby`, `merge`,
`.loc` vs `.iloc`, `value_counts`, `fillna`, `sort_values`, vectorisation vs
`.apply`, `reshape`, `axis`, `np.where`, broadcasting.

*scikit-learn & ML (12)* — `train_test_split` with `random_state`/`stratify`,
the `fit`/`predict`/`transform` API, **data leakage** (`fit_transform` on train,
`transform` on test), `Pipeline`, cross-validation, overfitting vs underfitting,
precision/recall/F1, imbalanced data, one-hot encoding, L1 vs L2, bias–variance.

*LLMs (9)* — tokens, temperature, embeddings, cosine similarity, RAG, RAG vs
fine-tuning, hallucination and its mitigations, chunking, the context window.
