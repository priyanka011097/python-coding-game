/* ============================================================
   PwC PREP — TypeScript
   One question at a time. Fill the blank, save, say "done".
   ============================================================

   SCOREBOARD  (Q1-Q37)
     Solid   : plain types, string[]/number[], interfaces, optional ?,
               void as a RETURN type, typed props, useState<T>,
               function-type props  (id: number) => void,
               boolean trigger words (is/has/can/flag)

     WEAK    : writing a union when the line ALREADY has a value
                 let x: ___ = 10;      -> you type `number`, forget "| string"
               Missed 5x: Q24 Q27 Q31 Q33 Q35
               But CORRECT when the value is removed: Q36 ✅ Q37 ✅
               -> the "= 10" hijacks your eye. Cover it with your hand.
   ============================================================ */


/* ---------- Q1 ----------   ✅ CORRECT */

// This variable holds text. What type goes in the blank?

let city: string = "Mumbai";
   // ✅ correct


/* ---------- Q2 ----------   ✅ CORRECT */

// Same idea, but this one holds a whole number.

let population: number = 20000000;
   // ✅ correct


/* ---------- Q3 ----------   ✅ CORRECT */

// This one is true or false.

let isCapital: boolean = false;
   // ✅ correct


/* ---------- Q4 ----------   ✅ CORRECT */

// A list that holds several pieces of text.
// Hint: put [] after the type to mean "a list of".

let cities: string[] = ["Mumbai", "Delhi", "Pune"];


/* ---------- Q5 ----------   ✅ CORRECT */

// A list of whole numbers.

let scores: number[] = [10, 20, 30];
   // ✅ correct


/* ---------- Q6 ----------   ✅ CORRECT */

// An interface describes the SHAPE of an object.
// name holds text, population holds a whole number.

interface City {
  name: string;
  population: number;
}

const mumbai: City = { name: "Mumbai", population: 20000000 };


/* ---------- Q7 ----------   ❌ WRONG  (retried in Q8/Q9 -> both correct) */

// This function takes a number and gives back a number.
// Fill the RETURN type (the one after the closing bracket).

// ❌ You wrote: void      ✅ Answer: number
//
//    The return type describes WHAT COMES BACK from the function.
//    `return n * 2;` hands back a number, so the return type is number.
//
//    void means "this function gives back NOTHING".
//    Writing `: void` here is a real TS error, because you DO return something.
function double(n: number): number {
  return n * 2;
}


/* ---------- Q8 ----------   ✅ CORRECT */

// NOW use void. This function prints and gives nothing back.
// Notice: there is no `return` line.

function greet(name: string): void {
  console.log("Hello " + name);
}




/* ---------- Q9 ----------   ✅ CORRECT */

// This function takes text and gives back text.

function shout(message: string): string {
  return message.toUpperCase();
}

/* ===== NOTE: how to pick a RETURN type =====================
   Look at the `return` line. Whatever value it hands back = the type.
   If there is no `return` value at all = void.

     return n * 2;                  -> number
     return message.toUpperCase();  -> string
     return message.length > 10;    -> boolean
     console.log(...) only          -> void   (hands back nothing)

   The INPUT type does not decide the output type:

     function isLong(message: string): boolean {   // string IN, boolean OUT
       return message.length > 10;
     }
   ========================================================== */

/* ---------- Q10 ----------   ✅ CORRECT */

// Some users have a phone number, some don't.
// Add ONE character after `phone` to mark it as OPTIONAL.

interface Person {
  name: string;
  phone?: string;
}

// Both of these must be allowed:
const a: Person = { name: "Priyanka" };
const b: Person = { name: "Nitish", phone: "9999999999" };


/* ---------- Q11 ----------   ✅ CORRECT */

// role is allowed to be ONLY the word "admin" or the word "user".
// Write the two words in quotes, separated by a | (pipe).

type Role = "admin" | "user";

