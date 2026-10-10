/* The one duck for the whole site: every 2nd bit of progress a small duck
   peeks in with a motivational line, every 10th a big one flies up with
   "Quack! +10". The count is shared across all modes and saved. */

import { useEffect } from "react";
import { useDuck } from "./useDuck";
import { Duck } from "./Duck";
import { onDuck } from "./duckBus";
import { KEYS, removeKeys } from "../cards/storage";
import "./duck.css";

export function DuckHost({ firstName }: { firstName: string }) {
  const { duck, bumpNav, resetNav } = useDuck();

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
