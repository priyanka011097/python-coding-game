import type { Question } from "../types";

/* =====================================================================
   pyFluency.ts — the difference between writing Python and writing
   Python well.

   Everything here was used earlier without being explained: `@` on a
   decorator, the dunder methods Python calls for you, the iterator
   underneath a `for` loop, `with` as something you can author. Plus the
   standard-library modules the basics only named in passing.

   Sits between pyQuestions and pyDsa in the track.
   ===================================================================== */

export const pyFluency = [
  /* ---------------------------------------------------------------
     Scope — which name is which
     --------------------------------------------------------------- */
  {
    id: 118, topic: "Scope",
    bridge: "You know what a name points at. The remaining question is which name Python finds when several share a spelling.",
    ask: "What does this print?",
    code: 'total = 10\n\ndef spend():\n    total = 0        # a NEW, local name\n\nspend()\nprint(total)   # shows: ~',
    accepted: ["10"],
    concept: "Assigning inside a function creates a variable that belongs to that call and disappears when it ends. It does not touch a name of the same spelling outside, even though they look identical.",
    why: "Python looks names up <strong>L-E-G-B</strong>: Local, Enclosing, Global, Built-in. Assignment always creates a Local unless you say otherwise — which is the point of the next two questions.",
  },
  {
    id: 119, topic: "Scope",
    bridge: "So how do you change the outer one on purpose?",
    ask: "Rebind the module-level name from inside the function.",
    code: "count = 0\n\ndef tick():\n    ~ count\n    count += 1\n\ntick()\nprint(count)   # shows: 1",
    accepted: ["global"],
    concept: "A declaration at the top of the function tells Python that this name belongs to the module, so assigning to it changes the outer one rather than making a new local.",
    why: "<code>global</code> works but is usually a design smell — a function that edits module state is hard to test and hard to reason about. Prefer returning a value and letting the caller decide. Know it; reach for it rarely.",
  },
  {
    id: 120, topic: "Scope",
    bridge: "And one level in from that: a function inside a function.",
    ask: "Rebind the name from the enclosing function, not the module.",
    code: "def counter():\n    n = 0\n    def bump():\n        ~ n\n        n += 1\n        return n\n    return bump",
    accepted: ["nonlocal"],
    concept: "<code>global</code> jumps all the way out to the module. The other keyword goes up exactly one level, to the nearest enclosing function.",
    why: "<code>nonlocal</code> reaches the E in LEGB. Without it, <code>n += 1</code> reads a local <code>n</code> that has never been assigned and raises <code>UnboundLocalError</code> — a confusing error until you know this rule.",
  },
  {
    id: 121, topic: "Scope",
    bridge: "That function returned another function. Look at what the returned one still remembers.",
    ask: "What does this print?",
    code: "def multiplier(factor):\n    def multiply(x):\n        return x * factor    # factor outlived multiplier()\n    return multiply\n\ndouble = multiplier(2)\nprint(double(5))   # shows: ~",
    accepted: ["10"],
    concept: "An inner function keeps hold of the variables it used from the function that made it, even after that outer call has finished. The pair — function plus captured environment — is called a <strong>closure</strong>.",
    why: "Closures are how you build a configured function at runtime. They are also exactly what a decorator is, which is the next thing to build — so this question is not a curiosity, it is the mechanism.",
  },

  /* ---------------------------------------------------------------
     Decorators
     --------------------------------------------------------------- */
  {
    id: 122, topic: "Decorators",
    bridge: "You have used <code>@property</code>, <code>@dataclass</code>, <code>@staticmethod</code> and <code>@lru_cache</code> without ever being told what the <code>@</code> does. Time to build one.",
    ask: "What must the outer function hand back?",
    code: "def log(fn):\n    def wrapper(*args, **kwargs):\n        print(f\"calling {fn.__name__}\")\n        return fn(*args, **kwargs)\n    return ~",
    accepted: ["wrapper"],
    concept: "A decorator takes a function and returns a replacement for it. The replacement is a closure holding the original, so it can do something extra before or after calling it.",
    why: "It returns the <em>wrapper itself</em>, not <code>wrapper()</code> — returning a call would run it immediately and hand back its result. Functions being values is the whole trick.",
  },
  {
    id: 123, topic: "Decorators",
    bridge: "Now apply it, and see what the <code>@</code> is shorthand for.",
    ask: "Fill the symbol.",
    code: "~log\ndef add(a, b):\n    return a + b\n\n# exactly the same as:\n# add = log(add)",
    accepted: ["@"],
    concept: "The <code>@</code> line is pure sugar. It calls the decorator with the function underneath and rebinds the name to whatever comes back.",
    why: "<code>@log</code> above <code>def add</code> <em>is</em> <code>add = log(add)</code>. Once you see that, every decorator in every framework — Flask routes, pytest fixtures, <code>@lru_cache</code> — stops being magic.",
  },
  {
    id: 124, topic: "Decorators",
    bridge: "One detail makes the difference between a toy decorator and a usable one.",
    ask: "Why does the wrapper take <code>*args, **kwargs</code>?",
    code: "def wrapper(*args, **kwargs):\n    return fn(*args, **kwargs)\n\n# so it works on a function with ~ signature",
    accepted: ["any"],
    concept: "The decorator does not know what it will be applied to. Collecting everything and forwarding it unchanged is what lets one decorator wrap functions of every shape.",
    why: "<code>*args, **kwargs</code> in, <code>*args, **kwargs</code> out. Hard-coding parameters means the decorator only works on one function — the commonest mistake in a first decorator.",
  },
  {
    id: 125, topic: "Decorators",
    bridge: "And one that stops the decorator lying about what it wrapped.",
    ask: "Preserve the original function's name and docstring.",
    code: "from functools import wraps\n\ndef log(fn):\n    @~(fn)\n    def wrapper(*args, **kwargs):\n        return fn(*args, **kwargs)\n    return wrapper",
    accepted: ["wraps"],
    concept: "Without help, the decorated function reports itself as <code>wrapper</code>, with the wrapper's docstring. Anything that introspects it — debuggers, docs tools, other decorators — now sees the wrong thing.",
    why: "<code>@wraps(fn)</code> copies <code>__name__</code>, <code>__doc__</code> and friends across. Always use it. It costs one line and it is the sort of detail that gets noticed in review.",
  },

  /* ---------------------------------------------------------------
     Dunder methods — the hooks Python calls for you
     --------------------------------------------------------------- */
  {
    id: 126, topic: "Dunder methods",
    bridge: "<code>__init__</code> ran when you made an object. It is one of a family, and the rest decide how your object behaves with the language's own syntax.",
    ask: "Make <code>print(obj)</code> show something readable.",
    code: 'class Point:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n\n    def ~(self):\n        return f"Point({self.x}, {self.y})"\n\nprint(Point(1, 2))   # Point(1, 2)',
    accepted: ["__repr__", "__str__"],
    concept: "Without one of these, printing an object gives <code>&lt;__main__.Point object at 0x7f…&gt;</code>, which tells you nothing. Defining one is how your class describes itself.",
    why: "<code>__repr__</code> is for developers and should ideally be valid Python that rebuilds the object; <code>__str__</code> is for users. If you write only one, write <code>__repr__</code> — <code>print</code> falls back to it, and it is what you see in a debugger and inside a list.",
  },
  {
    id: 127, topic: "Dunder methods",
    bridge: "Next: making two objects compare as equal.",
    ask: "Which method does <code>==</code> call?",
    code: "class Point:\n    def ~(self, other):\n        return (self.x, self.y) == (other.x, other.y)\n\nPoint(1, 2) == Point(1, 2)   # True",
    accepted: ["__eq__"],
    concept: "By default two objects are equal only if they are the very same object, so two points with identical coordinates compare as different. Defining this method replaces that rule.",
    why: "Define <code>__eq__</code> and Python sets <code>__hash__</code> to <code>None</code>, making instances unhashable — so add <code>__hash__</code> too if they go in a set or dict. <code>@dataclass</code> writes all of this for you, which is why it exists.",
  },
  {
    id: 128, topic: "Dunder methods",
    bridge: "The pattern generalises: a built-in function, a method it calls.",
    ask: "Make <code>len(obj)</code> work.",
    code: "class Basket:\n    def __init__(self, items):\n        self.items = items\n\n    def ~(self):\n        return len(self.items)\n\nlen(Basket([1, 2, 3]))   # 3",
    accepted: ["__len__"],
    concept: "Python's built-ins are thin wrappers that hand the work to a method on the object. That is why <code>len()</code> works on strings, lists, dicts and now yours, with no special-casing anywhere.",
    why: "<code>len()</code> → <code>__len__</code>, <code>x in obj</code> → <code>__contains__</code>, <code>obj[k]</code> → <code>__getitem__</code>, <code>obj()</code> → <code>__call__</code>. Implementing them is how a class stops being a struct and starts feeling like part of the language.",
  },
  {
    id: 129, topic: "Dunder methods",
    bridge: "Defining <code>__len__</code> has a side effect you should predict.",
    ask: "An empty basket now behaves how in an <code>if</code>?",
    code: "b = Basket([])\n\nif not b:\n    print(\"empty\")   # this ~ print",
    accepted: ["does", "will", "does print"],
    concept: "Truthiness falls back to length when a class has no explicit rule: length zero means falsy. So the emptiness idiom you learned on lists starts working on your class for free.",
    why: "Python asks <code>__bool__</code> first, then <code>__len__</code>, then defaults to true. This is why <code>if not items:</code> works on every container in the language — and why an object with neither method is always truthy, even when it is conceptually empty.",
  },

  /* ---------------------------------------------------------------
     Protocols — iterators and context managers
     --------------------------------------------------------------- */
  {
    id: 130, topic: "Protocols",
    bridge: "The same idea explains the <code>for</code> loop itself.",
    ask: "Which method makes an object usable in a <code>for</code> loop?",
    code: "class Countdown:\n    def __init__(self, n):\n        self.n = n\n\n    def ~(self):\n        while self.n > 0:\n            yield self.n\n            self.n -= 1\n\nfor x in Countdown(3):\n    print(x)   # 3 2 1",
    accepted: ["__iter__"],
    concept: "A <code>for</code> loop asks the object for an iterator and then repeatedly asks that for the next value. Anything answering those two requests can be looped over — no inheritance required.",
    why: "This is <strong>duck typing</strong>: Python cares what an object <em>can do</em>, not what it is. A generator satisfies the whole protocol by itself, which is why <code>yield</code> here is enough and no <code>__next__</code> is needed.",
  },
  {
    id: 131, topic: "Protocols",
    bridge: "The manual version, so you can see what the loop is really doing.",
    ask: "Which exception says “no more values”?",
    code: "it = iter([1, 2])\nnext(it)   # 1\nnext(it)   # 2\nnext(it)   # raises ~",
    accepted: ["StopIteration"],
    concept: "A <code>for</code> loop is a <code>while True</code> around <code>next()</code> that stops when a particular exception arrives. Ending is signalled by an exception, not by a return value.",
    why: "<code>next(it, default)</code> gives you a fallback instead of raising. A stray <code>StopIteration</code> inside a generator used to end it silently — as of PEP 479 it becomes a <code>RuntimeError</code>, which is far easier to debug.",
  },
  {
    id: 132, topic: "Protocols",
    bridge: "One more protocol, behind a keyword you used on files.",
    ask: "Which method runs when the <code>with</code> block is entered?",
    code: "class Timer:\n    def ~(self):\n        self.start = time.time()\n        return self\n\n    def __exit__(self, exc_type, exc, tb):\n        print(time.time() - self.start)\n\nwith Timer():\n    do_work()",
    accepted: ["__enter__"],
    concept: "A context manager is any object with a setup method and a teardown method. <code>with</code> calls the first, hands you what it returns via <code>as</code>, and guarantees the second runs on the way out.",
    why: "<code>__exit__</code> runs even when the block raises — and it receives the exception, so returning <code>True</code> from it swallows the error. <code>contextlib.contextmanager</code> lets you write the same thing as a generator with a single <code>yield</code>.",
  },

  /* ---------------------------------------------------------------
     Errors, properly
     --------------------------------------------------------------- */
  {
    id: 133, topic: "Errors",
    bridge: "You raised built-in errors. Your own code usually deserves its own.",
    ask: "What should a custom exception inherit from?",
    code: "class PaymentFailed(~):\n    pass\n\nraise PaymentFailed(\"card declined\")",
    accepted: ["Exception"],
    concept: "An exception is a class like any other. Inheriting from the right base is what lets callers catch your specific failure without also catching everything else.",
    why: "Inherit from <code>Exception</code>, never <code>BaseException</code> — that one also covers <code>KeyboardInterrupt</code> and <code>SystemExit</code>, which you do not want to swallow. One base class per library, with specific errors under it, is the convention.",
  },
  {
    id: 134, topic: "Errors",
    bridge: "<code>try</code> has a fourth block, and it is the least known.",
    ask: "Which block runs only when <em>no</em> exception was raised?",
    code: 'try:\n    data = parse(raw)\nexcept ValueError:\n    log("bad input")\n~:\n    save(data)        # only if parse() succeeded\nfinally:\n    close()',
    accepted: ["else"],
    concept: "Code that should run only on success can sit inside the <code>try</code>, but then its own failures get caught by the same handler and misreported. A separate block keeps the risky part small.",
    why: "<code>try</code>/<code>except</code>/<code>else</code>/<code>finally</code>. Keeping the <code>try</code> down to the one line that can actually fail is what stops a handler catching an error it was never meant to.",
  },
  {
    id: 135, topic: "Errors",
    bridge: "And when you catch one error and raise another, keep the trail.",
    ask: "Preserve the original cause.",
    code: "try:\n    config = json.loads(raw)\nexcept json.JSONDecodeError as err:\n    raise ConfigError(\"config is not valid JSON\") ~ err",
    accepted: ["from"],
    concept: "Re-raising as your own error type is good design, but the traceback should still show what really went wrong underneath. There is a keyword that links the two.",
    why: "<code>raise X from err</code> prints “The above exception was the direct cause…”. Without it you get the confusing “During handling of the above exception, another exception occurred” — and a colleague debugging at 2am loses the actual cause.",
  },

  /* ---------------------------------------------------------------
     Copies, and the object model biting back
     --------------------------------------------------------------- */
  {
    id: 136, topic: "Gotchas",
    bridge: "Back to copying, one level deeper than <code>.copy()</code>.",
    ask: "What does this print?",
    code: "a = [[1, 2], [3, 4]]\nb = a.copy()\nb[0].append(99)\nprint(a[0])   # shows: ~",
    accepted: ["[1, 2, 99]"],
    concept: "<code>.copy()</code> is <strong>shallow</strong>: it makes a new outer list whose slots point at the very same inner objects. Changing an inner list is visible through both names.",
    why: "For nested data use <code>copy.deepcopy(a)</code>, which rebuilds the whole tree. Shallow copies of nested structures are one of the hardest bug classes to spot, because the outer list really is independent.",
  },
  {
    id: 137, topic: "Gotchas",
    bridge: "The same sharing, arriving through a function argument.",
    ask: "What does this print?",
    code: "def add_tax(prices):\n    prices.append(0)     # edits the caller's list\n    return prices\n\nitems = [10, 20]\nadd_tax(items)\nprint(len(items))   # shows: ~",
    accepted: ["3"],
    concept: "Arguments are passed as references to objects. A function handed a mutable object can change it, and the caller sees it — there is no protective copy.",
    why: "Mutating an argument is legal but usually rude: it surprises the caller. Either return a new list, or name the function so the mutation is obvious (<code>sort_in_place</code>). Immutable arguments — ints, strings, tuples — cannot bite this way.",
  },

  /* ---------------------------------------------------------------
     Functional tools and idioms
     --------------------------------------------------------------- */
  {
    id: 138, topic: "Functions",
    bridge: "You passed <code>len</code> to <code>key=</code>. Two built-ins do the same thing across a whole sequence.",
    ask: "Apply a function to every item.",
    code: 'nums = ["1", "2", "3"]\nints = list(~(int, nums))\nprint(ints)   # [1, 2, 3]',
    accepted: ["map"],
    concept: "It takes a function and an iterable and applies one to the other, lazily. A list comprehension does the same job and is usually clearer — but you will read this form in other people's code.",
    why: "<code>map(fn, xs)</code> returns an iterator, so it needs <code>list()</code> to be seen. <code>[int(x) for x in nums]</code> is the more Pythonic spelling; <code>map</code> earns its place when the function already exists and needs no lambda.",
  },
  {
    id: 139, topic: "Functions",
    bridge: "And the selecting counterpart.",
    ask: "Keep only the items passing a test.",
    code: "evens = list(~(lambda n: n % 2 == 0, nums))",
    accepted: ["filter"],
    concept: "Same shape as the previous one, but the function returns a yes/no and the items failing it are dropped.",
    why: "<code>filter(fn, xs)</code>. With a lambda, prefer the comprehension <code>[n for n in nums if n % 2 == 0]</code>. <code>filter(None, xs)</code> is a neat special case: it drops every falsy item.",
  },
  {
    id: 140, topic: "Functions",
    bridge: "Sorting by two things at once, which comes up constantly.",
    ask: "Sort by score descending, then by name. What shape must the key return?",
    code: 'people.sort(key=lambda p: (-p["score"], p["name"]))\n#                          ^^^^^^^^^^^^^^^^^^^^^^\n#                          a ~',
    accepted: ["tuple"],
    concept: "Several values compared side by side go element by element: the first one decides, and the later ones only break ties. Returning a group of values from the key gives you a multi-level sort in one pass.",
    why: "Negating a number flips its direction, which is how you mix ascending and descending in one key. For non-numbers, sort twice and lean on stability instead — sort by the minor field first, then the major one.",
  },
  {
    id: 141, topic: "Strings",
    bridge: "Two small pieces of syntax worth having at your fingertips.",
    ask: "Reverse a string with a slice.",
    code: 'print("python"[~])   # shows: nohtyp',
    accepted: ["::-1"],
    concept: "A slice takes a third number, the step. A step of <code>-1</code> walks the sequence backwards, and leaving start and stop empty means “the whole thing”.",
    why: "<code>[::-1]</code> reverses any sequence — string, list, tuple. <code>[::2]</code> takes every second item. Worth knowing it builds a whole reversed copy, so on a huge list <code>reversed(x)</code> is the lazy alternative.",
  },
  {
    id: 142, topic: "Strings",
    bridge: "And formatting a number inside an f-string.",
    ask: "Show two decimal places and a thousands separator.",
    code: 'total = 1234567.891\nprint(f"{total:~}")   # shows: 1,234,567.89',
    accepted: [",.2f"],
    concept: "A colon inside the braces starts a format spec: width, alignment, thousands separators, decimal places, percentages, dates. It is a small language of its own.",
    why: "<code>:,.2f</code> for money, <code>:.1%</code> for a percentage, <code>:&gt;10</code> to right-align in ten columns, <code>:%Y-%m-%d</code> on a date. Also <code>f\"{x=}\"</code> prints <code>x=5</code> — the fastest debug print there is.",
  },
  {
    id: 143, topic: "Gotchas",
    bridge: "One keyword for stating what you believe to be true.",
    ask: "Fail loudly if an assumption is broken.",
    code: "def divide(a, b):\n    ~ b != 0, \"b must not be zero\"\n    return a / b",
    accepted: ["assert"],
    concept: "One keyword checks a condition and raises an error carrying your message when it fails. It documents an assumption in a way that gets verified rather than ignored.",
    why: "Use it for internal invariants and in tests. Do <em>not</em> use it to validate user input or enforce security: running Python with <code>-O</code> removes every assert from the program. For real validation, <code>raise ValueError</code>.",
  },
  {
    id: 144, topic: "Decisions",
    bridge: "And a newer piece of control flow you will start seeing in modern code.",
    ask: "Python 3.10's structural pattern matching.",
    code: 'match command.split():\n    case ["go", direction]:\n        move(direction)\n    case ["quit"]:\n        exit()\n    ~ _:\n        print("unknown")',
    accepted: ["case"],
    concept: "More than a switch: each branch matches the <em>shape</em> of the value — list length, dict keys, class type — and binds the pieces to names as it matches.",
    why: "<code>match</code>/<code>case</code>, Python 3.10+. <code>case _:</code> is the catch-all. It shines on parsing and on tree-shaped data; for a plain value lookup, a dict is still simpler and faster.",
  },
  {
    id: 145, topic: "Type hints",
    bridge: "One runtime check, for when duck typing is not enough.",
    ask: "Check a value's type at runtime.",
    code: 'if ~(value, str):\n    value = value.strip()',
    accepted: ["isinstance"],
    concept: "Unlike comparing <code>type(x) == str</code>, this also accepts subclasses, which is almost always what you want. Type hints are not checked at runtime, so this is the tool when the check has to be real.",
    why: "<code>isinstance(x, (int, float))</code> accepts a tuple of types. Use it sparingly — Python prefers asking whether an object can do the thing to interrogating what it is. It is essential, though, for narrowing a union that came in from JSON.",
  },

  /* ---------------------------------------------------------------
     The standard library the basics only name-dropped
     --------------------------------------------------------------- */
  {
    id: 146, topic: "Stdlib",
    bridge: "You imported <code>math</code> once and were told six other modules exist. Here they are, starting with the one every API speaks.",
    ask: "Turn a Python dict into a JSON string.",
    code: 'import json\n\ntext = json.~({"name": "Asha", "age": 30})\nprint(text)   # {"name": "Asha", "age": 30}',
    accepted: ["dumps"],
    concept: "JSON is text; a dict is a Python object. One pair of functions converts each way, and a second pair does the same to and from a file.",
    why: "<code>dumps</code>/<code>loads</code> for strings (the <em>s</em> is for string), <code>dump</code>/<code>load</code> for files. <code>json.dumps(d, indent=2)</code> pretty-prints. Dates and sets are not JSON types, so those need converting first.",
  },
  {
    id: 147, topic: "Stdlib",
    bridge: "When <code>in</code> and <code>.split()</code> are not enough to pull text apart.",
    ask: "Find the first match of a pattern.",
    code: 'import re\n\nm = re.~(r"\\d{4}-\\d{2}-\\d{2}", line)\nif m:\n    print(m.group())   # 2026-09-17',
    accepted: ["search"],
    concept: "A regular expression describes a shape of text rather than exact characters. The <code>r</code> prefix marks a raw string, so backslashes reach the regex engine instead of being eaten by Python.",
    why: "<code>re.search</code> finds anywhere, <code>re.match</code> only at the start, <code>re.findall</code> returns every match, <code>re.sub</code> replaces. Reach for regex when the structure is genuinely irregular — for fixed separators, <code>.split()</code> is clearer and faster.",
  },
  {
    id: 148, topic: "Stdlib",
    bridge: "Dates, which are harder than they look.",
    ask: "Format a date as text.",
    code: 'from datetime import datetime\n\nnow = datetime.now()\nprint(now.~("%Y-%m-%d"))   # 2026-09-17',
    accepted: ["strftime"],
    concept: "Two mirrored methods: one turns a date into a string with a format you choose, the other parses a string back into a date using the same codes.",
    why: "<code>strftime</code> = string <em>from</em> time; <code>strptime</code> = string <em>parse</em> time. Subtracting two datetimes gives a <code>timedelta</code>. Store and compute in UTC and convert only for display — that one habit prevents a whole genre of bug.",
  },
  {
    id: 149, topic: "Stdlib",
    bridge: "Paths, which should never be built with string concatenation.",
    ask: "Join a directory and a filename the portable way.",
    code: 'from pathlib import Path\n\np = Path("data") ~ "raw.csv"\nprint(p.read_text())',
    accepted: ["/"],
    concept: "The division operator is overloaded on path objects to mean “join”, so paths read the way they look and the correct separator is chosen for the operating system.",
    why: "<code>pathlib</code> replaces most of <code>os.path</code>: <code>.exists()</code>, <code>.read_text()</code>, <code>.glob(\"*.csv\")</code>, <code>.stem</code>, <code>.parent</code>, <code>.mkdir(parents=True)</code>. Building paths with <code>+</code> and <code>\"/\"</code> breaks on Windows.",
  },
  {
    id: 150, topic: "Stdlib",
    bridge: "And a module of loop shortcuts you would otherwise write by hand.",
    ask: "Every pair from a list, order not mattering.",
    code: 'from itertools import combinations\n\nfor a, b in ~(items, 2):\n    compare(a, b)',
    accepted: ["combinations"],
    concept: "These build iterators lazily, so they cost almost no memory even when the number of results is enormous.",
    why: "<code>combinations</code> (order irrelevant), <code>permutations</code> (order matters), <code>product</code> (nested loops flattened), <code>groupby</code> (needs sorted input first), <code>chain</code>, <code>accumulate</code>, <code>islice</code>. Worth an afternoon of reading the module docs.",
  },
  {
    id: 151, topic: "Collections",
    bridge: "One last container, for when a tuple's positions stop being memorable.",
    ask: "Give tuple slots names.",
    code: 'from collections import ~\n\nPoint = namedtuple("Point", "x y")\np = Point(1, 2)\nprint(p.x, p[0])   # 1 1',
    accepted: ["namedtuple"],
    concept: "It keeps everything a tuple gives you — immutable, hashable, unpackable — and adds attribute access, so <code>p.x</code> replaces <code>p[0]</code>.",
    why: "Good for a lightweight immutable record, especially a function returning several values. For anything with methods or defaults, a <code>@dataclass</code> (or <code>NamedTuple</code> with type hints) is the modern choice.",
  },

  /* ---------------------------------------------------------------
     Testing — the habit that makes the DSA section safe
     --------------------------------------------------------------- */
  {
    id: 152, topic: "Testing",
    bridge: "Before writing algorithms, a way to know they work. Every algorithm in the next section deserves three lines of test.",
    ask: "What must a pytest test function's name start with?",
    code: "def ~_reverse_empty():\n    assert reverse([]) == []",
    accepted: ["test"],
    concept: "pytest finds tests by naming convention: files named <code>test_*.py</code> containing functions named <code>test_*</code>. No classes, no boilerplate, no registration.",
    why: "Plain <code>assert</code> is all you need — pytest rewrites it to show both sides when it fails. Run with <code>pytest</code> or <code>pytest -k reverse</code> to filter.",
  },
  {
    id: 153, topic: "Testing",
    bridge: "Testing that something fails is as important as testing that it works.",
    ask: "Assert that a call raises.",
    code: "import pytest\n\ndef test_divide_by_zero():\n    with pytest.~(ZeroDivisionError):\n        divide(1, 0)",
    accepted: ["raises"],
    concept: "It is a context manager: the block is expected to blow up, and the test fails if it does not. That makes an error path something you can pin down rather than hope about.",
    why: "<code>pytest.raises(E)</code>, optionally with <code>match=\"regex\"</code> to check the message. Test the edge cases first — empty input, one item, duplicates, the maximum — because those are exactly where algorithms break.",
  },
  {
    id: 154, topic: "Testing",
    bridge: "One habit that catches most algorithm bugs before anyone else sees them.",
    ask: "Which input should you always test first?",
    code: "assert longest_run([]) == 0        # the ~ case\nassert longest_run([5]) == 1\nassert longest_run([1, 1, 2]) == 2",
    accepted: ["empty"],
    concept: "Almost every off-by-one and <code>IndexError</code> lives at the boundary: nothing, one item, two identical items, the largest allowed input. The middle of the range is where code usually already works.",
    why: "Empty, single, duplicate, sorted, reverse-sorted, all-equal. Running those six through your head before you write code is the cheapest correctness technique there is — and in an interview, saying them out loud is worth marks on its own.",
  },
] as const satisfies readonly Question[];
