/* =====================================================================
   publicCards.ts — public, search-engine-friendly Study Cards pages.

     /cards           every deck, with its card count
     /cards/<slug>    the FIRST 5 cards of one deck, then "sign in for the rest"
     /sitemap.xml     every public page, for search engines
     /robots.txt      allow the public pages, keep /api, /auth, /admin out

   These are plain HTML (no JavaScript needed to read them), so search
   engines see the full questions and answers. Each deck page carries a
   title, description, canonical link, social preview tags and FAQPage
   structured data.
   ===================================================================== */

import type { Deck } from "../src/cards/types.js";
import { slugOf } from "../src/cards/slug.js";

/** How many cards of each deck are public. */
export const PUBLIC_CARDS = 5;

export { slugOf };

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Plain text of an answer (code fences removed), for descriptions and FAQ data. */
const plain = (a: string): string => a.replace(/~~~[\s\S]*?~~~/g, " ").replace(/\s+/g, " ").trim();

/** An answer as HTML: ~~~ fences become code blocks, the rest paragraphs. */
function answerHtml(a: string): string {
  const out: string[] = [];
  const fence = /~~~([\s\S]*?)~~~/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const prose = (t: string): void => {
    for (const para of t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)) out.push(`<p>${esc(para)}</p>`);
  };
  while ((m = fence.exec(a)) !== null) {
    prose(a.slice(last, m.index));
    out.push(`<pre><code>${esc((m[1] ?? "").replace(/^\n+|\n+$/g, ""))}</code></pre>`);
    last = m.index + m[0].length;
  }
  prose(a.slice(last));
  return out.join("\n");
}

/* Same tokens and look as the app's Study Cards screen (src/styles.css,
   src/cards/cards.css), so the public pages feel like the product. */
