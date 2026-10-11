/* =====================================================================
   prerender.tsx — the public pages as HTML, for search engines.

   Used only at build time (server/seoPlugin.ts): each page is rendered
   with React's server renderer and written into its own .html file, so
   crawlers get real content instead of an empty <div id="root">. In the
   browser the app then renders the same page over it.
   ===================================================================== */

import { renderToString } from "react-dom/server";
import { SignIn } from "./auth/SignIn";
import { InfoPage } from "./info/InfoPages";

export interface PrerenderedPage {
  /** URL path, e.g. "/about". */
  path: string;
  /** Output file in dist/, served at `path` (vercel.json cleanUrls). */
  file: string;
  title: string;
  description: string;
  html: () => string;
}

export const PAGES: readonly PrerenderedPage[] = [
  {
    path: "/",
    file: "index.html",
    title: "AI Interview Prep & Mock Interviews | HyperTransformer AI",
    description:
      "Practise for technical interviews one question at a time: 357 fill-in-the-blank coding questions, 1,103 interview flashcards and an AI interviewer across 35 topics, with a readiness score that shows how ready you are.",
    html: () => renderToString(<SignIn error={null} callbackUrl="" />),
  },
  {
    path: "/about",
    file: "about.html",
    title: "About HyperTransformer AI | Build with Priyanka",
    description:
      "HyperTransformer AI helps developers get ready for technical interviews with coding drills, 1,103 interview flashcards and an AI interviewer. A product from buildwithpriyanka.in.",
    html: () => renderToString(<InfoPage path="/about" />),
  },
  {
    path: "/privacy",
    file: "privacy.html",
    title: "Privacy Policy | HyperTransformer AI",
    description:
      "What HyperTransformer AI collects, how it is used, the services it relies on, cookies and advertising, and how to delete your data.",
    html: () => renderToString(<InfoPage path="/privacy" />),
  },
  {
    path: "/contact",
    file: "contact.html",
    title: "Contact | HyperTransformer AI",
    description: "Questions, feedback, a bug or a topic you would like added? Send the HyperTransformer AI team a message.",
    html: () => renderToString(<InfoPage path="/contact" />),
  },
];
