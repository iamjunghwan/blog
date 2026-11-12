---
slug: tsc-incremental-type-check
title: "TypeScript Incremental Type Checking: A Deep Dive"
date: 2026-11-06
tags: ["typescript"]
thumbnail: "/uploads/2026/11/tsc-incremental-type-check.png"
draft: false
description: "A 48-second build that stayed 48 seconds no matter what I changed. Type checking was 84% of it. Here is what tsc actually writes to .tsbuildinfo, and why it caches the question rather than the answer."
---

# TypeScript Incremental Type Checking: A Deep Dive

---

I was working on a React + Vite project, building it by hand locally. Every
build took **about 48 seconds**. Once or twice I would have just waited, but it
repeated all day, and that made waiting hard. So I decided to take the 48
seconds apart.

The first thing I noticed was not that it was slow. It was that it was **always
the same**.

```text
lines changed    1    →  build 48s
lines changed  400    →  build 48s
lines changed    0    →  build 48s
```

How much I changed had no bearing on how long it took. Which means **everything
is being redone from scratch, every time.**

So I split the build into stages. Vite handles bundling, and that was a little
over 4 seconds. **Almost all of the rest was type checking.** I pulled the type
check out and measured it on its own with `--extendedDiagnostics`. It wobbled
between 38 and 50 seconds across runs; here is one of them.

```text
Files:                        3052
Lines of TypeScript:        334852
Types:                      427994
Instantiations:            3368076
Memory used:              1711344K

Program time:                4.65s
Bind time:                   0.77s
Check time:                 29.42s
Emit time:                   0.00s
Total time:                 34.84s
```

`Emit time: 0.00s`. Vite builds the bundle, so tsc emits not one character. And
yet it spends **29.42 of 34.84 seconds**. **Type checking alone is 84% of the
total.**

I had found where to cut, so it was time to dig in. The conclusion up front: I
turned on incremental checking, kept the cache around, and 48 seconds became 8.
But I did not go straight there. To cut 29.42 seconds I first had to know
**where the 29.42 seconds comes from.**

## 1. What those four lines are — the compiler's four phases

`Program` / `Bind` / `Check` / `Emit` in that output are not arbitrary
divisions. They are **the four phases tsc puts source through, printed as-is.**

```text
┌──────────────────────────────────────────────────────────────┐
│  TypeScript compiler pipeline                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Scanner / Parser    read source, build the AST           │
│         ↓                                   → Program time   │
│  2. Binder              link declarations to symbols/scopes  │
│         ↓                                   → Bind time      │
│  3. Type Checker        inference, assignability, generics   │
│         ↓                                   → Check time  ★  │
│  4. Emitter             write JS / .d.ts (skipped if noEmit) │
│                                             → Emit time      │
└──────────────────────────────────────────────────────────────┘
```

Each phase does a different job, and **each costs differently.**

- **1. Scanner / Parser** — reads files, splits them into tokens, builds an AST.
  A preprocessor runs ahead of it, following `import`s and references to decide
  **which files go into the compilation in the first place.** The TypeScript
  docs describe `Program time` as the combined time spent reading from the file
  system, scanning, and parsing. This project's output does print
  `I/O Read 1.13s`, `Parse 1.51s`, and `ResolveModule 1.60s` separately, and
  together they come close to `Program time 4.65s`. Cost scales **with the
  number of files and lines.**
- **2. Binder** — walks the AST, creates symbols, seats them in scopes. It
  connects which name refers to which declaration. In the docs' phrasing, it
  builds semantic information that is "local to a single file." **It never
  crosses a file boundary, so it is cheap.** 0.77 seconds.
- **3. Type Checker** — infers types, decides whether assignments hold, resolves
  generics. Unlike phase 2, it **does cross file boundaries.** To know whether
  the types in file A hold, you need the types file B exports. So its cost
  follows type complexity, not file count. The 420,000 types and 3.36 million
  instantiations came from here. 29.42 seconds.
- **4. Emitter** — writes JS or `.d.ts`. With `noEmit: true` it is skipped
  entirely. 0.00 seconds.

Laid out that way, the original output reads differently.