const CSS = `
:root{color-scheme:dark;--paper:#000;--surface:#0A0A0A;--surface-2:#161616;--code-bg:#000;--ink:#F2F3F5;--ink-2:#A7ABB2;--ink-3:#787D85;--line:#242628;--line-2:#3B3E43;--accent:#8AA4FF;--accent-soft:#151A2B;--accent-ink:#B3C4FF;--on-accent:#000;--shadow:0 1px 2px rgba(0,0,0,.6),0 10px 30px -14px rgba(0,0,0,.9)}
:root[data-theme=light]{color-scheme:light;--paper:#F5F6F8;--surface:#fff;--surface-2:#EEF0F3;--code-bg:#F6F8FA;--ink:#15171B;--ink-2:#474C55;--ink-3:#656B74;--line:#E1E4E8;--line-2:#C9CED5;--accent:#3451D1;--accent-soft:#E8EDFF;--accent-ink:#2A40A8;--on-accent:#fff;--shadow:0 1px 2px rgba(16,24,40,.06),0 8px 24px -12px rgba(16,24,40,.16)}
*{box-sizing:border-box}html{background:var(--paper)}body{margin:0;background:var(--paper);color:var(--ink);font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column}
a{color:var(--accent-ink)}
.top{border-bottom:1px solid var(--line)}
.bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px}
.brand{display:inline-flex;align-items:center;gap:10px;font-weight:700;color:var(--ink);text-decoration:none}
.mark{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:var(--accent);color:var(--on-accent);font-size:12px}
.end{display:flex;align-items:center;gap:10px}
.tt{display:grid;place-items:center;width:34px;height:34px;border-radius:8px;border:1px solid var(--line-2);background:transparent;color:var(--ink-2);cursor:pointer}
.signin{display:inline-flex;align-items:center;height:34px;padding:0 14px;border-radius:8px;background:var(--accent);color:var(--on-accent);font-weight:600;font-size:13.5px;text-decoration:none}
.sc{flex:1;width:100%;max-width:760px;margin:0 auto;padding:24px 16px 40px;display:flex;flex-direction:column}
.crumbs{font-size:12.5px;color:var(--ink-3);margin:0 0 10px}.crumbs a{color:var(--ink-3)}
h1{font-size:22px;font-weight:600;margin:0 0 12px;line-height:1.3;letter-spacing:-.01em}
h1 small{display:block;font-size:13px;font-weight:500;color:var(--ink-3);letter-spacing:0;margin-top:2px}
.row{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.pill{background:var(--accent);color:var(--on-accent);padding:10px 18px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none}
.counter{color:var(--ink-2);font-size:13px;font-family:"IBM Plex Mono",monospace}
.prog{display:flex;align-items:center;gap:12px;margin:14px 0 24px}
.prog .track{flex:1;height:8px;background:var(--surface-2);border:1px solid var(--line);border-radius:999px;overflow:hidden}
.prog .fill{height:100%;background:var(--accent);border-radius:999px;transition:width .3s ease}
.prog span{color:var(--ink-3);font-size:12px;font-family:"IBM Plex Mono",monospace;white-space:nowrap}
.deck{flex:1;display:flex;flex-direction:column;gap:14px}
.fc{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:28px;box-shadow:var(--shadow)}
.label{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink-3);font-weight:600;margin-bottom:8px}
.q{font-size:19px;font-weight:600;line-height:1.45;margin:0 0 20px}
.div{height:1px;background:var(--line);margin:16px 0}
.ahead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.ahead .label{margin:0}
.read{display:none;align-items:center;justify-content:center;min-width:38px;padding:6px 10px;border-radius:999px;border:1px solid var(--line-2);background:transparent;color:var(--ink-2);cursor:pointer;font-size:14px}
.js .read{display:inline-flex}.read.on{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.a{font-size:16px;line-height:1.65;color:var(--ink)}.a p{margin:0 0 10px}
pre{background:var(--code-bg);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:10px 0;overflow-x:auto;font-size:13px;line-height:1.55}
code{font-family:"IBM Plex Mono",ui-monospace,monospace}
.lock .ghost{filter:blur(5px);opacity:.7;user-select:none;pointer-events:none}
.lock .ghost i{display:block;height:12px;border-radius:6px;background:var(--line-2);margin:10px 0}
.lock .over{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;text-align:center}
.lock .over b{font-size:19px}.lock .over p{margin:0;color:var(--ink-2);max-width:40ch}
.gbtn{display:inline-flex;align-items:center;gap:12px;min-height:46px;padding:0 22px;margin-top:4px;border-radius:10px;background:#fff;color:#1f1f1f;border:1px solid #dadce0;font-family:Roboto,"IBM Plex Sans",sans-serif;font-size:15px;font-weight:600;text-decoration:none;box-shadow:0 1px 2px rgba(16,24,40,.08)}
.gbtn:hover{background:#f6f8fb}
.foot{display:none;gap:12px;margin-top:24px}.js .foot{display:flex}
.nav{flex:1;padding:14px 18px;border-radius:12px;border:1px solid var(--line-2);background:var(--surface);color:var(--ink);font:inherit;font-size:15px;font-weight:500;cursor:pointer}
.nav.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:600}
.nav:disabled{opacity:.45;cursor:default}
/* With JavaScript the deck shows one card at a time, like the app. Without
   it (and for search engines) every card is listed. */
.js .deck>.fc{display:none}.js .deck>.fc.show{display:block;animation:in .25s ease}
@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.home-title{font-size:26px;font-weight:700;margin:0 0 4px;letter-spacing:-.015em}
.sub{color:var(--ink-2);font-size:14px;margin:0 0 22px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;list-style:none;margin:0;padding:0}
.tc{display:flex;flex-direction:column;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px;color:var(--ink);text-decoration:none;transition:transform .15s ease,border-color .15s ease}
.tc:hover{border-color:var(--accent);transform:translateY(-2px)}
.tc .t{display:flex;align-items:center;gap:12px}.tc .i{font-size:28px;line-height:1}.tc b{font-size:15px}
.tc small{display:block;font-size:12px;color:var(--ink-3);font-family:"IBM Plex Mono",monospace;margin-top:2px}
.tc .bar2{height:6px;background:var(--surface-2);border-radius:999px}
.more{font-size:13.5px;color:var(--ink-3);margin-top:22px}.more a{margin-right:12px;white-space:nowrap}
footer{display:flex;justify-content:center;gap:10px 22px;flex-wrap:wrap;padding:22px 24px 30px;border-top:1px solid var(--line);font-size:13px;color:var(--ink-3)}
footer a{color:var(--ink-2);text-decoration:none;font-weight:500}footer .own{color:var(--accent-ink);font-weight:600}
@media (max-width:480px){h1{font-size:18px}.q{font-size:17px}.a{font-size:15px}.fc{padding:22px}.home-title{font-size:22px}}
`;

