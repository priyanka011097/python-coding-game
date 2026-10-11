/* =====================================================================
   App.tsx — the sign-in gate: the landing page, the public info pages,
   or (once signed in and the progress is loaded) the app in MainApp.tsx.
   ===================================================================== */

import { Suspense, lazy, useEffect, useState } from "react";
import { takeAuthNotice, useAuth } from "./auth/useAuth";
import { SignIn } from "./auth/SignIn";
import { likelySignedIn, setSignedInHint } from "./auth/signedInHint";
import { InfoPage, infoPathOf } from "./info/InfoPages";
import { forget, hydrate, trySaveAll } from "./sync/progressSync";
import type { Launch } from "./MainApp";

/* The signed-in app, with all the question banks, loads only after
   sign-in, which keeps the landing page small and fast. */
const MainApp = lazy(() => import("./MainApp"));

/* ?open=cards[&deck=…] (from the public card pages or the footer) opens
   Study Cards, on that deck. Read once at load and removed from the address
   bar: doing this inside a state initialiser broke under StrictMode, which
   runs initialisers twice, so the second run found the address already
   cleaned. */
const LAUNCH: Launch = (() => {
  const q = new URLSearchParams(window.location.search);
  const open = q.get("open");
  const deck = q.get("deck") ?? undefined;
  if (open) {
    q.delete("open");
    q.delete("deck");
    const rest = q.toString();
    window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash);
  }
  return { cards: open === "cards", deck: open === "cards" ? deck : undefined };
})();

// Read once, before the first render clears the address bar.
const notice = takeAuthNotice();

export default function App() {
  const { auth, logout } = useAuth();
  /* Which account's progress is loaded into this browser. The app waits
     for it, because every mode reads its saved state once, on mount. */
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const userId = auth.status === "signed-in" ? auth.user.id : null;

  useEffect(() => {
    if (auth.status !== "loading") setSignedInHint(auth.status === "signed-in");
  }, [auth.status]);

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

  // About, Privacy and Contact are public: no sign-in, no waiting for it.
  const infoPath = infoPathOf(window.location.pathname);
  if (infoPath) return <InfoPage path={infoPath} />;

  /* While the sign-in check runs, keep showing the pre-rendered landing
     page to visitors who are probably signed out, instead of a blank page. */
  if (auth.status === "loading") return likelySignedIn() ? null : <SignIn error={notice.error} callbackUrl="" />;
  if (auth.status === "signed-out") {
    return <SignIn error={notice.error} callbackUrl={auth.callbackUrl} />;
  }
  if (auth.status === "signed-in" && hydratedFor !== auth.user.id) {
    return <p className="loading-progress">Loading your progress…</p>;
  }
  return (
    <Suspense fallback={<p className="loading-progress">Loading your progress…</p>}>
      <MainApp
        user={auth.status === "signed-in" ? auth.user : null}
        welcome={notice.welcome}
        launch={LAUNCH}
        onLogout={handleLogout}
      />
    </Suspense>
  );
}