```text
Program time    4.65s   ← phase 1. reading and parsing files
Bind time       0.77s   ← phase 2. work that stays inside a file
Check time     29.42s   ← phase 3. work that crosses files. 84% is here
Emit time       0.00s   ← phase 4. Vite does this, so zero
```

It is not that type checking is slow. It is that **only phase 3 is unusually
expensive.** Phases 1 and 2 grow linearly as you add files; phase 3 jumps
non-linearly as your types get more involved.

And the fact that **phase 3 is the only one that crosses file boundaries**
carries straight into the rest of this. "If I change this file, how far do I
have to look again?" is a question only phase 3 raises.

This diagram is the map for everything that follows. Two things to flag up
front:

- What incremental checking skips is **phase 3 only**. Phases 1 and 2 are redone
  from scratch every time — I measure this later.
- When `.tsbuildinfo` decides "does this file need rechecking," it borrows,
  surprisingly, **phase 4 (the Emitter).** Why it does that is the center of
  this article.

## 2. Find out where the 29.42 seconds goes first — `--generateTrace`

That log tells you "type checking is slow" and nothing more. It cannot tell you
**which file** or **which type computation** is taking the time. You get a total
with no breakdown.

The option that produces the breakdown is `--generateTrace`.

```bash
pnpm exec tsc -p tsconfig.app.json --generateTrace ./trace
```

Running it creates two files.

```text
frontend/
└─ trace/
   ├─ trace.json
   └─ types.json
```

- **`trace.json`** — the **timeline** of what the compiler did. It is Chrome
  Trace Event format, so it loads straight into a timeline tool.
- **`types.json`** — information about the **types** created along the way. When
  `trace.json` says "type #41273 took a while," this is where you look up what
  that number is.

### What is inside `trace.json`

The events it accumulates have names like these.

```text
createSourceFile        read a file, turn it into an AST
bindSourceFile          connect scopes and symbols
checkSourceFile         ← type check. one per file
structuredTypeRelatedTo ← decide whether two types are compatible
checkExpression         resolve the type of one expression
getVariancesWorker      compute variance of generic type arguments
```

Each event carries a start time (`ts`), a duration (`dur`), and the path of the
file it applies to. So **summing time per event tells you where time pooled.**

### Two ways to read it

**① Load it into a timeline viewer.** The way the TypeScript docs point to is
opening `about://tracing` in Edge or Chrome and using `Load` to open
`trace.json`. You get a flame chart, where a long horizontal bar is a long
operation. Click it and you see which file. Good for taking in the overall
shape.