const r1: Role = "admin";
const r2: Role = "user";
// const r3: Role = "manager";  // this must be an error


/* ---------- Q12 ----------   ❌ WRONG  (unsure) */

// id can be a number OR text. Use the | pipe with the two TYPES this time
// (not quoted words — actual types).

// ❌ You were unsure.   ✅ Answer: number | string
//
//    The | pipe is the SAME tool you used in Q11. Only the sides change:
//
//       type Role = "admin" | "user";        // two exact VALUES
//       function f(id: number | string) {}   // two TYPES
//
//    "admin" = this exact word and nothing else.
//    string  = any text at all.
//    Both are legal on either side of a |. This is called a UNION.
function findById(id: number | string): void {
  console.log(id);
}

findById(1);
findById("abc");


/* ---------- Q13 — first React one ----------   ✅ CORRECT */

// A React component that shows a name.
// Fill the type of the `name` prop.

interface GreetingProps {
  name: string;
}

function Greeting({ name }: GreetingProps) {
  return <h1>Hello {name}</h1>;
}

// used like:  <Greeting name="Priyanka" />


/* ---------- Q14 ----------   ✅ CORRECT */

// A React component where `age` is OPTIONAL (some cards don't show it).
// Same one character you used in Q10.

interface CardProps {
  title: string;
  age?: number;
}

function Card({ title, age }: CardProps) {
  return <div>{title} {age}</div>;
}

// both must work:  <Card title="A" />   and   <Card title="B" age={30} />


/* ---------- Q15 ----------   ✅ CORRECT */

// Typed useState. The <> tells React what type the state holds.
// This one holds a whole number.

