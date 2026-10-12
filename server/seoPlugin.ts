/* =====================================================================
   seoPlugin.ts — serves the public Study Cards pages (publicCards.ts).

   - `npm run dev`: rendered on request from the live card data.
   - `npm run build`: written as static files into dist/ (cards.html,
     cards/<slug>.html, sitemap.xml, robots.txt). Vercel serves them as
     /cards and /cards/<slug> thanks to "cleanUrls" in vercel.json.
   ===================================================================== */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin, ResolvedConfig } from "vite";
import type { Deck } from "../src/cards/types.js";
import { render404, renderDeck, renderIndex, renderRobots, renderSitemap, slugOf } from "./publicCards.js";

interface PrerenderedPage {
  path: string;
  file: string;
  title: string;
  description: string;
  html: () => string;
}

const attr = (s: string): string => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Puts a page's own title, description and addresses into the built
 *  index.html, and its rendered markup inside #root. */
function fillTemplate(template: string, origin: string, page: PrerenderedPage): string {
  const url = `${origin}${page.path === "/" ? "/" : page.path}`;
  const set = (re: RegExp, value: string, html: string): string => html.replace(re, (_m, a: string, b: string) => `${a}${attr(value)}${b}`);
  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(page.title)}</title>`);
  html = set(/(<meta name="description" content=")[^"]*(")/, page.description, html);
  html = set(/(<link rel="canonical" href=")[^"]*(")/, url, html);
  html = set(/(<meta property="og:url" content=")[^"]*(")/, url, html);
  html = set(/(<meta property="og:title" content=")[^"]*(")/, page.title, html);
  html = set(/(<meta property="og:description" content=")[^"]*(")/, page.description, html);
  html = set(/(<meta name="twitter:title" content=")[^"]*(")/, page.title, html);
  html = set(/(<meta name="twitter:description" content=")[^"]*(")/, page.description, html);
  // data-prerendered: hidden for signed-in visitors so the app shows instead.
  return html.replace('<div id="root"></div>', `<div id="root"><div data-prerendered>${page.html()}</div></div>`);
}

const DECKS_MODULE = "src/cards/data/decks.ts";

/** The Google Analytics 4 tag, when GA_MEASUREMENT_ID (G-…) is set. Only in
 *  built pages, so local development does not count as views. */
function analyticsTag(env: Record<string, string | undefined>): string {
  const id = env.GA_MEASUREMENT_ID?.trim() ?? "";
  if (!/^G-[A-Z0-9]+$/.test(id)) return "";
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag("js",new Date());gtag("config","${id}");</script>
`;
}

/** The site's AdSense publisher ID. Not a secret: it is in every page that
 *  shows ads. ADSENSE_CLIENT overrides it (either "ca-pub-…" or "pub-…"),
 *  and ADSENSE_CLIENT=off turns AdSense off. */
const DEFAULT_ADSENSE_CLIENT = "ca-pub-1248019476008076";