> That guidance is a little dated, though. `chrome://tracing` was declared
> deprecated in July 2022 and **now redirects to
> [Perfetto UI](https://ui.perfetto.dev/) by default.** The Catapult docs note
> that you can keep using the old UI but make no promise it will keep working.
> So in practice you drag `trace.json` onto Perfetto — same Chrome Trace Event
> format.
>
> And it is **a different screen from the DevTools Performance tab.** Easy to
> mix up; that is not where this goes.

**② Turn it into prose with `@typescript/analyze-trace`.** An analysis tool from
the TypeScript team that, instead of making you squint at a flame chart, prints
**a list sorted by how long things took.** The official README gives this
invocation.

```bash
npm install --no-save @typescript/analyze-trace
npx analyze-trace ./trace
```

The executable name differs from the package name. You install
`@typescript/analyze-trace` but **you run `analyze-trace`.** The argument is not
a file but **a directory containing both `trace.json` and `types.json`.**

A few useful options.

```text
--skipMillis   <ms>   hide operations shorter than this (default 100)
--forceMillis  <ms>   always show operations longer than this (default 500)
--expandTypes  <bool> print expanded type names (default true)
--color        <bool> set false when redirecting to a file
```

It points at hot spots down to the file and type, and it separately flags
**the same npm package appearing in multiple versions and being checked twice.**
When you are first hunting for a cause, this is the faster route.

> The docs are explicit that the format of the performance trace file is not
> stable and may change between versions. If you plan to write a script that
> depends on event names or structure, check it whenever you bump TypeScript.

### What you are looking for

Three patterns are worth watching in the output.

- **A file whose `checkSourceFile` is unusually long** — that one file is
  dragging the whole thing. Usually it holds a huge union type, a deeply
  recursive conditional type, or a complicated generic left to inference.
- **A deeply nested run of `structuredTypeRelatedTo`** — type compatibility
  comparison has exploded. Compare two large unions and the combinations
  multiply. This is exactly where a single explicit type annotation can cut the
  comparison short.
- **A `.d.ts` from `node_modules` showing up** — the expensive types are a
  library's, not yours. You cannot fix that directly, so you end up looking at
  `skipLibCheck` or how you import. Note the caveat the docs add about
  `skipLibCheck`: it can hide misconfiguration and conflicts in `.d.ts` files,
  so they recommend it only as a way to speed up builds.

**If one or two files hog the time, fixing those types is the answer.**
Conversely, if time is spread evenly across 3,000 files, there is no culprit to
fix. Then the move is not to make checking faster but **to make it get skipped**
— that is, incremental checking. My case was the latter.

## 3. What incremental checking is

### Definition

Ordinary type checking **checks the entire program from scratch on every run.**
It does not remember what it checked last time. When the process ends, it
forgets everything. "48 seconds no matter what I change" from the opening is
what that looks like.

**Incremental type checking leaves information from the last run on disk, and
this time rechecks only what changed and what that change reaches.** In the
TypeScript docs' phrasing, the `--incremental` flag tells TypeScript to save
information about the project graph from the last compilation into a
`.tsbuildinfo` file.

Turning it on is two lines of config.

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/.cache/tsconfig.app.tsbuildinfo"
  }
}
```

One term is worth separating out. **Incremental compilation**, as people usually
use it, includes "do not re-emit JS for unchanged files." But with Vite, Vite
makes the JS and tsc runs with `noEmit`, so there is nothing to emit in the
first place. **The gain that remains is on the checking side**, and that is what
this article is about.

### What you get

- **Repeat runs get cheap.** Change nothing and run again and there are zero
  files to check. I measure this below.
- **Time starts to scale with how much you changed.** This is the biggest thing
  in daily use. Changing one line no longer checks 3,000 files. Feedback on
  small edits gets fast enough that the "kick off a build, go do something else"
  rhythm disappears.
- **The cache survives errors.** The loop of fixing type errors gets
  particularly fast. Section 10 covers this.
- **You do not have to touch the code.** There is another road — refactor your
  types so checking gets lighter — but that changes code, which brings review
  and risk. Incremental is two lines of config and **the output does not
  change.**
- **It is the same mechanism that makes your editor fast.** `tsc --watch` uses
  the same builder internally
  (`createEmitAndSemanticDiagnosticsBuilderProgram`). You are applying the
  experience of saving a file in VS Code without the whole project being
  rechecked to a CLI build.

One thing I want to be clear about. **Incremental checking does not check
less.** It skips what does not need redoing, and the errors it reports should
match a full check. It is not a trade of rigor for speed — which is why it is
safe to turn on.

It is not free, of course. It does nothing for the first run, you have to
preserve the cache file, and there is a class of file that re-triggers
everything. Sections 7, 9, and 12 cover each with numbers.

### How it knows what changed

Read the definition again and one spot is empty. **How** does tsc work out "what
changed and what that change reaches"? Incremental checking is effectively that
single problem.

Start with why caching is valid at all: type checking gives **the same result
for the same input.** If the contents of `util.ts` are unchanged and so are the
things it depends on, checking it again produces exactly what it produced last
time. No reason to redo it.

So the problem to solve is not "how do I store the result." It is **how do I
know what is unchanged.**

Does it store last run's check results wholesale? If so, changing a single file
would have to invalidate all of them. And it does not.

So I opened `.tsbuildinfo`.

## 4. There are no types in `.tsbuildinfo`

Turn on `incremental: true` and tsc leaves behind one `.tsbuildinfo`. I built a
real one from a small project first. Three files, that is all.

```ts
// src/types.ts
export type User = { id: number; name: string };

// src/util.ts  — uses types.ts
import type { User } from "./types";
export function label(u: User): string {
  return u.name;
}

