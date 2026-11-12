---
slug: next-og-satori
title: "Why next/og Can't Use CSS Grid"
date: 2026-11-09
tags: ["nextjs", "react"]
thumbnail: "/uploads/2026/11/next-og-satori.png"
draft: false
description: "Satori is TypeScript, its layout engine is C++, and its rasterizer is Rust. Grid is missing because of the middle one — and that changed on October 8, though next/og hasn't caught up."
---

# Why next/og Can't Use CSS Grid

---

While working out how to make thumbnails for this blog, I came across Satori by
way of `next/og`. It turns UI written as JSX into a PNG image.

## What next/og actually does

The thing you use to make OG images in Next.js is `ImageResponse` from
`next/og`. Put JSX in, get a PNG out. Inside, it uses two libraries.

```text
React JSX
   ↓
Satori        reads the JSX, computes layout, produces SVG
   ↓
resvg         rasterizes the SVG and bakes it into a PNG
   ↓
PNG response
```

That is not just a description — it is sitting right there in the package. Open
an installed Next.js and you see this.

```text
node_modules/next/dist/compiled/@vercel/og/
├── index.node.js
├── satori/
├── yoga.wasm        ← layout engine
├── resvg.wasm       ← SVG → PNG converter
├── Geist-Regular.ttf
└── ...
```

`next/og` is `@vercel/og`, bundled. What is interesting is that three different
origins are mixed in here.

| | What it does | Language |
| --- | --- | --- |
| Satori | reads JSX, assembles SVG | **TypeScript** |
| Yoga | computes layout | **C++** → `yoga.wasm` |
| resvg | rasterizes SVG into PNG | **Rust** → `resvg.wasm` |

Satori itself is TypeScript. Only the two heavy computations are borrowed from
C++ and Rust and carried in as WASM. That is why it needs neither a browser nor
a per-platform native binary.

### Why it does not stop at SVG

Satori's output is SVG. It seems like you could use that directly, but it gets
baked once more into PNG. Three reasons.

- **Platform compatibility** — social crawlers like KakaoTalk, Facebook, and X
  either do not trust SVG as a preview image or will not accept it at all. PNG
  shows up everywhere.
- **Rendering consistency** — an SVG can come out differently depending on the
  renderer and the fonts on the machine drawing it. A PNG has its pixels
  settled, so it looks the same wherever you open it.
- **Simpler on the receiving end** — nobody has to re-interpret shapes and text.

Put plainly: **SVG is a good intermediate form for assembling an image, and PNG
is a good final artifact for sending it out.** That is why there are two stages.

## How this differs from ordinary React

In a browser, React flows like this.

```text
React JSX
   ↓
build the HTML DOM
   ↓
browser CSS engine        Flexbox · Grid · Position · all of it
   ↓
paint to screen
```

In `next/og` it flows like this.

```text
React JSX
   ↓
Satori
   ├── parse only the HTML elements it knows
   ├── compute layout
   ├── handle only the CSS properties it supports
   └── produce SVG
   ↓
resvg → PNG
```

The heart of the difference is that **there is no browser.** No browser means
no CSS engine inside it either. Satori cannot stand in for the CSS
implementation Chrome and Safari piled up over decades, and it was never trying
to. It handles the properties it knows and quietly drops the rest.

You write JSX and use React components, so it feels like all your usual CSS
will work. In practice it is closer to writing for **a separate renderer that
happens to look like React.**

## Wait — what is the difference between Flexbox and Grid?

To see why "Flexbox only" is a constraint, you have to look at what the two
things actually are. People often say Grid is a superset of Flexbox. It is not.
**They solve different problems.**

### One axis or two

**Flexbox is one-dimensional.** You pick a main axis, lay items out along it,
and divide up the leftover space. `flex-direction` chooses whether that axis is
horizontal or vertical. What it handles at any moment is always **a single
line.**

**Grid is two-dimensional.** You declare row and column tracks first, then seat
items in the cells of that grid. It handles both directions at once.

### Who decides the sizes

This is the more fundamental difference.

| | Flexbox | Grid |
| --- | --- | --- |
| Starting point | **the item's content** | **the container's tracks** |
| Flow | start from content size, distribute leftover space with `flex-grow`/`flex-shrink` | fix the tracks first, then fit items into them |
| In a phrase | content decides the layout | the layout holds the content |

