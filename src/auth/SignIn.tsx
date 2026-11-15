/* =====================================================================
   SignIn.tsx — the landing page new visitors see first.

   Explains what the product is (three ways to practise, one dashboard)
   and offers one action: Start practising, which opens the app with no
   account needed. "Sign in" (top right) is there for syncing progress.
   ===================================================================== */

import { ThemeToggle } from "../theme/ThemeToggle";
import { LandingDuck } from "./LandingDuck";
import { AdLayout } from "../ads/AdLayout";
import { SiteFooter } from "../info/InfoPages";
import { BRAND, BRAND_MARK } from "../brand";
import { slugOf } from "../cards/slug";
import { signInUrl } from "./GoogleButton";
import "./landing.css";

interface SignInProps {
  error: string | null;
  callbackUrl: string;
  /** Opens the app. Without it (pre-rendered HTML) the button is a link. */
  onStart?: () => void;
}

/** Any address other than localhost: Google will refuse it (an https://
 *  deployment is fine, since it sets APP_URL and is not a bare IP). */
/* `typeof window` guards: this page is also pre-rendered to HTML at build
   time (server/seoPlugin.ts), where there is no browser. */
const IN_BROWSER = typeof window !== "undefined";
const wrongHost =
  IN_BROWSER && window.location.protocol === "http:" && window.location.hostname !== "localhost";

/** Come back to the page you asked for (e.g. /admin) after signing in. */
const here = IN_BROWSER ? window.location.pathname : "/";
const signInHref = signInUrl(here);

/** The main call to action: into the app, no account needed. A link to
 *  /?start too, so it works before (or without) JavaScript. */
function StartButton({ onStart }: { onStart?: () => void }) {
  return (
    <a
      className="lp-start"
      href="/?start"
      onClick={(e) => {
        if (!onStart) return;
        e.preventDefault();
        onStart();
      }}
    >
      Start practising
    </a>
  );
}

const SECTIONS = [
  {
    icon: "⌨️",
    name: "Coding Game",
    stat: "357 questions",
    body: "Fill in the blank in real code, one question at a time. Three tracks: TypeScript + React, Python from zero to DSA, and Data + AI. Every answer explains the why.",
  },
  {
    icon: "🗂️",
    name: "Study Cards",
    stat: "1,103 cards · 11 decks",
    body: "Interview questions with clear answers across React, JS/TS, backend, databases, system design, AI, DevOps, security, testing, DSA and 100 Python coding problems.",
  },
  {
    icon: "🎙️",
    name: "AI Interview Prep",
    stat: "35 topics · AI interviewer",
    body: "An AI interviewer asks one question at a time, from basics to expert. Each answer gets a score out of 10, feedback and a model answer, and the next question adapts.",
  },
] as const;

const EXTRAS = [
  ["📊", "One dashboard", "See progress in every section and topic at a glance, and jump straight back in."],
  ["🎯", "Readiness score", "Know when you are interview-ready: it rewards acing hard questions in every topic."],
  ["🔊", "Listen and speak", "Hear questions read aloud and answer by voice instead of typing."],
  ["☁️", "No account needed", "Start straight away. Sign in with Google when you want your progress on every device."],
  ["🧩", "Choose your topics", "Focus on the decks and languages your next interview is about."],
  ["🦆", "A duck that cheers", "Small wins add up, and a duck pops in to celebrate them."],
] as const;

/* The public Study Cards decks (server/publicCards.ts). Listed here rather
   than imported, so the landing page does not load all 1,103 cards. */
const DECK_LINKS = [
  ["⚛️", "React & Frontend", "Hooks, rendering, state and performance"],
  ["🟨", "JavaScript & TypeScript", "Closures, the event loop, types and generics"],
  ["🚀", "Backend Engineering", "APIs, auth, queues, caching and scaling"],
  ["🗃️", "Databases", "SQL, indexes, transactions and NoSQL"],
  ["🏗️", "System Design", "Load balancers, sharding and trade-offs"],
  ["🤖", "AI & Agentic AI", "LLMs, RAG, embeddings and agents"],
  ["☁️", "DevOps & Cloud", "Docker, Kubernetes, CI/CD and AWS"],
  ["🔐", "Security", "OWASP, auth, encryption and XSS"],
  ["🧪", "Testing", "Unit, integration, mocking and TDD"],
  ["🧮", "DSA", "Arrays, trees, graphs and dynamic programming"],
  ["🐍", "Coding Problems (Python)", "100 classic problems with solutions"],
] as const;