// src/app.ts   — uses util.ts and types.ts
import { label } from "./util";
import type { User } from "./types";
const u: User = { id: 1, name: "a" };
console.log(label(u));
```

The top-level keys of the `.tsbuildinfo` it produced:

```text
fileNames, fileIdsList, fileInfos, root,
options, referencedMap, affectedFilesPendingEmit, version
```

No `Types`. No `Symbols`. The 420,000 types and 3.36 million instantiations that
other project produced — **not one of them is stored.** The 1.7GB of checker
state vanishes with the process.

So what is in there? One at a time:

```text
fileNames : ["...lib.es5.d.ts", ..., "./src/types.ts", "./src/util.ts", "./src/app.ts"]
             (54 of them. Indices are 1-based — types.ts=52, util.ts=53, app.ts=54)

fileInfos : ["8abb6039...", "90ed9150...", "accad909..."]   ← one hash per file

root      : [[52, 54]]            ← my sources are 52 through 54

fileIdsList  : [[52,53], [52]]
referencedMap: [[54,1], [53,2]]
```

The last two lines are the point. `[54, 1]` in `referencedMap` means "file 54
(app.ts) references list 1 in `fileIdsList`, which is `[52,53]`." `[53, 2]`
means *"file 53 (util.ts) references list 2, which is `[52]`."*

That is this graph, written down as numbers.

```text
types.ts(52) ──→ util.ts(53) ──→ app.ts(54)
      └──────────────────────────────┘
```

**`.tsbuildinfo` is not type check results. It is a ledger of "who uses whom"
and "what each file looked like at the time."** That settles what tsc does on
the next run. Re-read the files, hash them, find the ones whose hash differs
from the ledger, walk the graph, and check **only the affected files.**

What gets cached is not the answer. It is **the scope of the question.**

## 5. There is more than one hash — `version` and `signature`

A question follows immediately. If a file's contents change, does everything
that uses it have to be rechecked?

Consider changing only a function body.

```ts
// before
export function fullName(u: User): string {
  return u.name;
}