So Flexbox is strong **when you do not know how many items there are or how
long the content is.** Three buttons or seven, long labels or short, they line
themselves up. Grid is strong **when you already know the structure.** "240px
sidebar on the left, body for the rest" is a skeleton that has nothing to do
with the content.

### Wrapping is the decisive part

Flexbox does have `flex-wrap`, so lines do break. But **the resulting lines know
nothing about each other.** Each line is computed independently, so pour in
items of varying widths and you get this.

```text
flex-wrap                        grid
┌────┬────────┬─────┐            ┌─────┬─────┬─────┐
│ 1  │   2    │  3  │            │  1  │  2  │  3  │
└────┴────────┴─────┘            ├─────┼─────┼─────┤
┌──────┬───┬──────┐              │  4  │  5  │  6  │
│  4   │ 5 │  6   │              └─────┴─────┴─────┘
└──────┴───┴──────┘
  ↑ columns drift                  ↑ columns line up
```

A wrapped Flexbox turns into bricklaying. Item 4 on the second line has no
reason to line up vertically with item 1 on the first. Each divided space only
within its own line. **That is the real reason a grid has to be Grid.**

### So when do you use which

| Situation | Pick |
| --- | --- |
| lay things along one line (or column) — nav, toolbar, button group | Flexbox |
| attach an icon to text, sized by content | Flexbox |
| when all you need is centering | Flexbox |
| a list whose item count changes at runtime | Flexbox |
| page skeleton — header, sidebar, body, footer | Grid |
| a card grid where rows *and* columns must line up | Grid |
| table-like placement where rows and columns carry meaning | Grid |
| overlapping elements (two things in the same cell) | Grid |

In practice you do not pick one — **you layer them.** Grid for the outer
skeleton, Flexbox for the icon and text inside each cell. `gap` works in both,
so spacing is not a reason to choose.

Which means "Flexbox only" is not "slightly inconvenient." It means **the tool
for building the outer skeleton is gone entirely.** A grid that would be one
line of Grid has to be built by computing coordinates.

## Where Grid gets blocked

So why does Satori not know Grid? Earlier I said it "handles only the
properties it knows" — and **what sets that range is the layout engine.**

Satori uses **Yoga**. Meta built it, and it is the same engine React Native
uses to lay out native iOS and Android UI without a browser.

Yoga was built to compute Flexbox. Grid is not in it. Bolting Grid on would
mean implementing row/column track sizing, auto-placement, implicit track
creation, and the sizing algorithm — a separate body of work on the scale of
Flexbox itself.

Rather than take the docs at their word, I wanted to see exactly how it breaks.
I built a 3×2 grid with `display: grid` and rendered it.

```text
Invalid value for CSS property "display".
Allowed values: "flex" | "block" | "contents" | "none" | "-webkit-box".
Received: "grid".
```

It politely tells you what it will take. It is not just `flex` — `block`,
`contents`, and `none` are on the list too. But of those, the one that actually
computes layout is effectively `flex` alone. Put two children in a
`display: block` container and you get this.

```text
Expected <div> to have explicit "display: flex", "display: contents",
or "display: none" if it has more than one child node.
```

It demands an explicit `display` once there is more than one child — and
**`block` is not on that allowed list.** You may write it; it will not lay
anything out. The docs saying "flexbox and a subset" was not an exaggeration.

**So Grid not working is not a Next.js limitation.** It is the range of the
layout engine Satori picked, and Next.js is just bundling that Satori.

## Except this changed last month

I found this out while checking the Satori repository as I was writing. Here is
the title of PR #841, merged on October 8, 2026.

> feat!: Replace Yoga with Taffy and support `display: block` and `display: grid`

Yoga is out, **Taffy** is in. Taffy is a layout library written in Rust, and
unlike Yoga it computes Flexbox, Grid, and Block. What came with it:

- **`display: grid` support** — `repeat()`, `minmax()`, `fit-content()`, line
  names, `grid-template-areas`, implicit tracks, `grid-auto-flow`, and
  auto-placement
- **`display: block` support** — stacks children vertically and collapses
  margins
- `yoga.wasm` is out of the bundle and `layout.wasm` is in
- As the `!` in the title says, it is a **breaking change**. Layout tracking the
  CSS spec more closely also means existing output can shift. For instance, the
  default for `flex-shrink` became 1.

The change landed in Satori **0.37.0**.

So why is my project still blocked? I checked the installed versions.

