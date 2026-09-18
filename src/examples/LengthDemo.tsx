/* =====================================================================
   LengthDemo.tsx — the two versions side by side.

   Question: why is it useState<User[] | null> and not
             useState<number | null>, when the thing on screen is a number?

   Answer:   the <> describes what `data` HOLDS.
             `.length` is a question you ASK the thing data holds.
   ===================================================================== */

import { useState } from "react";

interface User {
  id: number;
  name: string;
}

/* ------------------------------------------------------------------
   ❌ THE BROKEN ONE
   ------------------------------------------------------------------ */
export function BrokenList() {
  // We are promising: "data holds a number, or null."
  const [data, setData] = useState<number | null>(null);

  setData(5);
  // data is now literally the value  5

  // So this line asks:  (5).length
  // Numbers have no .length, so the compiler stops us:
  //
  //   error TS2339: Property 'length' does not exist on type 'number'.
  //
  // (@ts-expect-error keeps the project building. Delete that line and
  //  the red squiggle comes back in your editor — try it.)
  // @ts-expect-error  demonstrating the error on purpose
  return <div>{data?.length}</div>;
}

/* ------------------------------------------------------------------
   ✅ THE CORRECT ONE
   ------------------------------------------------------------------ */
export function WorkingList() {
  // We are promising: "data holds an array of User, or null."
  const [data, setData] = useState<User[] | null>(null);

  setData([
    { id: 1, name: "Asha" },
    { id: 2, name: "Ravi" },
  ]);
  // data is now literally  [ {id:1,…}, {id:2,…} ]

  // Arrays DO have .length, so this is fine — and it evaluates to 2.
  // A number appears on screen, but the STATE is still an array.
  // The number was produced BY .length; it is not what data holds.
  return <div>{data?.length}</div>;
}

/* ------------------------------------------------------------------
   THE TEST TO RUN IN YOUR HEAD

   Write out the value the state will actually contain, then ask
   whether `.length` makes sense on it:

     5                          number     .length ❌
     [10, 20]                   number[]   .length ✅ -> 2
     [{id:1,name:"Asha"}]       User[]     .length ✅ -> 1
     "react"                    string     .length ✅ -> 5

   Only arrays and strings have .length. Seeing `data?.length` therefore
   proves data is one of those — and the question said it holds User
   objects, so: User[] | null
   ------------------------------------------------------------------ */