// after — the contents differ, but the shape seen from outside is the same
export function fullName(u: User): string {
  const trimmed = u.name.trim();
  return trimmed.length > 0 ? trimmed : "anonymous";
}
```

From the perspective of anything that uses `fullName`, **nothing changed.** It
still takes a `User` and gives back a `string`. There is no reason to recheck.

tsc distinguishes this too. Which is why it holds **two** hashes per file.

```json
{
  "version":   "26d6ed93d74b97ea0761ffd01365ddc5091267df6ca163f99a4db8820ef8a9d0",
  "signature": "5e4456471897c953d358cb6dda495f1c4c1fce176198c35e6468fdd094819095"
}
```

- **`version`** — a hash of the file's **source text**. One space in a comment
  changes it.
- **`signature`** — a hash of **what comes out when you emit that file's
  `.d.ts`.** That is, "the shape seen from outside."

The code that produces `signature` is right there in `typescript.js`.

```js
function computeDtsSignature(programOfThisState, sourceFile, ..., onNewSignature) {
  programOfThisState.emit(
    sourceFile,
    (fileName, text, ...) => {
      Debug.assert(isDeclarationFileName(fileName), ...);  // must be a .d.ts
      onNewSignature(computeSignatureWithDiagnostics(..., text, ...));
    },
    ...
  );
}
```

It **actually emits** the declaration file and hashes that text. Function bodies
do not appear in a `.d.ts`, so change only a body and `version` moves while
`signature` stays put.

And which of the two changed decides how wide the recheck goes.

```js
function getFilesAffectedByWithOldState(state, programOfThisState, path, ...) {
  const sourceFile = programOfThisState.getSourceFileByPath(path);
  if (!sourceFile) return emptyArray;

  if (!updateShapeSignature(state, programOfThisState, sourceFile, ...)) {
    return [sourceFile];                      // ← signature unchanged: this file only
  }
  return getFilesAffectedByUpdatedShapeWhenModuleEmit(...);  // ← changed: everyone using it
}
```

`updateShapeSignature` computes the new `signature` and returns
`latestSignature !== prevSignature`. That one line separates "just me" from
"everyone who uses me."

## 6. So how many get rechecked — I counted

What you read and what actually runs can differ, so I measured. I built a
structure where 600 files all use one shared module.

```text
types.ts ──→ core.ts ──→ mod0.ts … mod599.ts   (602 total + 51 lib files)
```

For counting I use the same `--generateTrace` from section 2. This time not for
timing but to count **`checkSourceFile` events**. One is emitted per file, so
the count is the number of files actually checked. Unlike timings it does not
wobble with machine state, which makes it good for comparison.

```bash
tsc -p tsconfig.json --generateTrace trace_dir
```

I measured with `noEmit: true`, exactly as a Vite app is usually configured.

| What I changed | Files rechecked |
|---|---|
| (first run, no cache) | 653 |
| nothing | **0** |
| `core.ts` body only | 601 |
| `core.ts` return type `string` → `string \| null` | 601 |
| `types.ts` | 602 |

Change nothing and it is **0**. The `Check time` line disappears from the output
entirely.

I also measured how counts translate into time. Same project, three runs,
values from `--extendedDiagnostics` (run-to-run spread was ±0.03s).

| What I changed | Files checked | `Program time` | `Check time` | `Total time` |
|---|---|---|---|---|
| **first run** (no cache) | 653 | 0.47s | **0.77s** | **1.33s** |
| nothing | 0 | 0.47s | **(line absent)** | **0.57s** |
| `core.ts` body only (first edit) | 601 | 0.46s | 0.35s | 1.10s |
| `core.ts` body only (next) | 1 | 0.46s | **0.02s** | 0.60s |

`Check time` tracks the count exactly. 0.77s for 653, 0.35s for 601, 0.02s for
1. Files checked *is* the time.

But **`Program time` does not budge.** Every row is 0.46 to 0.47 seconds. What
incremental skips is *checking*, not *reading, parsing, and module resolution*.
Reading 603 files off disk, turning them into ASTs, and resolving `import` paths
**is redone from scratch every time.**

That sets incremental's floor. The first run's 1.33s goes down to 0.57s, but not
to zero. Mapped onto the original project:

```text
Program time   4.65s  ┐
Bind time      0.77s  ┘ → incremental cannot erase this (paid every time)
Check time    29.42s    → what incremental erases
───────────────────────
Total time    34.84s    → 5.42s is the floor, however good it gets
```

**The most incremental can erase is 29.42 seconds, and 5.42 seconds remain.** 48
seconds becoming 8 was not a trip to zero either; it is Vite's bundling stacked
on top of that floor.

And one more — **incremental does nothing at all for the first run.** That is
the first row of the table. With no `.tsbuildinfo` you pay all 653 files, all
29.42 seconds. If CI cannot restore the cache, having `incremental: true` on is
the same as having it off. Turning the setting on and preserving the cache are
two separate jobs.

Back to the table, though: the "`core.ts` body only" row is odd. **I changed
only the body and 601 files were rechecked.** The same as changing the
signature. Where did the `signature` comparison we just saw go?

## 7. Only the first edit is expensive

Once more, this time changing only the body three times in a row.

| Order | Files rechecked |
|---|---|
| first run | 653 |
| body edit #1 | **601** |
| body edit #2 | **1** |
| body edit #3 | **1** |

From the second on it is 1. Only the first is expensive.

Counting when `signature` lands in `.tsbuildinfo` gives the answer.

```text
right after first run   src files with a signature: 0 / 602
right after first edit  src files with a signature: 601 / 602
```

**The first run creates no signatures at all.** The reason is one line where
state is set up.

```js
useFileVersionAsSignature: !disableUseFileVersionAsSignature && !useOldState
```

`useOldState` is "did we inherit a previous `.tsbuildinfo`." On a first run
there is nothing to inherit, so `useOldState` is false, which makes
`useFileVersionAsSignature` **true**. Then `updateShapeSignature`, rather than
emitting a `.d.ts`, uses the source-text hash directly as the `signature`.

```js
if (!sourceFile.isDeclarationFile && !useFileVersionAsSignature) {
  computeDtsSignature(...);        // ← not entered on a first run
}
if (latestSignature === void 0) {
  latestSignature = sourceFile.version;   // ← uses the source hash as-is
}
```

`signature === version`, and when serialized, two identical values are written
as a single string. That is why it looked like `0 / 602`.

Now it lines up — why the first edit was expensive.

```text
first run     signature = bbf56589…  (source-text hash)
body edit     source changed → recompute. this time it emits a .d.ts → 6a1cdf84…
              6a1cdf84… ≠ bbf56589…  →  judged "the shape changed" → 601 files