/* Theme: same rule as the app (saved choice, else the system setting),
   applied before paint. */
const THEME_JS = `(function(){var t=null;try{t=localStorage.getItem("interview-prep-theme")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t);document.documentElement.classList.add("js")})();`;

const TOGGLE_JS = `document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".tt");if(!b)return;var r=document.documentElement,n=r.getAttribute("data-theme")==="light"?"dark":"light";r.setAttribute("data-theme",n);try{localStorage.setItem("interview-prep-theme",n)}catch(x){}});`;

/* One card at a time, Previous / Next, arrow keys, read aloud. The last
   "card" is the locked one that asks the visitor to sign in. */
/* Signed in already? Then this page is the wrong place to study: open the
   app (on this deck), where progress is saved. Runs on every public page. */
const SIGNED_IN_JS = `fetch("/api/me",{credentials:"same-origin",cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(m){if(m&&m.user){var d=document.body.dataset.deck;location.replace("/?open=cards"+(d?"&deck="+encodeURIComponent(d):""))}}).catch(function(){});`;

const DECK_JS = `(function(){var cards=[].slice.call(document.querySelectorAll(".deck>.fc"));if(!cards.length)return;var total=+document.body.dataset.total,i=0,deck=document.body.dataset.deck;
/* Not signed in: remember viewed cards in the same place the app keeps them,
   so they count on the dashboard once this visitor signs up. */
function mark(n){try{var k="studycards_completed_v1",v=JSON.parse(localStorage.getItem(k)||"{}");if(!v[deck+"::"+n]){v[deck+"::"+n]=1;localStorage.setItem(k,JSON.stringify(v))}}catch(e){}}
var prev=document.getElementById("prev"),next=document.getElementById("next"),counter=document.getElementById("counter"),fill=document.getElementById("fill"),seen=document.getElementById("seen");
function stop(){if(window.speechSynthesis)speechSynthesis.cancel();[].forEach.call(document.querySelectorAll(".read.on"),function(b){b.classList.remove("on")})}
function show(n){stop();i=Math.max(0,Math.min(cards.length-1,n));cards.forEach(function(c,k){c.classList.toggle("show",k===i)});var locked=cards[i].classList.contains("lock");
counter.textContent=(locked?i:i+1)+" / "+total;fill.style.width=((Math.min(i+1,cards.length-1))/total*100)+"%";seen.textContent=Math.min(i+1,cards.length-1)+" / "+total+" viewed";
prev.disabled=i===0;next.disabled=i===cards.length-1;if(!locked)mark(i);}
prev.onclick=function(){show(i-1)};next.onclick=function(){show(i+1)};
document.addEventListener("keydown",function(e){if(e.key==="ArrowRight")show(i+1);else if(e.key==="ArrowLeft")show(i-1)});
if(!("speechSynthesis" in window))[].forEach.call(document.querySelectorAll(".read"),function(b){b.remove()});
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".read");if(!b)return;if(speechSynthesis.speaking){stop();return}
var a=b.closest(".fc").querySelector(".a").cloneNode(true);[].forEach.call(a.querySelectorAll("pre"),function(p){p.textContent=". The code is shown on screen. "});
var u=new SpeechSynthesisUtterance(a.textContent.replace(/\\s+/g," ").replace(/([.!?:])(\\s*\\.)+/g,"$1").trim());u.lang="en-US";u.onend=u.onerror=function(){b.classList.remove("on")};b.classList.add("on");speechSynthesis.speak(u)});
show(0)})();`;