export function adsenseClient(env: Record<string, string | undefined>): string {
  const raw = (env.ADSENSE_CLIENT ?? "").trim().replace(/^["']|["']$/g, "");
  if (raw.toLowerCase() === "off") return "";
  const id = raw === "" ? DEFAULT_ADSENSE_CLIENT : raw.replace(/^pub-/, "ca-pub-");
  return /^ca-pub-\d{10,20}$/.test(id) ? id : "";
}

/** The AdSense script and account tag, when ADSENSE_CLIENT is set. AdSense
 *  uses them to check the site during review, and they load Auto ads. */
function adsenseTag(env: Record<string, string | undefined>): string {
  const id = adsenseClient(env);
  if (!id) return "";
  return `<meta name="google-adsense-account" content="${id}">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${id}" crossorigin="anonymous"></script>
`;
}

/** Everything added to the <head> of built pages: analytics and ads. */
const headTags = (env: Record<string, string | undefined>): string => analyticsTag(env) + adsenseTag(env);
const withAnalytics = (html: string, tag: string): string => (tag ? html.replace("</head>", `${tag}</head>`) : html);

/** The public address used in canonical links and the sitemap. */
export function publicOrigin(env: Record<string, string | undefined>): string {
  if (env.APP_URL) return env.APP_URL.replace(/\/+$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "https://hypertransformerai.com";
}

export function seoPages(env: Record<string, string | undefined>): Plugin {
  let config: ResolvedConfig;
  return {
    name: "public-study-cards",
    configResolved(c) {
      config = c;
    },

    /* Fill in the site address, and the Google Search Console verification
       tag when GOOGLE_SITE_VERIFICATION is set. In dev the address is the
       local server's. */
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const origin = ctx.server ? `http://localhost:${ctx.server.config.server.port ?? 5173}` : publicOrigin(env);
        let out = html.split("__ORIGIN__").join(origin);
        if (env.GOOGLE_SITE_VERIFICATION) {
          out = out.replace("</head>", `  <meta name="google-site-verification" content="${env.GOOGLE_SITE_VERIFICATION.replace(/"/g, "")}" />\n  </head>`);
        }
        return ctx.server ? out : withAnalytics(out, headTags(env));
      },
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? "/").split("?")[0]!.replace(/\/+$/, "") || "/";
        if (path !== "/cards" && !path.startsWith("/cards/") && path !== "/sitemap.xml" && path !== "/robots.txt") return next();
        void (async () => {
          try {
            const { DECKS } = (await server.ssrLoadModule(`/${DECKS_MODULE}`)) as { DECKS: readonly Deck[] };
            const origin = `http://${req.headers.host ?? "localhost:5173"}`;
            let body: string | null = null;
            let type = "text/html; charset=utf-8";
            if (path === "/cards") body = renderIndex(origin, DECKS);
            else if (path === "/sitemap.xml") { body = renderSitemap(origin, DECKS); type = "application/xml"; }
            else if (path === "/robots.txt") { body = renderRobots(origin); type = "text/plain"; }
            else {
              const deck = DECKS.find((d) => slugOf(d.name) === path.slice("/cards/".length));
              if (deck) body = renderDeck(origin, deck, DECKS);
            }
            if (body === null) return next();
            res.statusCode = 200;
            res.setHeader("Content-Type", type);
            res.end(body);
          } catch (err) {
            next(err);
          }
        })();
      });
    },

    async closeBundle() {
      if (config.command !== "build") return;
      // Bundle the card data to a temporary module so Node can import it.
      const { build } = await import("esbuild");
      const tmp = mkdtempSync(join(tmpdir(), "public-cards-"));
      try {
        const outfile = join(tmp, "decks.mjs");
        await build({ entryPoints: [join(config.root, DECKS_MODULE)], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
        const { DECKS } = (await import(pathToFileURL(outfile).href)) as { DECKS: readonly Deck[] };
        const origin = publicOrigin(env);
        const out = join(config.root, config.build.outDir);
        const tag = headTags(env);
        // Every static page gets the analytics tag (index.html has it already).
        const writePage = (file: string, html: string): void => writeFileSync(file, withAnalytics(html, tag));
        mkdirSync(join(out, "cards"), { recursive: true });
        writePage(join(out, "cards.html"), renderIndex(origin, DECKS));
        for (const deck of DECKS) writePage(join(out, "cards", `${slugOf(deck.name)}.html`), renderDeck(origin, deck, DECKS));
        writeFileSync(join(out, "sitemap.xml"), renderSitemap(origin, DECKS));
        writeFileSync(join(out, "robots.txt"), renderRobots(origin));
        writePage(join(out, "404.html"), render404(origin, DECKS));
        // ads.txt: says Google may sell ads on this site (AdSense requires it).
        const adsId = adsenseClient(env);
        if (adsId) writeFileSync(join(out, "ads.txt"), `google.com, ${adsId.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
        config.logger.info(`  public Study Cards: ${DECKS.length + 1} pages, sitemap.xml, robots.txt, 404 (${origin})`);

        /* Pre-render the app's public pages (landing, About, Privacy,
           Contact) with React's server renderer, into the built index.html. */
        const { build: viteBuild } = await import("vite");
        // Inside the project, so the bundle's imports (react, ...) resolve.
        const ssrOut = join(config.root, "node_modules", ".prerender");
        await viteBuild({
          configFile: false,
          root: config.root,
          logLevel: "silent",
          // Same build-time constants as the app (e.g. __ADSENSE__).
          define: config.define,
          build: { ssr: "src/prerender.tsx", outDir: ssrOut, emptyOutDir: true, rollupOptions: { output: { format: "esm", entryFileNames: "prerender.mjs" } } },
        });
        const { PAGES } = (await import(pathToFileURL(join(ssrOut, "prerender.mjs")).href)) as { PAGES: readonly PrerenderedPage[] };
        const template = readFileSync(join(out, "index.html"), "utf8");
        for (const page of PAGES) writeFileSync(join(out, page.file), fillTemplate(template, origin, page));
        rmSync(ssrOut, { recursive: true, force: true });
        config.logger.info(`  pre-rendered: ${PAGES.map((p) => p.path).join(", ")}`);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    },
  };
}
