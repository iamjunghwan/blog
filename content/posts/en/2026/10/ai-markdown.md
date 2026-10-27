---
slug: ai-markdown
title: "Why Does AI Work in Markdown?"
date: 2026-10-27
tags: ["ai", "md"]
thumbnail: "/uploads/2026/10/ai-markdown.png"
draft: false
description: "Markdown costs 1/1.7 the tokens of HTML and 1/2.4 of JSON. But the real reason is what happens when one character is wrong: JSON loses everything, Markdown loses nothing."
---

# Why Does AI Work in Markdown?

---

There are 101 `.md` files in this blog's repository. The 38 posts make sense. The rest is odd.

```text
docs/superpowers/specs/2026-10-15-blog-i18n-design.md
docs/superpowers/plans/2026-10-15-i18n-routes-and-ui.md
docs/worklog/2026-10-26-search-appearance.md
AGENTS.md
```

Design documents, implementation plans, work logs. All of it came out of working alongside an AI. And `AGENTS.md` isn't even mine — running `next dev` creates it. Delete it and it comes back.

Why Markdown, of all things? JSON is more structured, HTML is more expressive, plain txt is simpler.

I measured it.

## Let's count tokens

The same content — one subheading, one paragraph, three list items, one table row — written four ways, then tokenized.

| Format | Bytes | Tokens | vs Markdown |
| --- | ---: | ---: | ---: |
| markdown | 354 | **100** | baseline |
| HTML | 501 | 173 | 1.73× |
| JSON | 900 | 242 | 2.42× |
| plain text | 305 | 80 | 0.80× |

HTML costs 1.7×, JSON 2.4×.

For an LLM, tokens are money and time, and above all **how much it can see at once**. With a 200k context window, where Markdown fits 2,000 documents, JSON fits only 826.

### Where the difference comes from

I measured the cost of marking structure on its own.

| Construct | Markdown | HTML |
| --- | ---: | ---: |
| Heading | `## Title` → **2** | `<h2>Title</h2>` → **9** |
| List item | `- item` → **3** | `<li>item</li>` → **7** |
| Emphasis | `**bold**` → **5** | `<strong>bold</strong>` → **8** |
| Link | `[text](url)` → **9** | `<a href="url">text</a>` → **13** |

The heading is 4.5×. HTML opens with `<h2>` and closes with `</h2>`, and the closing tag **carries no new information at all.** In Markdown the line break does the closing.

JSON is worse. Braces, quotes, colons, commas, indentation — all of it is tokens.

## I measured real posts too

A synthetic example is something I could rig in my own favour, so I ran 19 posts from this blog through the same renderer (`renderPostBody`) and compared source against output.

| Post | md tokens | HTML tokens | Ratio |
| --- | ---: | ---: | ---: |
| ai-developer-responsibility | 4,704 | 10,097 | 2.15× |
| swe-bench | 3,451 | 5,131 | 1.49× |
| npm-tgz | 3,755 | 6,437 | 1.71× |
| Oxc | 1,849 | 5,074 | 2.74× |
| NDJSON-JSON | 813 | 2,893 | 3.56× |
| **19 posts total** | **27,560** | **69,560** | **2.52×** |

A **42,000 token difference**. The more tables and code blocks a post has, the higher the ratio — `NDJSON-JSON` hits 3.56× because it has many short list items, and each one gets a `<li></li>`.

Ask an AI to "read and classify every post on this blog," and it's 27,000 tokens in Markdown versus 70,000 in HTML.

## But plain text is cheaper

Look at the table again and something nags. **Plain text is 20% cheaper than Markdown.** So why not use plain text?

Because plain text carries no information saying "this is a heading."

```text
Caching behavior
Code caching stores the result of parsing and compiling to cut startup time.
Cold run: first visit
```

Is the first line a heading, or just a short sentence? Is the third line a list item or a paragraph? A person reads it by intuition; a machine has to **guess**, and guesses are wrong sometimes.

Markdown pays that 20% to **remove the ambiguity.** A `##` means heading, a `-` means list item. Twenty percent is cheap for structure.

> Markdown's place is "the cheapest thing that has structure."
> Drop the structure and you save 20%; express it more formally and you pay 73% to 142% more.

## What happens when it breaks is the real reason

This is the most important part, and it gets discussed the least.

