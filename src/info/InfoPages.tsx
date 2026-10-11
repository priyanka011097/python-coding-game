/* =====================================================================
   InfoPages.tsx — About, Privacy Policy and Contact.

   Public pages (no sign-in needed) at /about, /privacy and /contact,
   linked from the footer everywhere. Ad networks such as AdSense require
   a reachable privacy policy and a way to contact the site owner.
   ===================================================================== */

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { ThemeToggle } from "../theme/ThemeToggle";
import { BRAND, BRAND_MARK } from "../brand";
import "./info.css";

export const OWNER = "Build with Priyanka";
export const OWNER_URL = "https://buildwithpriyanka.in";
export const CONTACT_EMAIL = "shahasanepriyanka@gmail.com";
const UPDATED = "12 October 2026";

export const INFO_PATHS = ["/about", "/privacy", "/contact"] as const;
export type InfoPath = (typeof INFO_PATHS)[number];

export const infoPathOf = (pathname: string): InfoPath | null => {
  const p = pathname.replace(/\/+$/, "") as InfoPath;
  return (INFO_PATHS as readonly string[]).includes(p) ? p : null;
};

/** The footer on every page: who made it, and the info pages. Inside the
 *  signed-in app, "Study cards" opens the app's Study Cards (where progress
 *  is saved) instead of the public preview pages. */
