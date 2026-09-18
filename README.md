# Coding Game

A fill-in-the-blank coding game with three tracks:

- **TypeScript + React**
- **Python — zero to DSA**
- **Data + AI**

Fill-in-the-blank, one question at a time. Built for interview prep, so **the
source is meant to be read**, not just run: every file demonstrates a typing
pattern and says so in a comment at the top.

## Run it

```bash
npm install     # once
npm run dev     # http://localhost:5173
```

Other scripts:

```bash
npm run typecheck   # tsc --noEmit — the fast feedback loop
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
├── App.tsx                   which track is on screen
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