```text
next                16.4.1
└── @vercel/og       1.0.1   (2026-08-08)
    └── satori       0.29.0  (2026-07-23)
```

Satori 0.29.0 predates the Taffy swap (October 8) by two and a half months.
That is why `yoga.wasm` is still in the bundle. Even the latest `@vercel/og`,
1.0.3, was published on September 22, 2026 — still before it.

**So the answer to "does Satori support Grid?" splits by version.** Most of the
posts on the internet saying "Satori is Flexbox only" were written before
October 8; conversely, if you read the Satori docs and say "it says Grid
works," it still does not through `next/og`. There is one way to check: render
it yourself.

## So why not use Takumi?

Rather than waiting for Satori to be fixed or for `@vercel/og` to catch up,
there is the option of using a different renderer entirely. **Takumi** is a Rust
library that does the same job (JSX → image), and it says outright that its
design is inspired by Satori.

Its pipeline is one step shorter.

```text
Satori  :  JSX → layout → SVG → resvg → PNG
Takumi  :  JSX → layout → PNG          (no SVG in between)
```

The layout engine is neither Yoga nor Taffy but its own. The docs say
**its text and inline layout are ported from Chromium's Blink**, and they list
the supported range as Flexbox, Grid, block, float, table, and inline. (Whether
Flexbox and Grid are also Blink-derived, the docs do not say clearly.)

The API is nearly identical to `next/og`. The type definitions say "compatible
with `next/og`'s `ImageResponse`," and in practice changing the import path is
enough.

```diff
- import { ImageResponse } from "next/og";
+ import { ImageResponse } from "takumi-js/response";
```

I ran **the exact same code** I had run through `next/og` through Takumi.

| Test | `next/og` (satori 0.29) | `takumi-js` 2.20 |
| --- | --- | --- |
| `display: grid` | throws | **OK** |
| div with no `display` + 2 children | throws | **OK** |
| `display: block` + 2 children | throws | **OK** |
| WOFF2 font | throws — `Unsupported OpenType signature wOF2` | **OK** |
| Korean text (no font supplied) | OK (falls back to a system font) | **tofu** — you must supply a font |

The last row is the trap. The Node build of `@vercel/og` goes looking for system
fonts; Takumi uses only the fonts you hand it. If you are putting text on a
Korean blog, you have to ship a font. In exchange, **it accepts WOFF2.** I
handed it the Pretendard subset this blog already carries for body text and it
rendered immediately. `next/og` rejects that same file — it takes only ttf, otf,
and woff.

I measured speed too. Twenty 1200×630 cards (24 children each) in a row, with
the first three thrown away as warm-up.

```text
next/og    788ms / 20 cards  →  39.4ms each
next/og    757ms / 20 cards  →  37.9ms each
takumi     164ms / 20 cards  →   8.2ms each
takumi     147ms / 20 cards  →   7.3ms each
```

About **5×**. Which stands to reason — there is no round trip of producing an
SVG string and parsing it back to rasterize. That said, this is one measurement
on my Windows laptop with this particular set of shapes. The Takumi docs do not
claim a multiplier — comparison is something you have to run on your own
artwork.

So should you switch? It is not free.

- Takumi is a **native binding** (there are separate WASM builds for Cloudflare
  Workers and browsers). It pulls per-platform prebuilds, so `node_modules`
  grows by roughly 15MB. `next/og`, by contrast, is already inside Next.js —
  zero additional dependencies.
- It is a young project. `@takumi-rs/core` first published in June 2025 and has
  shipped 397 versions in a year and a half. That means it is moving fast, and
  it also means the surface is still shifting.

For a case like this blog — **pulling a handful of thumbnails at build time with
a script and committing the PNGs** — 5× is not something you feel. 0.8 seconds
versus 0.15 seconds for twenty cards is the same as no difference. Conversely,
if you generate images per request, or you genuinely need Grid, or WOFF2 is all
you have, the reason to switch is clear.

## So why not use a browser?

Satori and Takumi are both imitations of a browser's CSS engine. So why imitate
— why not use the real thing? With Puppeteer or Playwright you can render HTML
and CSS fully in Chromium and take a screenshot. The CSS constraints vanish
entirely. And yet these libraries exist for a reason.