An LLM emits tokens **one at a time, in order.** It cannot go back and fix one. So it can get a character wrong midway. What happens then differs by format.

I wrote the same content in Markdown and JSON, then **deleted exactly one character from each.**

```text
markdown : removed one of the closing **
JSON     : removed the closing }
```

The result:

| Format | Characters that reached the reader |
| --- | --- |
| Markdown | **60 / 57 (105%)** |
| JSON | **0 / 57 (0%)** |

JSON loses everything.

```text
SyntaxError: Expected ',' or '}' after property value
             in JSON at position 118
```

The parser throws and that's it. The mistake is at character 118, and yet **character 1 is unreadable.** 99% of the content can be intact and 0% arrives.

Markdown keeps every character. It just doesn't apply the emphasis. The 105% is because the orphaned `*` **shows up as a literal character.** That's the whole damage.

There's a name for this difference: **graceful degradation.**

- JSON and XML are **all or nothing.** Break the syntax and parsing itself fails
- Markdown **loses only what broke.** A marker it couldn't parse simply becomes text

If the thing producing the output isn't perfect, the second behaviour wins by a mile.

This blog has leaned on that property once already. Emphasis like `**1.96%**였다` wasn't rendering in Korean body text — a closing `**` preceded by punctuation and followed by a particle isn't emphasis under CommonMark — and yet **every character still showed.** The only thing broken was the bold.

## People and machines read the same file

So far this has all been "it's cheap for machines." If that were the whole story, a cheaper format would have won.

There is one more reason. **People read it too.**

John Gruber created Markdown in 2004, and the design goal was markup that doesn't look like markup. The unrendered source should read as-is. That was the whole idea.

Twenty years later that property turned out to be useful somewhere else entirely.

| | People | Machines |
| --- | --- | --- |
| Reading | as-is in an editor | few tokens |
| Writing | no syntax to memorize | breaks less when wrong |
| Editing | change one line | change one line |
| Review | shows up in `git diff` | — |

That last row matters. A JSON or binary document produces a mess of a diff for a one-character change; Markdown **only changes the line you changed.** When an AI edits a document, a person can see what moved in five seconds.

### AGENTS.md

This became a standard. `AGENTS.md` is a specification created in August 2025, led by OpenAI with Google, Cursor, and Factory, and donated to the Linux Foundation's Agentic AI Foundation in December 2025. Reportedly over 60,000 open-source projects use it.

The content is just Markdown. No schema, no version field, no frontmatter.

```markdown
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file
structure may all differ from your training data.
```

That is actually in this repository's `AGENTS.md`. Next wrote it, the intended reader is an AI, and **it reads perfectly well to me too.** Defining a schema would have made that impossible.

## What I'm not sure about

People often say it's "because there's a lot of Markdown in the training data." That sounds right and probably is, but **I have no way to verify it.** No model publishes the composition of its training data.

So I left it out. The four points above — tokens, structure, failure mode, human-readable — were all either measured directly or confirmed in documentation.

## Summary

- **Tokens are cheap.** The same content costs 1/1.7 of HTML and 1/2.4 of JSON. Across 19 posts on this blog, a 42,000 token difference
- **Still 20% more than plain text.** That 20% buys "which part is the heading." Markdown is *the cheapest thing that has structure*
- **It survives breaking.** With one wrong character, JSON delivers 0% and Markdown delivers 100%. For a machine emitting one token at a time, this is decisive
- **People and machines read the same file.** It shows in `git diff`, it can be reviewed, and you can change a single line

Markdown wasn't designed for the age of AI. Something built in 2004 to "not look like markup" simply turned out, twenty years later, to be **nearly the only format people and machines can share.**

AI working in .md files isn't a trend. It's what happens when the conditions line up.

## References

- [Markdown — Daring Fireball (John Gruber, 2004)](https://daringfireball.net/projects/markdown/)
- [CommonMark Spec](https://spec.commonmark.org/)
- [AGENTS.md](https://agents.md/)
- [AGENTS.md donated to the Linux Foundation — InfoQ](https://www.infoq.com/news/2025/08/agents-md/)
- Tokenizer used for the measurements: [gpt-tokenizer](https://www.npmjs.com/package/gpt-tokenizer)
- The 19-post measurement used this repository's own `app/lib/posts/render.ts`
