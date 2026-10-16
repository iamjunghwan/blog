---
slug: ai-developer-responsibility
title: "A Developer's Responsibility When Working with AI"
date: 2026-10-14
tags: ["ai", "react"]
thumbnail: "/uploads/2026/10/ai-developer-responsibility.png"
draft: false
description: "The code I fixed most over the past few months wasn't code that didn't work. It was code that worked fine and was wrong. Three cases, and what's left for the developer once AI takes the productivity."
---

# A Developer's Responsibility When Working with AI

---

Handing a feature to an AI is fast. That isn't up for debate anymore. Explain the requirements and you get working code, tests included. Often there's nothing to flag in review.

And yet, over the past few months, the code I fixed most was **not code that didn't work, but code that worked fine and was wrong**. The tests pass, the screen renders, review catches nothing. And it's wrong.

I did this work with Claude Code (Opus 5) plus the superpowers plugin. It's a workflow that asks about design before writing any code, leaves the plan as a document, separates implementation and review into different actors, and forces verification before anything is declared done. The cases below came out of that workflow, which I think makes them a decent picture of **what's left even when you go that far**.

This post collects three of them. It isn't an argument for "don't use AI" — it's a note on **what's left for the developer once AI takes the productivity**.

## 1. The entire screen was being repainted every second

The header has a countdown showing the time left until the session expires. A chip reading `05:42`, `05:41`, and so on.

The requirement is simple. Show the remaining time every second, and open an extension dialog when a minute is left. Hand that to an AI and it comes back quickly. It did, and **it worked fine.**

The structure was this.

```tsx
// shell layout
export const OutletLayout = () => {
  const { remainingSeconds, warningOpen, extendSession } = useSessionTimer(...);

  return (
    <div>
      <Sidebar />
      <Topbar sessionTimer={<SessionTimer remainingSeconds={remainingSeconds} />} />
      <main>
        <Outlet />          {/* ← the entire screen you're currently looking at */}
      </main>
      <SessionExpiryDialog open={warningOpen} ... />
    </div>
  );
};
```

See it? `useSessionTimer` is **in the layout.** That hook updates `remainingSeconds` every second. When state changes, that component re-renders, and when it re-renders, **everything beneath it re-renders.**

Which means the sidebar, the header, and the entire screen under `<Outlet />` that you're currently looking at were all **being repainted every second.**

### Why did nobody see it?

This is the crux. This code is **not a bug.**

- The tests pass. The time counting down is right, the dialog appearing is right, all of it
- The screen looks fine. React is fast, and the DOM only updates what changed
- Code review catches nothing. It's one hook called from a layout

The problem surfaced on **list screens with many rows**. Once the table gets large, the cost of repainting every second becomes noticeable. Scrolling isn't smooth, input lags by a beat. But seeing that symptom and thinking "it's the session timer" isn't easy. In the code, the two look entirely unrelated.

I confirmed it with React DevTools' **Highlight updates**. Turn it on and sit still, and every second the sidebar, every row of the table, and even the pagination flashed their borders.

### How I fixed it

I started by counting where the value is actually used. **There were two** — the time chip in the header, and the expiry warning dialog.

So I gathered those two into one piece and had that piece call the hook.

```tsx
export function SessionCountdown() {
  const { remainingSeconds, warningOpen, extendSession } = useSessionTimer(...);

  return (
    <>
      <SessionTimer remainingSeconds={remainingSeconds} ... />
      <SessionExpiryDialog open={warningOpen} ... />
    </>
  );
}
```

The layout just plugs in `<SessionCountdown />`. The scope being repainted every second is now confined inside this piece.

Two more things had to be settled here.

**Is it okay for the dialog to live inside the header slot?** Structurally it looks odd. An expiry dialog next to the header chip? But `Dialog` **attaches to body through a portal** — wherever it sits in the tree, it appears in the same place on screen. Looking awkward structurally and producing a different result are two different problems.

**Should it take the values it needs as props?** No. Then the layout would have to hold those values, and **they'd become the layout's concern again, putting us back where we started.** I had the piece read from the store directly.

### I wrote the test like this

Personally I think this part matters most.

```tsx
let siblingRenders = 0;

/** a sibling piece — stands in for the screen slot. Count every render. */
function Sibling() {
  siblingRenders += 1;
  return <p>screen content</p>;
}

it("★ does not re-render a sibling as the seconds tick", () => {
  render(
    <>
      <SessionCountdown />
      <Sibling />
    </>,
  );

  expect(siblingRenders).toBe(1);

  act(() => {
    vi.advanceTimersByTime(3_000);
  });

  expect(siblingRenders).toBe(1); // still the same after 3 seconds
});
```

Why go this far? Because **"the thing next to it doesn't change" cannot be confirmed by eye.**