/* Google's "G", for the sign-in button (same as the app's landing page). */
const GOOGLE_G = `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;

const SUN = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;

function page(opts: { origin: string; path: string; title: string; description: string; body: string; jsonLd?: unknown; total?: number; deck?: string; script?: string; noindex?: boolean }): string {
  const url = `${opts.origin}${opts.path}`;
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
${opts.noindex ? `<meta name="robots" content="noindex">` : `<link rel="canonical" href="${esc(url)}">`}
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:image" content="${esc(opts.origin)}/og-image.png?v=2"><meta name="twitter:image" content="${esc(opts.origin)}/og-image.png?v=2">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<script>${THEME_JS}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
<style>${CSS}</style>
${opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body${opts.total ? ` data-total="${opts.total}"` : ""}${opts.deck ? ` data-deck="${esc(opts.deck)}"` : ""}>
<header class="top"><div class="bar"><a class="brand" href="/"><span class="mark">HT</span>HyperTransformer AI</a><div class="end"><button type="button" class="tt" aria-label="Switch light or dark mode">${SUN}</button><a class="signin" href="/">Sign in</a></div></div></header>
${opts.body}
<footer><span>A product from <a class="own" href="https://buildwithpriyanka.in">buildwithpriyanka.in</a></span><a href="/cards">Study cards</a><a href="/about">About</a><a href="/privacy">Privacy Policy</a><a href="/contact">Contact</a></footer>
<script>${TOGGLE_JS}${SIGNED_IN_JS}${opts.script ?? ""}</script>
</body>
</html>
`;
}

export function renderIndex(origin: string, decks: readonly Deck[]): string {
  const total = decks.reduce((n, d) => n + d.cards.length, 0);
  const items = decks
    .map((d) => `<li><a class="tc" href="/cards/${slugOf(d.name)}"><span class="t"><span class="i">${d.icon}</span><span><b>${esc(d.name)}</b><small>${Math.min(PUBLIC_CARDS, d.cards.length)} to try · ${d.cards.length} cards</small></span></span><span class="bar2"></span></a></li>`)
    .join("\n");
  return page({
    origin,
    path: "/cards",
    title: "Interview flashcards: React, system design, DSA and more | HyperTransformer AI",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Interview flashcard decks",
      itemListElement: decks.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: `${d.name} interview questions`, url: `${origin}/cards/${slugOf(d.name)}` })),
    },
    description: `${total.toLocaleString("en")} interview questions with clear answers across ${decks.length} topics: React, JavaScript and TypeScript, backend, databases, system design, AI, DevOps, security, testing, DSA and Python coding problems.`,
    body: `<main class="sc">
<h1 class="home-title">Interview Study Cards</h1>
<p class="sub">Pick a topic to begin. Try the first ${PUBLIC_CARDS} cards of any deck, then sign in to study all ${total.toLocaleString("en")}.</p>
<ul class="grid">
${items}
</ul>
</main>`,
  });
}