second edit   prevSignature = 6a1cdf84… (a real .d.ts hash)
              re-emitting gives 6a1cdf84…  →  same → 1 file
```

**It compared a source-text hash against a `.d.ts` hash.** Those two could never
match. The shape had not changed; the kinds of thing being compared differed.

## 8. Turn on `composite` and the first edit gets cheap too

What if you make it actually emit the `.d.ts`? Then real signatures would be
stored from the first run. Same 600-file project, config changed only.

```json
{
  "composite": true,
  "emitDeclarationOnly": true,
  "outDir": "./dist"
}
```

Turn on `composite` alone and you do not need to write `declaration` or
`incremental` separately. Per the docs, **both default to `true` when
`composite` is on.** I added `emitDeclarationOnly` on top so it emits `.d.ts`
and no JS. Vite makes the JS anyway.

Note that `composite` attaches conditions the moment you turn it on. The docs
list three things that happen when this setting is on:

- **Every implementation file must be matched by `include` or `files`.** If one
  is missing, `tsc` refuses and tells you which.
- **The default for `rootDir` changes.** Normally it is the longest common path
  of the input files; under `composite` it becomes the directory holding
  `tsconfig.json`.
- **`declaration` defaults to `true`.**

Running with just the config above does produce 602 `.d.ts` files and zero
`.js`. I never wrote `declaration` and got declaration files, so that default
really did change; I never wrote `incremental` and got a `.tsbuildinfo`, so that
one holds too. Output landing in `dist/src/` rather than `dist/` is the changed
`rootDir` default showing up as well.

There is one more consequence that follows along, not written in the docs.
`declaration` being on means **a `.d.ts` must actually be emitted**, and if
there is code it cannot emit for, that is an error. A classic case is a return
type left to inference that resolves to a type with no nameable form from
outside. So turning `composite` on in an existing project can spill errors at
first. The price is not zero.

| What I changed | `noEmit: true` | `composite: true` |
|---|---|---|
| first run | 653 | 653 |
| `core.ts` body only | **601** | **1** |
| `core.ts` signature | 601 | 601 |

As expected. Changing only the body takes 601 down to 1. Genuinely change the
signature and both are 601 — as they should be.

Open the `.tsbuildinfo` and the difference is right there.

```text
noEmit     after first run  core.ts →  version=bbf56589…  signature=(none)
composite  after first run  core.ts →  version=bbf56589…  signature=6a1cdf84…
```

To summarize:

- **`noEmit: true`** — after the cache goes cold, **the first edit** rechecks
  everything that depends on the file. From then on it narrows properly.
- **`composite: true`** — the first run emits `.d.ts`, so it narrows from the
  first edit. In exchange the first run pays for producing declaration files.

If you leave it running locally all day and keep editing, `noEmit` is enough.
You lose on one edit. But **in an environment like CI, where you restore a
cache, run once, and throw it away**, every run is a "first edit." That is where
`composite` earns its keep.

## 9. Some files ignore the graph entirely

Everything so far has been about propagation along `referencedMap`. But there
are files that skip that graph altogether.

```js
function getAllDependencies(state, programOfThisState, sourceFile) {
  const compilerOptions = programOfThisState.getCompilerOptions();
  if (compilerOptions.outFile) {
    return getAllFileNames(state, programOfThisState);
  }
  if (!state.referencedMap || isFileAffectingGlobalScope(sourceFile)) {
    return getAllFileNames(state, programOfThisState);   // ← everything
  }
  ...
}
```

If `isFileAffectingGlobalScope`, it ignores the graph and returns **every
file.** The test is this:

```js
function isFileAffectingGlobalScope(sourceFile) {
  return containsGlobalScopeAugmentation(sourceFile)
    || (!isExternalOrCommonJsModule(sourceFile)
        && !isJsonSourceFile(sourceFile)
        && !containsOnlyAmbientModules(sourceFile));
}
```

**A file with no top-level `import` or `export`** is not a module; it is a
global script. Its declarations are visible from every file, so if it changes,
everything has to be looked at again.

If you work with Vite, a familiar file lands exactly here.

```ts
// src/env.d.ts  — no import, no export
declare const __APP_VERSION__: string;
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
```

I added this file to the same 600-file project and appended one line.

| What I changed | Files rechecked |
|---|---|
| nothing | 0 |
| one line added to `env.d.ts` | **654 (all)** |

`.tsbuildinfo` carries a separate marker for it.

```text
env.d.ts → {"version":"8a63a94f…", "affectsGlobalScope": true}
entries in referencedMap that reference env.d.ts: []
```

The reference list is empty and everything was rechecked anyway. It is not in
the graph, so **the graph cannot contain it**. Standard library declarations
like `lib.es5.d.ts` carry the same marker.

The part that bites in practice is not the global type file itself. You barely
ever touch that one. The problem is **a file you thought was a module and is
not**: a constants file with no `export`, a utility holding a `declare global`,
a file whose `export` got dropped during a cleanup. One of those in the mix and
every edit triggers a full check. If you turned incremental on and it did not
get faster, this is the first place to look.

## 10. Errors are cached too

One more. Leave a type error in place and run twice.

```text
$ tsc -p tsconfig.json
src/app.ts(4,7): error TS2322: Type 'string' is not assignable to type 'number'.