You can see the number counting down. You can see the dialog open. But "the sibling isn't being re-rendered" is something you will never learn from looking at the screen. And **a property you can't confirm by eye will always come back** — the moment the next person thinks "it'd be cleaner to lift this hook up," it quietly reverts.

I actually moved the hook back up to the layout and confirmed this test breaks. A test that doesn't break isn't a test.

### What's left here

The code the AI produced **satisfied the requirements exactly.** The problem is that the requirements didn't contain "where should this state live."

That isn't the language of a spec, it's **the language of structure**. And structure isn't about "what should we build" but "if this attaches here, what else gets dragged in with it."

> **The developer's share ①** — see **at what height** state lives.
> Not whether the feature is correct, but **what else changes** when this state changes.

## 2. Coding conventions — the places tooling doesn't catch

Talk about conventions and people usually picture things like two spaces or four. A formatter handles that. AI follows it well too. The problem is **the rules where nothing happens if you break them.**

### A single space vanished and killed a whole class

A cell in a table needed a conditional background color. I wrote this.

```tsx
<div className={`flex flex-wrap items-center gap-1${
  isInvalid ? '' : ' bg-danger-bg rounded px-2 py-1'
}`}>
```

It worked. And then **Prettier tidied the line breaks and ate the leading space.**

```tsx
isInvalid ? "" : "bg-danger-bg rounded px-2 py-1";
//                 ^ the space is gone
```

The result is `gap-1bg-danger-bg`. No class by that name exists. The background color doesn't show.

**Nothing blows up.** Type check passes, lint passes, tests pass. The text is a separate `<span>` so it renders fine, and looking at the screen you just think "is the background a bit pale?" I first assumed **the design token value was too light**, and only after going and looking up the token value did I realize the class didn't exist at all.

The fix is one line.

```tsx
<div className={cn(
  'flex flex-wrap items-center gap-1',
  isInvalid && 'bg-danger-bg rounded px-2 py-1',
)}>
```

`cn` (the clsx/tailwind-merge family) joins the pieces with a space. The same accident becomes structurally impossible.

The lesson isn't "use `cn`." It's that **building classes by string concatenation fails silently**, and that code which fails silently should be banned by rule. It isn't something people can just be careful about every time.

### How not to "consider" dark mode

While adding a background color to that same cell, I got this question. "If the background is red, is the text white or black? Shouldn't we be thinking about dark mode too?"

A fair question, but the answer was **"you don't pick."**

The design system was publishing colors **in pairs**.

```css
:root {
  --danger-fg: hsl(0 70% 54%);
  --danger-bg: hsl(0 85% 95%);
}
.dark {
  --danger-fg: hsl(0 82% 76%);
  --danger-bg: hsl(0 45% 26%);
}
```

Just write `bg-danger-bg text-danger` and you get a pale pink background with red text in light mode, and a dark red background with bright red text in dark mode. **Dark mode support is already finished inside the token.**

Conversely, "please make it a deep red" looks simple but couldn't be done. **Because there is no text color token** to put on top of it. The moment I invent a color that doesn't exist, dark mode becomes my responsibility, and the code starts drifting away from the design system.

> **The developer's share ②** — don't **pick colors and spacing as values.**
> If it isn't in the tokens, that's not "mine to decide" — it's **a question for the design system**.

### A rule that lives outside the code will always drift

One case from the back end. The authentication framework uses **the first segment of an API path as a permission key**.

```text
/api/v1/{permission key}/.../{method name}
         ^^^^^^^^^^^^^^         ^^^^^^^^^^^
         menu permission check   read* → read / create*·update* → write
```

So the first segment of the screen route and of the API path **have to match.** If they differ, you get a 403.

One screen was breaking this rule. The key on the route side and the first segment of the API path were different. It was intentional and there was even a comment in the code, but the result was a state where **"to use this screen you need permissions for a different menu."**

The symptom was "a list that worked yesterday 403s today." The cause wasn't a code change — **the logged-in account was different.** Viewed from an account with fewer permissions, the menu shows but the query is blocked.

Neither the type system nor a linter can catch this kind of rule. It shows up at runtime, and only **when you come in on an account with particular permissions.**

> **The developer's share ③** — know **the rules at system boundaries.**
> AI makes things consistent within the files I give it. Agreements outside those files are mine to communicate, and where they blow up when broken is mine to know.

## 3. What I've come to verify in UI work

The front end is the area most prone to the illusion that **"if the screen renders, it must be right."** These are only the things that actually turned out wrong.

### Suspect the list key

I changed a search condition and **a stale row stayed in the table.** One result, two lines showing, both labeled "order 1."

I stared at the server for a long time. The response was exactly one record and the pagination read `1-1 / 1`. **The query was fine.**