/* Shown on the page and given to search engines as an FAQ (JSON-LD below). */
const FAQ = [
  [
    `What is ${BRAND}?`,
    `${BRAND} is an interview preparation platform for developers. It has a Coding Game with 357 fill-in-the-blank questions, 1,103 interview flashcards in 11 decks, and an AI interviewer that asks one question at a time across 35 topics. A dashboard and readiness score show how ready you are.`,
  ],
  [
    "Which topics can I practise?",
    "Data structures and algorithms, system design, machine learning, generative AI and LLMs, CS fundamentals, Python, JavaScript, TypeScript, React, Node.js, Java, Go, Rust, C++, SQL, PostgreSQL, MongoDB, Redis, DevOps, security, testing and more.",
  ],
  [
    "How does the AI interviewer work?",
    "It asks one question at a time, starting at your level. You answer by typing or by voice, and each answer gets a score out of 10, written feedback, the points you missed and a model answer. Questions get harder as you improve.",
  ],
  [
    "How is the readiness score worked out?",
    "It rewards doing well on hard questions in every topic you chose, so a high score means you are strong across your whole interview, not just on easy questions.",
  ],
  [
    "Do I need an account?",
    "No. Everything works without one, and your progress is kept in your browser. Sign in with Google when you want to write your own answers on cards or keep your progress across devices.",
  ],
  [
    "Does it work on my phone?",
    "Yes. Everything works in a phone browser, including reading questions aloud and answering by voice.",
  ],
] as const;

const FAQ_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
}).replace(/</g, "\\u003c");

const TOPICS =
  "DSA · System Design · Machine Learning · GenAI & LLMs · CS Fundamentals · Python · JavaScript · TypeScript · React · Node.js · Java · Go · Rust · C++ · SQL · PostgreSQL · MongoDB · Redis · and more";

/** A static picture of a Coding Game question, so the page shows the
 *  product rather than describing it. */
function QuestionPreview() {
  return (
    <div className="lp-preview" aria-hidden="true">
      <div className="lp-preview__top">
        <span className="lp-chip lp-chip--accent">Hashing</span>
        <span className="lp-chip">Python</span>
        <span className="lp-preview__qno">87 / 250</span>
      </div>
      <p className="lp-preview__ask">Count how often each word appears, in one line.</p>
      <pre className="lp-preview__code">
        <span className="lp-k">from</span> collections <span className="lp-k">import</span> Counter{"\n"}
        {"\n"}
        counts = <span className="lp-blank">Counter</span>(words){"\n"}
        counts.most_common(<span className="lp-n">3</span>)
      </pre>
      <div className="lp-preview__verdict">
        <span className="lp-preview__mark">✓</span> Correct, next question…
      </div>
      <div className="lp-preview__ai">
        <span className="lp-preview__score">
          9<small>/10</small>
        </span>
        <span>
          <b>AI interviewer:</b> clear and correct. Mention that it runs in O(n).
        </span>
      </div>
    </div>
  );
}

