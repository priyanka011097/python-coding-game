/* =====================================================================
   SignIn.tsx — the landing page everyone sees before signing in.

   Explains what the product is (three ways to practise, one dashboard)
   and offers one action: Continue with Google, which both signs up new
   people and logs existing ones in.
   ===================================================================== */

import { ThemeToggle } from "../theme/ThemeToggle";
import "./landing.css";

interface SignInProps {
  error: string | null;
  callbackUrl: string;
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Any address other than localhost: Google will refuse it (an https://
 *  deployment is fine, since it sets APP_URL and is not a bare IP). */
const wrongHost =
  window.location.protocol === "http:" && window.location.hostname !== "localhost";

/** Come back to the page you asked for (e.g. /admin) after signing in. */
const here = window.location.pathname;
const signInHref = here && here !== "/" ? `/auth/google?next=${encodeURIComponent(here)}` : "/auth/google";

function GoogleButton({ size = "lg" }: { size?: "lg" | "sm" }) {
  // A plain link, not fetch: the browser must follow Google's redirects.
  return (
    <a className={`google-btn google-btn--${size}`} href={signInHref}>
      <GoogleLogo />
      Continue with Google
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
    name: "Interview Prep",
    stat: "35 topics · AI interviewer",
    body: "An AI interviewer asks one question at a time, from basics to expert. Each answer gets a score out of 10, feedback and a model answer, and the next question adapts.",
  },
] as const;

const EXTRAS = [
  ["📊", "One dashboard", "See progress in every section and topic at a glance, and jump straight back in."],
  ["🎯", "Readiness score", "Know when you are interview-ready: it rewards acing hard questions in every topic."],
  ["🔊", "Listen and speak", "Hear questions read aloud and answer by voice instead of typing."],
  ["☁️", "Saved to your account", "Pick up on any device. Progress syncs when you sign in."],
  ["🧩", "Choose your topics", "Focus on the decks and languages your next interview is about."],
  ["🦆", "A duck that cheers", "Small wins add up, and a duck pops in to celebrate them."],
] as const;

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

export function SignIn({ error, callbackUrl }: SignInProps) {
  return (
    <div className="lp">
      <header className="lp-nav">
        <span className="lp-brand">
          <span className="lp-brand__mark" aria-hidden="true">IP</span>
          Interview Prep
        </span>
        <div className="lp-nav__end">
          <ThemeToggle />
          <a className="lp-signin" href={signInHref}>
            Sign in
          </a>
        </div>
      </header>

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
              <GoogleButton />
              <span className="lp-cta__hint">Free. New here? Signing in creates your account.</span>
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

        <section className="lp-section" aria-labelledby="lp-three">
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
            <span>Interview Prep covers</span> {TOPICS}
          </p>
        </section>

        <section className="lp-section" aria-labelledby="lp-how">
          <h2 id="lp-how" className="lp-h2">How it works</h2>
          <ol className="lp-steps">
            <li>
              <span className="lp-step__n">1</span>
              <div>
                <h3>Sign in with Google</h3>
                <p>No forms or passwords. Your account is created the first time.</p>
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
                <p>Questions step up from simple to hard. Your dashboard shows what is solid and what to work on.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="lp-section" aria-labelledby="lp-more">
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

        <section className="lp-final">
          <h2 className="lp-h2">Your next interview starts with one question.</h2>
          <GoogleButton />
        </section>
      </main>

      <footer className="lp-foot">Interview Prep · Coding Game · Study Cards · AI Interview Prep</footer>
    </div>
  );
}