export function renderDeck(origin: string, deck: Deck, decks: readonly Deck[]): string {
  const shown = deck.cards.slice(0, PUBLIC_CARDS);
  const rest = deck.cards.length - shown.length;
  const cards = shown
    .map(
      (c) => `<article class="fc">
<div class="label">Question</div>
<h2 class="q">${esc(c.q)}</h2>
<div class="div"></div>
<div class="ahead"><div class="label">Answer</div><button type="button" class="read" aria-label="Read answer aloud">🔊</button></div>
<div class="a">${answerHtml(c.a)}</div>
</article>`,
    )
    .join("\n");
  const locked =
    rest > 0
      ? `<article class="fc lock" aria-label="Sign in to see more cards">
<div class="ghost" aria-hidden="true"><div class="label">Question</div><i style="width:70%"></i><div class="div"></div><div class="label">Answer</div><i></i><i style="width:92%"></i><i style="width:80%"></i><i style="width:60%"></i></div>
<div class="over"><b>${rest} more ${esc(deck.name)} cards</b><p>Sign in with Google to study the whole deck, flag tricky answers and track your progress.</p><a class="gbtn" href="/auth/google">${GOOGLE_G}Continue with Google</a></div>
</article>`
      : "";
  const others = decks
    .filter((d) => d.name !== deck.name)
    .map((d) => `<a href="/cards/${slugOf(d.name)}">${esc(d.name)}</a>`)
    .join(" ");
  const first = shown[0];
  return page({
    origin,
    path: `/cards/${slugOf(deck.name)}`,
    title: `${deck.name} interview questions and answers | HyperTransformer AI`,
    description: `${deck.cards.length} ${deck.name} interview questions with clear answers.${first ? ` Starts with: ${first.q}` : ""}`.slice(0, 300),
    total: deck.cards.length,
    deck: deck.name,
    script: DECK_JS,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "FAQPage",
          mainEntity: shown.map((c) => ({
            "@type": "Question",
            name: c.q,
            acceptedAnswer: { "@type": "Answer", text: plain(c.a) },
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "HyperTransformer AI", item: `${origin}/` },
            { "@type": "ListItem", position: 2, name: "Study cards", item: `${origin}/cards` },
            { "@type": "ListItem", position: 3, name: deck.name, item: `${origin}/cards/${slugOf(deck.name)}` },
          ],
        },
      ],
    },
    body: `<main class="sc">
<p class="crumbs"><a href="/cards">Study cards</a> › ${esc(deck.name)}</p>
<h1>${esc(deck.name)}<small>Interview questions and answers</small></h1>
<div class="row"><a class="pill" href="/cards">← Topics</a><span class="counter" id="counter">1 / ${deck.cards.length}</span></div>
<div class="prog"><div class="track"><div class="fill" id="fill" style="width:${(1 / deck.cards.length) * 100}%"></div></div><span id="seen">1 / ${deck.cards.length} viewed</span></div>
<div class="deck">
${cards}
${locked}
</div>
<div class="foot"><button type="button" class="nav" id="prev">← Previous</button><button type="button" class="nav primary" id="next">Next →</button></div>
<p class="more"><b>More topics:</b> ${others}</p>
</main>`,
  });
}

export function renderSitemap(origin: string, decks: readonly Deck[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const pages: [string, string][] = [
    ["/", "1.0"],
    ["/cards", "0.9"],
    ...decks.map((d): [string, string] => [`/cards/${slugOf(d.name)}`, "0.8"]),
    ["/about", "0.5"],
    ["/contact", "0.4"],
    ["/privacy", "0.3"],
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([p, pr]) => `  <url><loc>${esc(origin + p)}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join("\n")}
</urlset>
`;
}

/** Shown for any address that does not exist (Vercel serves 404.html). */
export function render404(origin: string, decks: readonly Deck[]): string {
  return page({
    origin,
    path: "/404",
    title: "Page not found | HyperTransformer AI",
    description: "That page does not exist.",
    noindex: true,
    body: `<main class="sc"><h1 class="home-title">Page not found</h1>
<p class="sub">That address does not exist, but there is plenty to practise. Pick a topic:</p>
<ul class="grid">${decks.slice(0, 6).map((d) => `<li><a class="tc" href="/cards/${slugOf(d.name)}"><span class="t"><span class="i">${d.icon}</span><span><b>${esc(d.name)}</b><small>${d.cards.length} cards</small></span></span></a></li>`).join("")}</ul>
<p class="more"><a href="/">Go to HyperTransformer AI</a> <a href="/cards">All study cards</a></p></main>`,
  });
}

export function renderRobots(origin: string): string {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /admin

Sitemap: ${origin}/sitemap.xml
`;
}