export function SignIn({ error, callbackUrl, onStart }: SignInProps) {
  return (
    <div className="lp">
      <header className="lp-nav">
        <a className="lp-brand" href="/">
          <span className="lp-brand__mark" aria-hidden="true">{BRAND_MARK}</span>
          {BRAND}
        </a>
        <div className="lp-nav__end">
          <a className="lp-navlink" href="/cards">Study cards</a>
          <ThemeToggle />
          <a className="lp-signin" href={signInHref}>
            Sign in
          </a>
        </div>
      </header>

      <AdLayout>
      <main>
        <section className="lp-hero">
          <div className="lp-hero__text">
            <p className="lp-eyebrow">For developers preparing for technical interviews</p>
            <h1 className="lp-title">
              Be ready for your next interview, <span className="lp-accent">one question at a time.</span>
            </h1>
            <p className="lp-lede">
              Drill real code, review 1,100+ interview flashcards, and practise with an AI interviewer that
              gets harder as you get better. Then see exactly how ready you are.
            </p>

            {wrongHost && (
              <p className="lp-note">
                Google sign-in only works at{" "}
                <a href={`http://localhost:${window.location.port || "5173"}/`}>
                  localhost:{window.location.port || "5173"}
                </a>{" "}
                on this computer, not at {window.location.hostname}.
              </p>
            )}

            <div className="lp-cta">
              <StartButton onStart={onStart} />
              <span className="lp-cta__hint">No sign-up needed. Jump straight in.</span>
            </div>

            {error && (
              <div className="lp-error" role="alert">
                <p>{error}</p>
                {error.includes("redirect") && callbackUrl && <code>{callbackUrl}</code>}
              </div>
            )}

            <ul className="lp-proof">
              <li><b>357</b> coding questions</li>
              <li><b>1,103</b> flashcards</li>
              <li><b>35</b> interview topics</li>
            </ul>
          </div>
          <QuestionPreview />
        </section>

        <section className="lp-section" aria-labelledby="lp-three" data-duck="Three ways to practise. Quack!">
          <h2 id="lp-three" className="lp-h2">Three ways to practise</h2>
          <p className="lp-sub">Use one, or all three. Everything feeds the same dashboard.</p>
          <div className="lp-cards">
            {SECTIONS.map((s) => (
              <article key={s.name} className="lp-card">
                <span className="lp-card__icon" aria-hidden="true">{s.icon}</span>
                <h3>{s.name}</h3>
                <p className="lp-card__stat">{s.stat}</p>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
          <p className="lp-topics">
            <span>AI Interview Prep covers</span> {TOPICS}
          </p>
        </section>

        <section className="lp-section" aria-labelledby="lp-decks" data-duck="Peek at any deck, no sign-in!">
          <h2 id="lp-decks" className="lp-h2">Popular interview topics</h2>
          <p className="lp-sub">Interview questions with clear answers. Open a deck to try the first cards.</p>
          <ul className="lp-decks">
            {DECK_LINKS.map(([icon, name, blurb]) => (
              <li key={name}>
                <a className="lp-deck" href={`/cards/${slugOf(name)}`}>
                  <span className="lp-deck__icon" aria-hidden="true">{icon}</span>
                  <span>
                    <b>{name} interview questions</b>
                    <small>{blurb}</small>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="lp-topics">
            <a href="/cards">See all study cards →</a>
          </p>
        </section>

        <section className="lp-section" aria-labelledby="lp-how" data-duck="Just 3 steps to get going!">
          <h2 id="lp-how" className="lp-h2">How it works</h2>
          <ol className="lp-steps">
            <li>
              <span className="lp-step__n">1</span>
              <div>
                <h3>Start practising</h3>
                <p>No sign-up or forms. Open the app and answer your first question in seconds.</p>
              </div>
            </li>
            <li>
              <span className="lp-step__n">2</span>
              <div>
                <h3>Pick what your interview is on</h3>
                <p>Choose languages, databases and topics. Start at your level: beginner, intermediate or advanced.</p>
              </div>
            </li>
            <li>
              <span className="lp-step__n">3</span>
              <div>
                <h3>Practise, then check your readiness</h3>
                <p>Questions step up from simple to hard. Your dashboard shows what is solid and what to work on. Sign in any time to keep it on every device.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="lp-section" aria-labelledby="lp-more" data-duck="I cheer you on too!">
          <h2 id="lp-more" className="lp-h2">Built for real practice</h2>
          <div className="lp-extras">
            {EXTRAS.map(([icon, title, body]) => (
              <div key={title} className="lp-extra">
                <span className="lp-extra__icon" aria-hidden="true">{icon}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section" aria-labelledby="lp-faq" data-duck="Questions? I've got answers!">
          <h2 id="lp-faq" className="lp-h2">Frequently asked questions</h2>
          <div className="lp-faq">
            {FAQ.map(([q, a]) => (
              <details key={q} className="lp-faq__item">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_LD }} />
        </section>

        <section className="lp-final" data-duck-big="Quack! Let's go!">
          <h2 className="lp-h2">Your next interview starts with one question.</h2>
          <StartButton onStart={onStart} />
        </section>
      </main>
      </AdLayout>

      <LandingDuck />
      <SiteFooter />
    </div>
  );
}