$ tsc -p tsconfig.json       # again, changing nothing
src/app.ts(4,7): error TS2322: Type 'string' is not assignable to type 'number'.
```

The second run **did not check that file.** It pulled the message out of
`.tsbuildinfo` and printed it again.

```json
"semanticDiagnosticsPerFile": [
  [54, [{ "start": 113, "length": 1, "code": 2322, "category": 1,
          "messageText": "Type 'string' is not assignable to type 'number'." }]]
]
```

Position, code, and sentence, all of it. File 54 is the `app.ts` from earlier.

So **incremental holds up even with errors present.** A failed check does not
throw the cache away. CI can end red and the next run is still fast.

## 11. In the real project

That is all from a 600-file model. Go back to the 3,052-file project at the
start and do the same thing and you get this.

**Before** was simple.

```text
one build          about 48s
  type checking    about 38–50s   ← 90% of the total
  bundling (Vite)  about 4s
```

**It was always 48 seconds, whatever I changed.** One comment line, one file,
the same. Which makes sense — with no cache you check all 3,052 from scratch
every time. What I changed and what got checked had nothing to do with each
other.

Turning incremental on and preserving `.tsbuildinfo`, **the one number split
into three.**

| Situation | Build time | What happens |
|---|---|---|
| **first build** (no cache) | about 48s | full type check. incremental has nothing to do |
| **build with no edits** | **about 8s** | reuses build info, skips most checking |
| **after editing a shared file** | about 27s | rechecks the changed file plus everything using it |

The middle row is "48 seconds → 8 seconds." The remaining 8 is the floor from
earlier — phases 1 and 2 (reading, parsing, binding) plus Vite's bundling.
Incremental cannot erase that.

The interesting row is **the third.** Edit a shared file and everything using it
becomes a recheck target, so the scope widens. That is precisely the scene from
the model in section 6.

```text
model:  edit core.ts        → 601 / 653 files rechecked  (92%)
real:   edit a shared file  → about 27s / 48s            (56%)
```

Same phenomenon. Knowing that 27 seconds instead of 8 is not "why isn't this
working" but **the result of propagation along `referencedMap`** makes it a
number you can accept. And it is still nearly twice as fast as 48.

Recall section 7 and there is another layer here. Under `noEmit`, **the first
build after editing a shared file** checks just as widely whether you changed a
body or a signature. Part of that 27 seconds may be that cost. Edit the same
file again and the second one drops.

Put together: **incremental checking does not make builds uniformly fast, it
makes them proportional to what you changed.** One number, 48 seconds, splitting
into 8, 27, and 48 is that story.

## 12. Summary

Back to the first question — tsc does not store the **result** of a 29-second
check. The 420,000 types and 3.36 million instantiations are built fresh and
thrown away every time.

Instead it writes down three things.

1. **Who uses whom** — `referencedMap`
2. **What each file looked like then** — `version` (source text) and `signature`
   (`.d.ts` shape)
3. **What errors there were then** — `semanticDiagnosticsPerFile`

On the next run it uses 1 and 2 to **narrow the list of files to recheck**, and
if nothing narrows out, reprints 3 as-is. The check itself is not cached. What
is cached is **the reason the check can be skipped.**

So incremental checking does not make builds "always fast." Of the four phases
in section 1, it skips phase 3 only, and only as much as you changed. One number
of 48 seconds **splitting** into 8, 27, and 48 is the whole of it, and that is
correct behavior.

Which means, in practice:

- **It only helps if you preserve `.tsbuildinfo`.** Without that file it is a
  first run, and incremental does **nothing at all** for a first run — you pay
  the full 29.42 seconds. Turning the setting on and preserving the cache are
  two separate jobs.
- **Start by checking where that file lands.** The defaults the docs give:
  `<outDir>/<config name>.tsbuildinfo` if `outDir` is set, otherwise
  `<config name>.tsbuildinfo` next to the config file. So with
  `tsconfig.app.json` you get `tsconfig.app.tsbuildinfo`. **Landing inside
  `outDir` is the trap** — a script that wipes the output folder before building
  wipes the cache with it. Point `tsBuildInfoFile` somewhere outside the output
  folder, and in CI put that path in your cache key.
- **`Check time` is the only thing you can erase.** `Program time` and
  `Bind time` are paid every run. The floor under a 34.84-second check is 5.42
  seconds, not zero. To go below that you work on file count or `include` scope,
  not incremental.
- **The cache survives errors.** There is no reason to discard it because
  something failed.
- **Edit a global-scope file and everything gets rechecked.** If incremental is
  on and nothing got faster, go looking for files with no `import`/`export`.
- **Consider `composite` if you want `.d.ts` shapes cached in CI.** Where every
  run is a "first edit," `noEmit` checks widely one extra time.

And either way, measuring comes first. The order is:

1. **`--extendedDiagnostics`** — see how much of the total is `Check time`. If
   that is small, type checking is not the culprit and you should look
   elsewhere.
2. **`--generateTrace` + `@typescript/analyze-trace`** — see whether that time
   is concentrated in one or two files or spread across everything.
   **Concentrated, fix the types; spread, skip the work with incremental.** The
   road forks here.
3. **The `checkSourceFile` count from `--generateTrace`** — after turning
   incremental on, count whether it actually dropped. Timings wobble with
   machine state; counts do not.

48 seconds becoming 8 was not a guess either. It was work done by reading
numbers in that order.

---

### References

- [TypeScript Handbook — Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TSConfig Reference — `incremental`](https://www.typescriptlang.org/tsconfig/#incremental)
- [TSConfig Reference — `composite`](https://www.typescriptlang.org/tsconfig/#composite)
- [TSConfig Reference — `tsBuildInfoFile`](https://www.typescriptlang.org/tsconfig/#tsBuildInfoFile)
- [TypeScript Wiki — Performance](https://github.com/microsoft/TypeScript/wiki/Performance) (definitions of per-phase timings, tracing, `skipLibCheck`)
- [TypeScript Compiler Notes — overview of the compilation process](https://github.com/microsoft/TypeScript-Compiler-Notes)
- [`@typescript/analyze-trace`](https://github.com/microsoft/typescript-analyze-trace)
- [Perfetto UI — trace viewer](https://ui.perfetto.dev/)
- [Catapult — note on `chrome://tracing` moving to Perfetto](https://chromium.googlesource.com/external/github.com/catapult-project/catapult.git/+/master/tracing/docs/perfetto.md)
- Compiler code quoted above comes from `node_modules/typescript/lib/typescript.js` in TypeScript 5.8.3
