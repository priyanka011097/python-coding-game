/* =====================================================================
   App.tsx — the sign-in gate, then which mode is on screen (Home, Coding
   Game, Study Cards or Interview Prep) and, inside the game, which track.
   ===================================================================== */

import { Suspense, lazy, useEffect, useState } from "react";
import type { AppMode, TrackId } from "./types";
import { TRACKS, TRACK_BY_ID } from "./data/tracks";
import { Tabs } from "./components/Tabs";
import { TrackView } from "./components/TrackView";
import { takeAuthNotice, useAuth } from "./auth/useAuth";
import type { AuthUser } from "./auth/useAuth";
import type { HomeTarget } from "./home/HomeMode";
import { initialTrack, rememberTrack } from "./home/subjects";
import { TrackPicker } from "./components/TrackPicker";
import { SignIn } from "./auth/SignIn";
import { UserMenu } from "./auth/UserMenu";
import { ThemeToggle } from "./theme/ThemeToggle";
import { DuckHost } from "./duck/DuckHost";
import { forget, hydrate, trySaveAll } from "./sync/progressSync";

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


// Read once, before the first render clears the address bar.
const notice = takeAuthNotice();

export default function App() {
  const { auth, logout } = useAuth();
  /* Which account's progress is loaded into this browser. The app waits
     for it, because every mode reads its saved state once, on mount. */
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const userId = auth.status === "signed-in" ? auth.user.id : null;

  useEffect(() => {
    if (!userId) return;
    let live = true;
    void hydrate(userId).then(() => {
      if (live) setHydratedFor(userId);
    });
    return () => {
      live = false;
    };
  }, [userId]);

  const handleLogout = async (): Promise<void> => {
    const saved = await trySaveAll();
    if (
      !saved &&
      !window.confirm(
        "Some recent progress could not be saved to your account (are you offline?). " +
          "Log out anyway? It will stay in this browser and sync next time you sign in here.",
      )
    ) {
      return;
    }
    forget(!saved);
    setHydratedFor(null);
    await logout();
  };

  if (auth.status === "loading") return null;
  if (auth.status === "signed-out") {
    return <SignIn error={notice.error} callbackUrl={auth.callbackUrl} />;
  }
  if (auth.status === "signed-in" && hydratedFor !== auth.user.id) {
    return <p className="loading-progress">Loading your progress…</p>;
  }
  return (
    <MainApp
      user={auth.status === "signed-in" ? auth.user : null}
      welcome={notice.welcome}
      onLogout={handleLogout}
    />
  );
}

interface MainAppProps {
  /** null when Google sign-in is not configured and the app runs open. */
  user: AuthUser | null;
  welcome: boolean;
  onLogout: () => Promise<void>;
}

function MainApp({ user, welcome, onLogout }: MainAppProps) {
  // Every visit starts on the Home dashboard.
  // Every visit starts on Home, except the /admin address (admins only).
  const [mode, setMode] = useState<AppMode>(() =>
    window.location.pathname.replace(/\/+$/, "") === "/admin" && user?.isAdmin ? "admin" : "home",
  );

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
  /** A deck chosen on Home; Study Cards opens straight onto it. */
  const [deckToOpen, setDeckToOpen] = useState<string | undefined>(undefined);

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
    </>
  );
}
