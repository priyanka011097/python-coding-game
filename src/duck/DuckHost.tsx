/* The one duck for the whole site: every 2nd bit of progress a small duck
   peeks in with a motivational line, every 10th a big one flies up with
   "Quack! +10". The count is shared across all modes and saved. */

import { useEffect, useRef } from "react";
import { useDuck } from "./useDuck";
import { Duck } from "./Duck";
import { onDuck } from "./duckBus";
import { KEYS, removeKeys } from "../cards/storage";
import "./duck.css";

export function DuckHost({ firstName }: { firstName: string }) {
  const { duck, bumpNav, resetNav, cheer } = useDuck();
  const cheerRef = useRef(cheer);
  cheerRef.current = cheer;

  /* Now and then, a duck pops up anywhere on screen with some
     encouragement: first after 20–40 s, then every 45–100 s. Paused while
     the tab is hidden; waits if another duck is already showing. */
  useEffect(() => {
    let timer: number | undefined;
    const schedule = (min: number, max: number): void => {
      window.clearTimeout(timer);
      timer = window.setTimeout(tick, (min + Math.random() * (max - min)) * 1000);
    };
    const tick = (): void => {
      if (document.visibilityState === "visible" && cheerRef.current()) schedule(45, 100);
      else schedule(8, 15); // busy or hidden: try again a little later
    };
    schedule(20, 40);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(
    () =>
      onDuck(
        () => bumpNav(firstName),
        () => {
          removeKeys([KEYS.nav]);
          resetNav();
        },
      ),
    [bumpNav, resetNav, firstName],
  );

  return duck ? <Duck key={duck.id} duck={duck} /> : null;
}