function Counter() {
  const [count, setCount] = useState<number>(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}


/* ---------- Q16 ----------   ❌ WRONG  (retry = Q19) */

// Very common real pattern: state starts as null, later holds a User.
// So the state type is "a User OR null". Use the | pipe (like Q12).

interface User2 {
  id: number;
  name: string;
}

function Profile() {
  // ❌ You wrote: string      ✅ Answer: User2 | null
  //
  //    Ask: what values can actually sit in this state?
  //      - it STARTS as null
  //      - later it holds a User2 object (we read user?.name)
  //    Two possible things -> union them with |
  //
  //    string is wrong because a User2 is an OBJECT, not text.
  //    A string has no .name property, so user?.name would not exist.
  const [user, setUser] = useState<User2 | null>(null);
  return <div>{user?.name}</div>;
}

/*i dont understand thhis


/* ---------- Q17 ----------   ❌ WRONG  (retry = Q18) */

// A prop that is a FUNCTION. onClick takes no arguments and returns nothing.
// Write it as:   () => <return type>

interface ButtonProps {
  label: string;
  // ❌ You wrote: boolean      ✅ Answer: () => void
  //
  //    Look at what gets passed in:
  //        <MyButton onClick={() => console.log("saved")} />
  //    onClick receives A FUNCTION, not a true/false.
  //    So its type must DESCRIBE a function.
  //
  //    The type mirrors how you write the function:
  //        () => console.log("hi")        has type   () => void
  //        (id: number) => console.log(id)  has type   (id: number) => void
  //        () => 42                       has type   () => number
  //
  //    LEFT of =>  is the arguments.
  //    RIGHT of => is what comes back. void = nothing comes back.
  onClick: () => void;
}

function MyButton({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// used like:  <MyButton label="Save" onClick={() => console.log("saved")} />


/* ---------- Q18 ----------   ❌ WRONG  (retry = Q22) */

// Practice the SAME idea as Q17.
// onSelect receives an id (a number) and gives nothing back.

interface ListProps {
  // ❌ WRONG. You wrote: void      ✅ Answer: (id: number) => void
  //
  //    onSelect HOLDS A FUNCTION, so its type must contain a =>
  //    You wrote only the right half and dropped the function part.
  //
  //        <List onSelect={(id) => console.log(id)} />
  //                        ^^^^          ^^^^^^^^ returns nothing
  //             type:  (id: number)  =>  void
  onSelect: (id: number) => void;
}

// used like:  <List onSelect={(id) => console.log(id)} />


/* ---------- Q19 ----------   ❌ WRONG  (retry = Q23) */

// Practice the SAME idea as Q16.
// This state starts as null and later holds text (an error message).

function ErrorBox() {
  // ❌ WRONG. You wrote: ErrorBox | null     ✅ Answer: string | null
  //
  //    ErrorBox is the COMPONENT'S NAME, not a kind of data.
  //    There is no such thing as "an ErrorBox value".
  //
  //    Ask what is actually stored: an error MESSAGE = text = string.
  //    It starts as null, so:  string | null
  //
  //    Q16 worked as User2 | null because User2 really WAS a data shape
  //    (interface User2 { id; name }). ErrorBox just draws HTML.
  const [error, setError] = useState<string | null>(null);
  return <p>{error}</p>;
}

/* ---------- Q20 ----------   ❌ WRONG  (retry = Q21) */

// RETRY of Q12 (you were unsure there).
// A search box value can be text OR a number. Use the | pipe with real types.

function search(term: string | number): void {
  console.log(term);
}

search("laptop");
search(42);


/* ===== RULE TO MEMORISE ====================================
   `void` is ONLY ever a RETURN type.
   It is what a function gives back when it gives back NOTHING.

   It can NEVER be the type of a value, because no value is void.

     function log(m: string): void { ... }   ✅ return position
     let x: void;                            ❌ meaningless
     onSelect: void;                         ❌ meaningless

   If a blank is asking "what does this HOLD?", void is never right.
   ========================================================== */


/* ---------- Q21 ----------   ❌ WRONG  (retry = Q24) */

// RETRY of Q20. Fill in the blank with two TYPES joined by |
// A price can be a number (299) or text ("Free").

// ❌ WRONG. You wrote: number      ✅ Answer: number | string
//    Half right — 299 IS a number. But `price = "Free"` must also work,
//    and `number` alone FORBIDS text.
//    Two possibilities -> write BOTH, joined by |
//    Whenever a question says "X OR Y", the answer contains a |
let price: number | string = 299;
// also allowed:  price = "Free";


/* ---------- Q22 ----------   ❌ WRONG  (retry = Q25) */

// RETRY of Q18. This prop holds a function.
// Copy the shape:   (argName: argType) => returnType
//
// onDelete receives a name (text) and gives back nothing.

interface RowProps {
  // ❌ WRONG. You wrote: string      ✅ Answer: (name: string) => void
  //    onDelete does NOT hold a name.
  //    It holds a FUNCTION THAT RECEIVES a name.
  //    The name is the INPUT, so it goes inside the ( ).
  onDelete: (name: string) => void;
}

// used like:  <Row onDelete={(name) => console.log(name)} />


/* ---------- Q23 ----------   ❌ WRONG  (retry = Q26) */

// RETRY of Q19. What does this state HOLD?
// It starts as null, and later holds a whole number (the selected id).

function Picker() {
  // ❌ WRONG (unsure).      ✅ Answer: number | null
  //    Same shape as Q21: two possibilities, one |
  const [selectedId, setSelectedId] = useState<number | null>(null);
  return <p>{selectedId}</p>;
}


/* ############################################################
   SLOWING DOWN. Each question below shows a WORKED EXAMPLE first.
   Your question is almost identical — copy the shape.
   ############################################################ */


/* ---------- Q24 ----------   ❌ WRONG  (retry = Q27) */

// WORKED EXAMPLE (already done for you):
     let userId: number | string = 1;      // can be 1  OR  "abc"

// YOUR TURN — copy that exact shape.
// A phone can be a number (9999999999) OR text ("+91-999").

// ❌ WRONG. You wrote: number      ✅ Answer: number | string
//
//    You typed `number` because the value STARTS as 9999999999.
//    But you already got this right in Q26:
//
//        useState<number | null>(null)
//                 ^^^^^^^^^^^^^ starts null, yet you wrote BOTH
//
//    THE RULE: the type must cover every value the variable could
//    EVER hold — not just the one it starts with.
let phone: number | string = 9999999999;


/* ---------- Q25 ----------   ✅ CORRECT */

// WORKED EXAMPLE (already done for you):
interface ExampleProps {
  onSave: (id: number) => void;      // receives an id (number), returns nothing
}

// YOUR TURN — copy that exact shape.
// onEdit receives a title, which is TEXT, and returns nothing.

interface EditProps {
  onEdit: (edit: string) => void;
}


/* ---------- Q26 ----------   ✅ CORRECT */

// WORKED EXAMPLE (already done for you):
//     const [user, setUser] = useState<User2 | null>(null);
//                                      ^^^^^^^^^^^ holds a User2, or null

// YOUR TURN — copy that exact shape.
// This state starts as null and later holds a COUNT (a whole number).

function Basket() {
  const [count, setCount] = useState<number | null>(null);
  return <p>{count}</p>;
}


/* ---------- Q27 ----------   ❌ WRONG  (retry = Q29) */

// RETRY of Q24.  Ask: what could this EVER hold? Write all of them with |
//
// A search result count starts at 0, but shows the text "many" when huge.

// ❌ WRONG (3rd time on this idea).   ✅ Answer: number | string
//
//    With YOUR answer, TypeScript prints this error:
//
//        resultCount = "many";
//        ~~~~~~~~~~~ Type 'string' is not assignable to type 'number'.
//
//    Writing `: number` is a PROMISE that this variable will ONLY
//    ever be a number. The very next line breaks that promise.
//
//    The annotation is NOT describing the 0.
//    It is setting the rule for the variable's WHOLE LIFE.
let resultCount: number | string = 0;
// later:  resultCount = "many";


/* ---------- Q28 ----------   ❌ WRONG  (retry = Q30) */

// You got Q25 right — here is the same idea, slightly bigger.
// onSubmit receives an email (text) AND an age (number), returns nothing.
// Two arguments go inside the ( ) separated by a comma.

interface FormProps {
  onSubmit: (submit: string) => void;
}

// used like:  <Form onSubmit={(email, age) => console.log(email, age)} />


/* ---------- Q29 ----------   ✅ CORRECT */

// MULTIPLE CHOICE this time. Delete the two wrong lines, keep the right one.
//
// `status` starts as the number 0, and later becomes the text "done".
// Which annotation lets BOTH lines below compile?
//

//     C)   let status: number | string = 0;
//
// Write just the letter: A, B or C

// ANSWER: c      ✅ CORRECT
//
//    IMPORTANT: you RECOGNISED the union instantly when shown the options.
//    So you understand it — the gap is PRODUCING it from scratch.
//    That is a much smaller problem. Keep writing them out.

// (these are the two lines that must both work)
//     status = 0;
//     status = "done";


/* ---------- Q30 ----------   ⚠️ HALF  (retry = Q32) */

// RETRY of Q28. Most of it is written — fill ONLY the missing types.
// onLogin receives a username (text) and a remember flag (true/false).

interface LoginProps {
  // ⚠️ HALF RIGHT.
  //    username: string   ✅ correct
  //    remember: string   ❌ should be boolean
  //
  //    "a remember FLAG (true/false)" -> true/false is boolean, not text.
  //    You already had this in Q3:   let isCapital: boolean = false;
  onLogin: (username: string, remember: boolean) => void;
}

// used like:  <Login onLogin={(username, remember) => console.log(username)} />


/* ---------- Q31 ----------   ⚠️ TOO WIDE  (retry = Q33) */

// SAME question as Q29 — but now WRITE the answer instead of picking it.
// You already chose C correctly, so you know what goes here.
//
// `status` starts as the number 0, and later becomes the text "done".

// ⚠️ TOO WIDE. You wrote: string | number | boolean
//                     ✅ Answer: number | string
//
//    Yours COMPILES — 0 and "done" are both allowed. But you added
//    `boolean`, which was never possible here:
//
//        status = true;   // TS allows it with your type — but it is a BUG
//
//    A union must list EXACTLY what is possible, no more.
//    Every extra member is a bug TypeScript can no longer catch for you.
let status: number | string = 0;
// later:  status = "done";


/* ---------- Q32 ----------   ⚠️ 2 of 3  (retry = Q34) */

// RETRY of Q30. Three arguments, all types missing.
//   title    -> text
//   count    -> whole number
//   isPinned -> true/false

interface NoteProps {
  onSave: (title: string, count: number, isPinned: boolean) => void;
}


/* ---------- Q33 ----------   ❌ WRONG  (retry = Q35) */

// RETRY of Q31. List EXACTLY what is possible — nothing extra.
//
// `score` holds a whole number, or the text "N/A" when not played.
// It is NEVER true/false. It is NEVER null.

// ❌ WRONG (4th time on this exact shape: Q24, Q27, Q31, Q33).
//                                        ✅ Answer: number | string
//
//    THE REFLEX TO BREAK:
//    When you see   let x: ___ = 10
//    you are typing the type of the 10.
//    But the blank is NOT about the 10.
//    It asks what x may hold for its ENTIRE LIFE — including
//    the `score = "N/A"` line right underneath it.
//
//    TRICK: cover the "= 10" with your hand. Read only the comments.
let score: number | string = 10;
// later:  score = "N/A";


/* ---------- Q34 ----------   ✅ ALL 4 CORRECT */

// RETRY of Q32. Watch for the boolean trigger words.

interface SettingsProps {
  darkMode: boolean;        // true/false
  fontSize: number;        // whole number
  username: string;        // text
  hasPremium: boolean;      // true/false
}


/* ---------- Q35 ----------   ❌ WRONG  (retry = Q36) */

// RETRY of Q33 — with the work done for you.
//
// STEP 1. Every value `temperature` will hold during the program:
//
//              25          <- this is a  number
//              "unknown"   <- this is a  string
//
// STEP 2. Join those two type names with a | and put them in the blank.
//         (Do NOT look at the "= 25" on the right. Use STEP 1 only.)

// ❌ WRONG (5th time). ✅ Answer: number | string
//    The STEP 1 hint literally listed number and string for you.
//    The "= 25" on this line is hijacking your eye. Q36 removes it.
let temperature: number | string = 25;
// later:  temperature = "unknown";


/* ---------- Q36 ----------   ✅ CORRECT */

// Same idea as Q35, but there is NO value on the annotation line at all.
// Nothing to copy from. Just read the two lines below the blank.

let reading: number | string;

reading = 25;          // a number
reading = "unknown";   // a string

// MECHANICAL RULE — do this every time, do not think:
//   1. find EVERY line that assigns to the variable
//   2. write down the type of each value:   number , string
//   3. join them with |  ->  number | string
//   4. that is your answer


/* ---------- Q37 ----------   ✅ CORRECT */

// Same drill, different values. Follow the 4 steps above.

let userId: number | null;

userId = 101;        // a number
userId = null;       // null


/* ---------- Q38 ----------   ✅ CORRECT — block broken! */

// You nailed Q36 and Q37 with no value on the line.
// Here is the SAME question with the value put back.
// Cover the "= 5" with your finger. Read only the lines below it.

let rating: number | string = 5;

// rating = 5;           // a number
// rating = "unrated";   // a string


/* ---------- Q39 ----------   ❌ WRONG  (retry = Q40) */

// Back to React. Same union skill, real component.
// `data` starts as null, and later holds an array of User2 objects.
// (an array of User2 is written  User2[]  — you did this in Q4/Q5)

function UserList() {
  // ❌ You wrote: UserList[] | null    ✅ Answer: User2[] | null
  //
  //    STRUCTURE IS RIGHT — array + null joined with |. Good.
  //    But UserList is the COMPONENT'S NAME, not a data type.
  //    Same trap as Q19 where you wrote ErrorBox.
  //
  //        function UserList() {...}      a function that draws HTML
  //        interface User2 { id; name }   an actual DATA SHAPE  <- the type
  //
  //    RULE: if it is declared with `function` and returns JSX,
  //          it is a component and can never be a type.
  const [data, setData] = useState<User2[] | null>(null);
  return <div>{data?.length}</div>;
}


/* ---------- Q40 ----------   ❌ WRONG  (retry = Q42) */

// RETRY of Q39. Same shape, no component-name trap.
// `tags` starts as null, later holds an array of TEXT.

function TagBar() {
  // ❌ You wrote: tagBag[] | string    ✅ Answer: string[] | null
  //
  //    TWO separate errors:
  //     1. `tagBag` does not exist. You grabbed the nearest word on
  //        screen (TagBar, the component). The comment says the array
  //        holds TEXT  ->  string[]
  //     2. `| string` should be `| null`. The second half of the union
  //        is whatever the state STARTS as — and it starts as null.
  //
  //    HABIT TO BUILD: read the COMMENT, not the surrounding code.
  //    The answer is spelled out in words every time. Nearby names are noise.
  const [tags, setTags] = useState<string[] | null>(null);
  return <div>{tags?.join(", ")}</div>;
}


/* ---------- Q41 ----------   ❌ BLANK  (retry = Q43) */

// Third thing on your interview list.
// fetch() gives back `any`, so YOU tell TypeScript what came back.
//
// Reminder: an async function ALWAYS returns a Promise<...>
// The Promise< > is already written — fill only what goes INSIDE.

async function getUsers(): Promise<getUser[]> {
  const res = await fetch("/api/users");
  const data = await res.json();
  return data;
}

// used like:  const users = await getUsers();   // users must be User2[]


/* ===== NOTE: why Q39 was User2[] but Q40 was string[] ======
   [] means "ARRAY OF".
   Whatever sits in FRONT of [] is what ONE ITEM looks like.

   Q39 — data holds:
       [ { id: 1, name: "Asha" }, { id: 2, name: "Ravi" } ]
         ^^^^^^^^^^^^^^^^^^^^^^ one item = object with id + name
                                that shape is named User2
       -> User2[]

   Q40 — tags holds:
       [ "react", "typescript" ]
         ^^^^^^^ one item = a piece of text
       -> string[]

   SAME RULE, different contents:
       look at ONE item -> name its type -> add []

       "react"                 -> string   -> string[]
       42                      -> number   -> number[]
       true                    -> boolean  -> boolean[]
       { id: 1, name: "Asha" } -> User2    -> User2[]

   You already did this in Q4 with ["Mumbai","Delhi"] -> string[]
   ========================================================== */


/* ---------- Q42 ----------   … not answered yet */

// RETRY of Q40. Fill the TWO slots separately, then join them.
//
//    SLOT A = what it holds once loaded ... an array of whole numbers
//    SLOT B = what it holds at the start ... null
//
//    Then write:   SLOT A | SLOT B

function ScoreList() {
  const [scores, setScores] = useState<strimg[] | null>(null);
  return <div>{scores?.length}</div>;
}


/* ---------- Q43 ----------   … not answered yet */

// RETRY of Q41. Read the last line — it tells you the answer.

async function getUser(): Promise<___B2___> {
  const res = await fetch("/api/user/1");
  return await res.json();
}

// used like:  const user = await getUser();   // user must be ONE User2 object
