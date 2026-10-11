/* =====================================================================
   MainApp.tsx — the signed-in app: which mode is on screen (Home, Coding
   Game, Study Cards or Interview Prep) and, inside the game, which track.

   Loaded lazily by App.tsx, so visitors on the landing page do not
   download the question banks.
   ===================================================================== */

import { Suspense, lazy, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AppMode, TrackId } from "./types";
import { TRACKS, TRACK_BY_ID } from "./data/tracks";
import { Tabs } from "./components/Tabs";
import { TrackView } from "./components/TrackView";
import type { AuthUser } from "./auth/useAuth";
import type { HomeTarget } from "./home/HomeMode";
import { initialTrack, rememberTrack } from "./home/subjects";
import { TrackPicker } from "./components/TrackPicker";
import { UserMenu } from "./auth/UserMenu";
import { ThemeToggle } from "./theme/ThemeToggle";
import { DuckHost } from "./duck/DuckHost";
import { AdLayout } from "./ads/AdLayout";
import { SiteFooter } from "./info/InfoPages";
import { BRAND } from "./brand";
import { trackSection } from "./analytics";

/* The flashcard decks are ~1,100 cards of text. Loading that mode lazily
   keeps it out of the bundle until someone actually opens Study Cards. */
const CardsMode = lazy(() =>
  import("./cards/CardsMode").then((m) => ({ default: m.CardsMode })),
);
const PrepMode = lazy(() =>
  import("./prep/PrepMode").then((m) => ({ default: m.PrepMode })),
);
const AdminMode = lazy(() =>
  import("./admin/AdminMode").then((m) => ({ default: m.AdminMode })),
);
const HomeMode = lazy(() =>
  import("./home/HomeMode").then((m) => ({ default: m.HomeMode })),
);

/* Home is not in this list: it has its own house button beside the tabs. */
const MODES: readonly { id: Exclude<AppMode, "home">; label: string }[] = [
  { id: "game", label: "Coding Game" },
  { id: "cards", label: "Study Cards" },
  { id: "prep", label: "Interview Prep" },
];

/** Wraps the page in the left/right ad rails when `show` is true. */
function MaybeAds({ show, children }: { show: boolean; children: ReactNode }) {
  return show ? <AdLayout>{children}</AdLayout> : <>{children}</>;
}

const MODE_TITLES: Record<AppMode, string> = {
  home: "Dashboard",
  game: "Coding Game",
  cards: "Study Cards",
  prep: "AI Interview Prep",
  admin: "Admin",
};

export interface Launch {
  /** ?open=cards: start on Study Cards. */
  cards: boolean;
  /** ?deck=…: on this deck. */
  deck: string | undefined;
}

interface MainAppProps {
  /** null when Google sign-in is not configured and the app runs open. */
  user: AuthUser | null;
  welcome: boolean;
  launch: Launch;
  onLogout: () => Promise<void>;
}

export default function MainApp({ user, welcome, launch, onLogout }: MainAppProps) {
  // Where to open: /admin (admins only), ?open=cards (see App.tsx), else Home.
  const [mode, setMode] = useState<AppMode>(() =>
    window.location.pathname.replace(/\/+$/, "") === "/admin" && user?.isAdmin ? "admin" : launch.cards ? "cards" : "home",
  );

  useEffect(() => {
    document.title = `${MODE_TITLES[mode]} | ${BRAND}`;
    trackSection(mode === "home" ? "/app" : `/app/${mode}`, document.title);
  }, [mode]);

  /* Keep the address bar in step, so /admin can be bookmarked and shared
     between admins. Everything else lives at /. */
  useEffect(() => {
    const path = mode === "admin" ? "/admin" : "/";
    if (window.location.pathname !== path) {
      window.history.replaceState(null, "", path + window.location.hash);
    }
  }, [mode]);
  /* null = Coding Game has never been opened: show the track picker. */
  const [trackId, setTrackIdState] = useState<TrackId | null>(initialTrack);
  const setTrackId = (id: TrackId): void => {
    rememberTrack(id);
    setTrackIdState(id);
  };
  /** A deck chosen on Home (or a public deck page); Study Cards opens straight onto it. */
  const [deckToOpen, setDeckToOpen] = useState<string | undefined>(launch.deck);

  const openFromHome = (target: HomeTarget): void => {
    if (target.mode === "game" && target.track) setTrackId(target.track);
    setDeckToOpen(target.mode === "cards" ? target.deck : undefined);
    setMode(target.mode);
    window.scrollTo({ top: 0 });
  };
  const [showWelcome, setShowWelcome] = useState<boolean>(welcome && user !== null);
  const track = trackId ? TRACK_BY_ID[trackId] : null;

  useEffect(() => {
    if (!showWelcome) return;
    const t = window.setTimeout(() => setShowWelcome(false), 6000);
    return () => window.clearTimeout(t);
  }, [showWelcome]);

  return (
    <>
      <header>
        <div className="bar">
          <button
            type="button"
            className={`home-btn${mode === "home" ? " home-btn--on" : ""}`}
            aria-label="Home"
            aria-current={mode === "home" ? "page" : undefined}
            title="Home: your progress"
            onClick={() => {
              setDeckToOpen(undefined);
              setMode("home");
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9v11h5v-6h4v6h5V9" />
            </svg>
          </button>
          <div className="modes" role="tablist" aria-label="Mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                className={`mode${mode === m.id ? " mode--on" : ""}`}
                onClick={() => {
                  setDeckToOpen(undefined);
                  setMode(m.id);
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          {/* Track tabs once a track is picked; the first visit shows the picker. */}
          {mode === "game" && trackId && <Tabs tracks={TRACKS} value={trackId} onChange={setTrackId} />}
          <div className="bar__end">
            {/* Admin has no button: admins open it at /admin. */}
            <ThemeToggle />
            {user && <UserMenu user={user} onLogout={onLogout} />}
          </div>
        </div>
      </header>

      <DuckHost firstName={user ? (user.name.split(" ")[0] ?? "") : ""} />

      {/* Equal ad space left and right on every page (not the private Admin page). */}
      <MaybeAds show={mode !== "admin"}>
        {showWelcome && user && (
          <div className="welcome" role="status">
            Welcome, {user.name.split(" ")[0]}! Your account is ready.
            <button type="button" aria-label="Dismiss" onClick={() => setShowWelcome(false)}>
              ×
            </button>
          </div>
        )}

        {mode === "game" ? (
          <div className="wrap">
            {/* key={trackId} remounts the whole view on a tab change, so each
                track's progress and position start clean. */}
            {track ? <TrackView key={track.id} track={track} /> : <TrackPicker tracks={TRACKS} onPick={setTrackId} />}
          </div>
        ) : (
          <Suspense fallback={null}>
            {mode === "home" && (
              <HomeMode firstName={user ? (user.name.split(" ")[0] ?? null) : null} onOpen={openFromHome} />
            )}
            {mode === "cards" && (
              <CardsMode
                key={deckToOpen ?? "topics"}
                openDeck={deckToOpen}
                firstName={user?.name.split(" ")[0]}
              />
            )}
            {mode === "prep" && <PrepMode />}
            {mode === "admin" && user?.isAdmin && <AdminMode />}
          </Suspense>
        )}
      </MaybeAds>
      <SiteFooter
        onStudyCards={() => {
          setDeckToOpen(undefined);
          setMode("cards");
          window.scrollTo({ top: 0 });
        }}
      />
    </>
  );
}