| | Satori · Takumi | Puppeteer / Playwright |
| --- | --- | --- |
| Browser process | not needed | required |
| CSS support | partial (Takumi's is wider) | full browser level |
| JavaScript execution | no | yes |
| React rendering | limited JSX | a real web page |
| Run cost | low | high |
| Memory | small | as much as a browser process |
| Reusing existing pages | difficult | an advantage |
| Server environment | WASM or a native binding | browser install and upkeep |

On capability alone the browser wins outright. What separates them is **when the
image gets made.**

A dynamic OG image has to be produced on the server at the exact moment a social
crawler requests the URL. Suppose requests for 100 different posts' OG images
arrive at once: Satori or Takumi call a render function 100 times, while
Puppeteer has to carry 100 browser instances and pages. You can optimize with
browser reuse, page pooling, and image caching, but each of those is one more
thing to operate. And in an environment like an Edge runtime, where you cannot
start a browser at all, there is no choice to make.

This blog is a bit different, though, because it is a static export. Thumbnails
are not made per request; a script pulls them once at build time and the PNGs
are committed. There are no concurrent requests to speak of. In that case the
cost argument for avoiding Puppeteer does not really hold. I still use Satori
because pulling Chromium into the dependency tree to make a few thumbnails feels
heavier. **Starting an entire browser for one simple image is more than the job
needs.**

## Summary

- `next/og`'s `ImageResponse` is two stages: **Satori (JSX → SVG) + resvg
  (SVG → PNG)**. Satori itself is TypeScript; only layout (Yoga, C++) and
  rasterization (resvg, Rust) ride along as WASM.
- Baking all the way to PNG is for social compatibility, rendering consistency,
  and simplicity on the receiving end.
- No browser means no browser CSS engine. The CSS you can use ends where
  Satori's knowledge ends.
- **Flexbox is one-dimensional, Grid is two-dimensional**, and Grid is not a
  superset. Flexbox takes its sizes from content, Grid from tracks. `flex-wrap`
  breaks lines but does not align them into columns, so if both directions have
  to line up, it has to be Grid.
- Grid not working is not Next.js. It is the range of **Yoga**, the layout
  engine Satori used.
- On October 8, 2026, Satori 0.37.0 swapped Yoga for **Taffy** and brought in
  Grid and Block. But the Satori bundled in Next.js 16.4.1 is 0.29.0, so it is
  still blocked.
- If you would rather not wait, there is **Takumi**. It rasterizes directly
  without SVG, and Grid and WOFF2 both work. It was 5× faster at producing the
  same card. In exchange you take on a native binding and have to ship fonts
  yourself.
- The conclusion does not collapse into one answer. For a static blog pulling a
  handful of images at build time, `next/og` is enough; if you generate per
  request or need Grid or WOFF2, Takumi is the better fit.
- Either way, **the fastest way to know whether something works in the version
  you are on is to render it once.** Every table in this article was made that
  way.

## References

- [ImageResponse — Next.js docs](https://nextjs.org/docs/app/api-reference/functions/image-response) — the sentence saying `display: grid` will not work is here
- [Metadata and OG images — Next.js](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [CSS Flexible Box Layout (CSS Flexbox) — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout) · [CSS Grid Layout — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [Relationship of grid layout to other layout methods — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Relationship_of_grid_layout_with_other_layout_methods) — when to reach for which
- [Satori repository](https://github.com/vercel/satori) — its [CSS support list](https://github.com/vercel/satori#css) always reflects the latest version, so compare it against the one you are on
- [PR #841 — Replace Yoga with Taffy and support `display: block` and `display: grid`](https://github.com/vercel/satori/pull/841) — merged 2026-10-08, Satori 0.37.0
- [Yoga](https://www.yogalayout.dev/) — Meta's layout engine, used by React Native
- [Taffy](https://github.com/DioxusLabs/taffy) — the Rust layout library Satori moved to
- [resvg-js](https://github.com/yisibl/resvg-js) — the repository behind `@resvg/resvg-wasm`
- [Vercel OG Playground](https://og-playground.vercel.app/) — render straight from the browser
- [Takumi docs](https://takumi.kane.tw/docs/) — its [comparison with Satori](https://takumi.kane.tw/docs/comparison-to-satori) puts `next/og`, satori 0.63, and Takumi side by side
- Version checks: [satori](https://www.npmjs.com/package/satori) · [@vercel/og](https://www.npmjs.com/package/@vercel/og) · [takumi-js](https://www.npmjs.com/package/takumi-js)
- The error messages, timings, and tables above were produced by rendering with
  this repository's `next@16.4.1` and `takumi-js@2.20.0`
