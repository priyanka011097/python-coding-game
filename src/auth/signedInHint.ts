/* signedInHint.ts — remembers, in this browser, that someone is signed in.

   The landing page is pre-rendered into index.html for search engines.
   For a returning signed-in visitor, a script in index.html reads this
   hint and hides that landing page before it paints, and the app waits
   quietly for the sign-in check instead of showing it. */

const KEY = "ip_signed_in";

export function likelySignedIn(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setSignedInHint(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the hint is only a nicety */
  }
}
