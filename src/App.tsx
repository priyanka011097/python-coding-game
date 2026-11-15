/* =====================================================================
   App.tsx — what to show first: the landing page, the public info pages,
   or the app in MainApp.tsx. The app works without an account (progress
   stays in this browser); signed-in users get it synced to their account.
   ===================================================================== */

import { Suspense, lazy, useEffect, useState } from "react";
import { takeAuthNotice, useAuth } from "./auth/useAuth";
import { SignIn } from "./auth/SignIn";
import { hasStarted, likelySignedIn, markStarted, setSignedInHint } from "./auth/signedInHint";
import { InfoPage, infoPathOf } from "./info/InfoPages";
import { forget, hydrate, trySaveAll } from "./sync/progressSync";
import type { Launch } from "./MainApp";

/* The app, with all the question banks, loads only once someone opens it,
   which keeps the landing page small and fast. */
const MainApp = lazy(() => import("./MainApp"));

/* ?open=cards[&deck=…] (from the public card pages or the footer) opens
   Study Cards, on that deck; ?start (the landing page's button without
   JavaScript) opens the app. Read once at load and removed from the address
   bar: doing this inside a state initialiser broke under StrictMode, which
   runs initialisers twice, so the second run found the address already
   cleaned. */
const LAUNCH: Launch = (() => {
  const q = new URLSearchParams(window.location.search);
  const open = q.get("open");
  const deck = q.get("deck") ?? undefined;
  const start = q.has("start");
  if (open || start) {
    q.delete("open");
    q.delete("deck");
    q.delete("start");
    const rest = q.toString();
    window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash);
  }
  if (open || start) markStarted();
  return { cards: open === "cards", deck: open === "cards" ? deck : undefined };
})();

const IS_ADMIN_PATH = window.location.pathname.replace(/\/+$/, "") === "/admin";

/** /admin needs an admin account: send signed-out visitors to sign in. */
function SignInRedirect({ next }: { next: string }) {
  useEffect(() => {
    window.location.replace(`/auth/google?next=${encodeURIComponent(next)}`);
  }, [next]);
  return null;
}

// Read once, before the first render clears the address bar.
const notice = takeAuthNotice();

export default function App() {
  const { auth, logout } = useAuth();
  /* Opened the app on this device before (or just now): skip the landing page. */
  const [started, setStarted] = useState<boolean>(hasStarted);
  /* A failed sign-in shows its message on the landing page, once. */
  const [showError, setShowError] = useState<boolean>(notice.error !== null);
  const start = (): void => {
    markStarted();
    setStarted(true);
    setShowError(false);
    window.scrollTo({ top: 0 });
  };
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
     page to new visitors, instead of a blank page. */
  if (auth.status === "loading") {
    return likelySignedIn() || started ? null : <SignIn error={notice.error} callbackUrl="" onStart={start} />;
  }
  if (auth.status === "signed-out") {
    if (IS_ADMIN_PATH) return <SignInRedirect next="/admin" />;
    if (!started || showError) return <SignIn error={notice.error} callbackUrl={auth.callbackUrl} onStart={start} />;
  }
  if (auth.status === "signed-in" && hydratedFor !== auth.user.id) {
    return <p className="loading-progress">Loading your progress…</p>;
  }
  return (
    <Suspense fallback={<p className="loading-progress">Loading your progress…</p>}>
      <MainApp
        user={auth.status === "signed-in" ? auth.user : null}
        canSignIn={auth.status === "signed-out"}
        welcome={notice.welcome}
        launch={LAUNCH}
        onLogout={handleLogout}
      />
    </Suspense>
  );
}