export function SiteFooter({ onStudyCards }: { onStudyCards?: () => void } = {}) {
  return (
    <footer className="site-foot">
      <span>
        A product from{" "}
        <a href={OWNER_URL} target="_blank" rel="noopener">
          buildwithpriyanka.in
        </a>
      </span>
      <nav aria-label="Site">
        <a
          href={onStudyCards ? "/?open=cards" : "/cards"}
          onClick={(e) => {
            if (!onStudyCards) return;
            e.preventDefault();
            onStudyCards();
          }}
        >
          Study cards
        </a>
        <a href="/about">About</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/contact">Contact</a>
      </nav>
    </footer>
  );
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="info">
      <header className="info-nav">
        <a className="info-brand" href="/">
          <span className="info-brand__mark" aria-hidden="true">{BRAND_MARK}</span>
          {BRAND}
        </a>
        <div className="info-nav__end">
          <ThemeToggle />
          <a className="info-open" href="/">Open {BRAND}</a>
        </div>
      </header>
      <main className="info-main">
        <h1>{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------- About ---------- */

function About() {
  return (
    <Shell title={`About ${BRAND}`}>
      <p className="info-lede">
        {BRAND} helps developers get ready for technical interviews, one question at a time, and shows
        exactly how ready they are.
      </p>
      <h2>Three ways to practise</h2>
      <ul>
        <li><b>Coding Game</b>: 357 fill-in-the-blank questions in real code, across TypeScript + React, Python from zero to DSA, and Data + AI. Every answer explains the why.</li>
        <li><b>Study Cards</b>: 1,103 interview flashcards in 11 decks, from React and system design to databases, security, DSA and 100 Python coding problems.</li>
        <li><b>AI Interview Prep</b>: an AI interviewer that asks one question at a time across 35 topics, grades each answer out of 10 with feedback and a model answer, and gets harder as you improve.</li>
      </ul>
      <p>
        A dashboard brings it together, with a readiness score that rewards doing well on hard questions in
        every topic. Progress is saved to your account, so you can pick up on any device.
      </p>
      <h2>Who makes it</h2>
      <p>
        {BRAND} is a product from <b>{OWNER}</b>. Find more at{" "}
        <a href={OWNER_URL} target="_blank" rel="noopener">buildwithpriyanka.in</a>.
      </p>
      <h2>Get in touch</h2>
      <p>
        Questions, feedback or an idea for a new topic? <a href="/contact">Send us a message</a> or email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </Shell>
  );
}

/* ---------- Privacy Policy ---------- */

function Privacy() {
  return (
    <Shell title="Privacy Policy">
      <p className="info-updated">Last updated: {UPDATED}</p>
      <p>
        This policy explains what information {BRAND} (“we”, “us”), a product from {OWNER}, collects when
        you use this website, how we use it, and the choices you have.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><b>Your Google account details.</b> When you sign in with Google we receive your name, email address, profile picture and Google account ID. We never see your Google password.</li>
        <li><b>Your practice progress.</b> Your Coding Game answers, Study Cards you viewed, flagged or edited, your AI Interview Prep questions, answers, scores and levels, the subjects you chose, and your settings. This is stored in our database linked to your account, and in your browser’s local storage.</li>
        <li><b>Messages you send us</b> through the contact form: your name, email address and message.</li>
        <li><b>Technical information.</b> Your IP address is used briefly to prevent spam on the contact form. Our hosting provider may record standard server logs such as IP address, browser type and the pages requested.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To provide the service: sign you in, save your progress and sync it across your devices.</li>
        <li>To generate and grade AI Interview Prep questions.</li>
        <li>To reply to your messages and support requests.</li>
        <li>To keep the service secure and prevent abuse.</li>
        <li>To show advertising that helps fund the service (see section 4).</li>
      </ul>

      <h2>3. Services we rely on</h2>
      <ul>
        <li><b>Google</b> for sign-in (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>).</li>
        <li><b>NVIDIA</b> AI models power AI Interview Prep. The questions you are asked and the answers you type are sent to NVIDIA’s API to create questions and grade answers. Please do not include personal information in your answers.</li>
        <li><b>MongoDB Atlas</b> stores accounts and progress, and <b>Vercel</b> hosts the website.</li>
        <li><b>Voice features</b> use your browser. Reading questions aloud happens on your device. Voice answers use your browser’s speech recognition; in Google Chrome, for example, your browser sends the audio to Google to turn it into text. We never receive or store audio.</li>
        <li><b>Google Analytics</b> counts visits and shows us which pages and sections are used, so we can improve the site. It uses cookies and receives your IP address and browser details (<a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">how Google uses this data</a>).</li>
        <li><b>Google Fonts</b> provides the typefaces used on the site.</li>
      </ul>

      <h2>4. Cookies, local storage and advertising</h2>
      <ul>
        <li><b>ip_session</b>: keeps you signed in for up to 30 days. It cannot be read by scripts on the page.</li>
        <li><b>ip_oauth_state</b> and <b>ip_oauth_next</b>: last 10 minutes and protect the sign-in process.</li>
        <li><b>_ga</b> and <b>_ga_*</b>: Google Analytics cookies that tell visits apart, kept for up to 2 years.</li>
        <li><b>Local storage</b>: your progress, theme and display preferences on this device.</li>
      </ul>
      <p>
        We may show advertisements from Google AdSense and other advertising partners. Third-party vendors,
        including Google, use cookies to serve ads based on a user’s prior visits to this website or other
        websites. Google’s use of advertising cookies enables it and its partners to serve ads to our users
        based on their visit to this site and/or other sites on the Internet.
      </p>
      <p>
        You can opt out of personalised advertising by visiting{" "}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ads Settings</a>, and opt out
        of some third-party vendors’ use of cookies for personalised advertising at{" "}
        <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener">www.aboutads.info</a>. Where the
        law requires it, for example for visitors in the European Economic Area and the UK, we ask for your consent
        before advertising cookies are used.
      </p>

      <h2>5. Sharing</h2>
      <p>
        We do not sell your personal information. We share it only with the service providers above so they can
        run the service for us, or when the law requires it.
      </p>

      <h2>6. How long we keep it, and deleting it</h2>
      <p>
        We keep your account and progress while you use the service. To delete your account and all your progress,
        email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address you sign in with and we will
        delete it. Logging out removes your progress from that browser; it stays saved to your account.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct or delete your personal information,
        or to object to how we use it. To make a request, <a href="/contact">contact us</a>.
      </p>

      <h2>8. Children</h2>
      <p>
        {BRAND} is not directed at children under 13, and we do not knowingly collect information from them.
        If you believe a child has given us information, contact us and we will delete it.
      </p>

      <h2>9. Security</h2>
      <p>
        We use HTTPS, signed sign-in cookies and access-restricted storage to protect your information. No method of
        transmission or storage is completely secure, but we work to keep your information safe.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        If we change this policy we will update the date at the top of this page. Significant changes will be
        highlighted on the site.
      </p>

      <h2>11. Contact</h2>
      <p>
        {OWNER} · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> · <a href="/contact">Contact form</a>
      </p>
    </Shell>
  );
}

/* ---------- Contact ---------- */

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [state, setState] = useState<{ status: "idle" | "sending" | "sent" | "error"; error?: string }>({ status: "idle" });

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) setState({ status: "sent" });
      else setState({ status: "error", error: body.error ?? "Something went wrong. Please email us instead." });
    } catch {
      setState({ status: "error", error: "Could not send. Check your connection, or email us instead." });
    }
  };

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Shell title="Contact us">
      <p className="info-lede">
        Questions, feedback, a bug, or a topic you would like added? We read every message.
      </p>
      {state.status === "sent" ? (
        <div className="info-sent" role="status">
          <b>Thanks, your message is on its way.</b> We will reply to {form.email}.
        </div>
      ) : (
        <form className="info-form" onSubmit={(e) => void submit(e)}>
          <label>
            Your name
            <input required maxLength={100} value={form.name} onChange={set("name")} autoComplete="name" />
          </label>
          <label>
            Your email
            <input required type="email" maxLength={200} value={form.email} onChange={set("email")} autoComplete="email" />
          </label>
          <label>
            Message
            <textarea required rows={6} maxLength={5000} value={form.message} onChange={set("message")} />
          </label>
          {/* Honeypot: hidden from people, tempting to bots. */}
          <label className="info-hp" aria-hidden="true">
            Website
            <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
          </label>
          {state.status === "error" && <p className="info-error" role="alert">{state.error}</p>}
          <button type="submit" disabled={state.status === "sending"}>
            {state.status === "sending" ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
      <p className="info-alt">
        Prefer email? Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </Shell>
  );
}

export function InfoPage({ path }: { path: InfoPath }) {
  if (path === "/about") return <About />;
  if (path === "/privacy") return <Privacy />;
  return <Contact />;
}