The culprit was the React key. Each row in the list was identified by a "step ID," and that value was **not issued per row but was the ID of a step defined in configuration**. Different records using the same configuration get **the same key**.

```text
record A   doc=DP1095…  step=AT5D7F…   ← different records
record B   doc=DPD4FA…  step=AT5D7F…   ← same key
```

React saw them as the same thing and reused the stale row.

**The key must be "the id of that row itself."** Not the parent's id, not the category's id. And you can't learn this by eyeballing the response — it only surfaces when you meet **real data** where the values collide.

### Test "what doesn't change"

An extension of case 1. UI tests usually measure "this is visible." But what goes wrong is usually the other side.

- the neighboring component **does not re-render**
- after the fix, the error text **disappears**
- the warning **doesn't bleed** onto healthy rows

After the `gap-1bg-danger-bg` incident, I added a test measuring the background color itself.

```tsx
it("★ a cell with problem text gets a danger background", () => {
  const cell = renderWithAlert("…");
  expect(cell).toHaveClass("bg-danger-bg");
});
```

The test measuring the text already existed and **was passing.** The text and the background are supposed to move together, and that accident was them breaking apart.

### Check whether a layout property actually "takes"

I set center alignment on a toggle cell in a table and it didn't take. The column config clearly had `align: 'center'`.

The reason was simple. `align: 'center'` ultimately means `text-align: center`, and that only applies to **inline content**. The root of the switch component I was using was `display: flex` — **block level**. A fixed-width block doesn't move for `text-align`.

```tsx
<Switch className="mx-auto" /> // splits the left/right margin evenly, actually centering it
```

I hit something similar once more. A dropdown panel stretched all the way to the right edge of the table. It was `position: fixed`, but the only width constraint was `min-width`, so **with no maximum it grew to fill whatever space was left.**

```text
max-h-60 min-w-40                    ← before
max-h-60 w-max max-w-72 min-w-40     ← after: fit to content width, bounded top and bottom
```

Both share something. **The property is set, and it doesn't take.** You can see the class in devtools, so it's easy to read that as "applied." Applied and **taking effect** are different things.

### Don't guess where it's slow — measure

When a screen felt slow, I had a habit of thinking "must be too much rendering" and going looking for something to optimize. One time I didn't, and instead **pulled response times from the gateway access log.**

```text
readServers   ms=5087
readServers   ms=5111
readServers   ms=5094   ← 6 requests between 5,087 and 5,111ms
```

Clustered inside 24ms. That's **a fixed timeout.** It wasn't a rendering problem — that API was spending the time checking server status, and it used to be 243ms.

No amount of memoization on the front end turns 5 seconds into less than 5 seconds. **Decide on the treatment before looking at the numbers and you'll fix the wrong place.**

### Separate out what isn't your code

This one burned me badly, recently. Unexplained blank space appeared on screen, and devtools showed a `<canvas popover="manual">` in the DOM. Directly under `<html>`, **before** `<head>`.

It wasn't in our code. Not in `index.html`, not in any runtime dependency. And its position was the giveaway — **the HTML parser moves an element arriving in that position into `<body>`.** So it's a position markup cannot produce; only a script inserting it directly can.

It was a browser extension. It was confirmed later when a stack trace showed up in the dev server log.

```text
InvalidStateError: Failed to execute 'showPopover' ... Invalid on disconnected popover elements.
  > drawWeb  chrome-extension://fmkadmap…/react_devtools_backend_compact.js
```

It was **React DevTools' highlight feature**, which I had turned on to check re-rendering. It was throwing an error once a second, and it eventually took the dev server down.

> **The developer's share ④** — peel the reproduction environment back **one layer at a time.**
> Does it reproduce in an incognito window? With extensions off? In a production build? Skip this and you'll chase a bug that isn't in your code for hours.

## To sum up

Looking back at what I fixed in AI-written code, there's something in common.

**All of it was "right but wrong."**

|            | What AI does well                     | What I have to do                                      |
| ---------- | ------------------------------------- | ------------------------------------------------------ |
| Features   | Makes it behave as specified          | Decides **where this state should live**               |
| Convention | Follows the rules I give consistently | Bans **patterns that fail silently** by rule           |
| Style      | Combines classes accurately           | Stops it from **inventing values not in the tokens**   |
| Boundaries | Keeps consistency within given files  | Communicates **agreements outside the system**         |
| Verification | Tests what's visible                | Pins down **invisible properties** with tests          |

The right-hand column has one more thing in common. **None of it gets written into the requirements.**

"Put a session timer in the header" says nothing about what height that state should live at. "Red background on this cell" says nothing about dark mode. "Show me a list" says nothing about keys being able to collide.

I think it's fine for AI to take the productivity. But **knowing what wasn't written down** is ours for a while yet, and that's what I'm currently calling a developer's responsibility.
