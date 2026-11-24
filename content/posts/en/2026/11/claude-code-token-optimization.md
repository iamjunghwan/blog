---
slug: claude-code-token-optimization
title: "How to Spend Fewer Tokens in Claude Code"
date: 2026-11-24
tags: ["ai"]
thumbnail: "/uploads/2026/11/claude-code-token-optimization.png"
description: "Every Claude Code request resends the whole context. Ten ways to cut what gets sent, each checked against the official docs and shown on a real blog repo with 3 skills, 3 subagents and 3 hooks."
draft: false
---

# How to Spend Fewer Tokens in Claude Code

---

This blog started with a single `CLAUDE.md`. Today it has 3 skills, 3 subagents and 3 hooks attached.

Each one made the work easier. Each one also raised a question: how much of this rides along with every request? The usage screen on my Team plan shows a current session (5-hour) limit and a weekly limit separately. Both run out eventually.

I haven't measured before-and-after numbers yet. Instead, I checked what I'd learned against the official docs, one claim at a time. This post **explains, for each token-saving technique, why it saves tokens according to the official docs, and shows how this blog's repo actually applies it.**

Everything here is based on the Claude Code docs as of 2026-11-23. Versions, models and prices keep changing.

## 1. It's the Same Problem as Frontend Optimization

According to the official docs, Claude Code resends the full context on every request: the system prompt and tool definitions, project context such as `CLAUDE.md`, and the conversation so far. Without caching, the API would reprocess the entire history every turn.

```text
Request 1: [system prompt + tools] [CLAUDE.md, memory, rules] [turn 1]
Request 2: [system prompt + tools] [CLAUDE.md, memory, rules] [turns 1, 2]
Request 3: [system prompt + tools] [CLAUDE.md, memory, rules] [turns 1, 2, 3]
```

This reminded me of bundle optimization on the frontend. Ship less on the first load, load things when you need them, and reuse what you've already fetched. I'd group token savings into the same five ideas.

| Concept      | Frontend analogy             | Claude Code feature     | This repo                       |
| ------------ | ---------------------------- | ----------------------- | ------------------------------- |
| Reduction    | Smaller bundles              | Short `CLAUDE.md`       | Root `CLAUDE.md` at 3,735 bytes |
| Isolation    | Separation of concerns       | Subagents               | researcher, writer, reviewer    |
| Lazy loading | Code splitting, lazy imports | Skills, MCP tool search | Procedures moved into skills    |
| Compression  | Compressed transfer          | `/compact`, auto-compact | —                              |
| Reuse        | HTTP cache                   | Prompt caching          | Automatic                       |

The analogy is my own interpretation. The official docs don't categorize things this way. Still, keeping this table in mind makes it easier to see where each technique below fits.

## 2. Where to Start

The official costs doc has a section for administrators. Among the things to check when API or cloud spend is higher than expected, it names two habits with the biggest impact: running `/clear` between unrelated tasks, and picking the right model for the job (in its words: "clearing between unrelated tasks and matching the model to the job"). It isn't a list aimed at individual users, but I think the same principle applies on a subscription.

Beyond that, there's no official ranking. The impact and difficulty in the table below are **my own judgment.**

| Technique                          | Expected impact   | Difficulty       | Section |
| ---------------------------------- | ----------------- | ---------------- | ------- |
| Split sessions by task             | Very high         | Low              | 3       |
| Match model and effort to the task | High              | Low              | 6       |
| Trim `CLAUDE.md`                   | High              | Low              | 4       |
| Scope requests narrowly            | High              | Low              | 10      |
| Split instructions into skills/rules | High            | Medium           | 4       |
| Manage MCP context                 | High              | Low              | 4       |
| Delegate exploration to subagents  | High              | Medium           | 5       |
| Compact at natural breaks          | Medium            | Low              | 8       |
| Move checks into hooks             | Medium            | Medium           | 7       |
| Don't break the cache              | Big cost savings  | Mostly automatic | 9       |

## 3. Split Sessions by Task

The costs doc says to use `/clear` when you move on to an unrelated task. The reason fits in one sentence.

> "Stale context wastes tokens on every subsequent message."

Given the diagram in section 1, this is obvious. If the previous task's conversation is still there, it rides along with every later request. According to the same doc, in a long session even a one-line question costs as much as the whole accumulated conversation. It's billed at the cache rate, but you pay it every time. `/clear` itself costs nothing.

If you'll come back to the work, name the session with `/rename` before clearing and reopen it later with `/resume`. The official docs recommend this alongside `/clear`.

In this repo, a `SessionStart` hook helps with fresh sessions. When I launch Claude Code, it lists draft posts and posts without an English version. I know what to do next without dragging in the previous conversation. One caveat: its matcher is `startup`, so it doesn't run after `/clear`. Per the hooks doc, a SessionStart fired after `/clear` has the source `clear`.

## 4. Shrink What Loads at Startup

### CLAUDE.md loads every session

According to the memory doc, `CLAUDE.md` loads at the start of every session. The official recommendation is under 200 lines per file.

> "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence."

`@path` imports don't make it smaller. The doc says imports help organize a long file, but the imported files load too, so the context cost stays the same.

This repo's root `CLAUDE.md` is 69 lines and 3,735 bytes, well within the guideline. It imports `@AGENTS.md` (688 bytes). Both load every session. So `CLAUDE.md` holds only a short architecture summary, where posts live, style rules and how I work. Here's the reasoning I left in my work log:

> "CLAUDE.md is read every session, so I kept it short and moved task-specific procedures into skills that load only when needed."

### Skills load only their descriptions up front

According to the skills doc, a session only gets each skill's name and description. The body loads when the skill is invoked.

> "a skill's body loads only when it's used, so long reference material costs almost nothing until you need it."

It isn't free. The skill list sits in context every turn whether you use the skills or not. The description (`description` plus `when_to_use`) is truncated at 1,536 characters combined. Writing short, precise descriptions is a saving too.

Set `disable-model-invocation: true` and even the description stays out of context. The body loads only when the user invokes it directly. Supporting files are read when `SKILL.md` points to them, at the moment they're needed.

Here are this repo's skills.

| Skill          | Size                                         | Loading                  |
| -------------- | -------------------------------------------- | ------------------------ |
| write-post     | 4.3KB (+ style.md 1.5KB, thumbnail.md 2.6KB) | Automatic when relevant  |
| translate-post | 2.1KB                                        | Automatic                |
| publish-post   | 2.1KB                                        | Only via `/publish-post` |

publish-post publishes a post. The model shouldn't do that on its own, so I set `disable-model-invocation: true`. As a bonus, it costs nothing in the skill list. write-post's style and thumbnail docs are read only when the work reaches those steps.

### Rules only save tokens with paths:

`.claude/rules/` is an official feature. But moving instructions into rules doesn't automatically shrink anything. According to the memory doc, rules without `paths:` frontmatter load at session start just like `CLAUDE.md`. With `paths:`, they load only when Claude works with matching files.

> "Rules can also be scoped to specific file paths, so they only load into context when Claude works with matching files, reducing noise and saving context space."

This repo doesn't use rules yet. When a rule only matters for a specific folder, I think the right move is to pull it into a path-scoped rule.

### MCP tools are lazy-loaded by default

According to the MCP doc, tool search is on by default. At session start, only tool names and server instructions go in; tool definitions are fetched when needed. The exception: some older models and some cloud deployments load all tools up front.

The costs doc notes that CLIs like `gh` and `aws` are often more efficient than MCP, and recommends disabling unused servers in `/mcp`. This repo has no project MCP config (`.mcp.json`).

### Auto memory loads at startup too

In sessions with auto memory on, the first 200 lines or 25KB of `MEMORY.md` (whichever comes first) load at session start. Anything beyond that doesn't. That's why memory should stay short. The memory doc also says Claude is told to "merge or drop stale entries" when `MEMORY.md` approaches the limit.

## 5. Delegate Exploration and Verification to Subagents

According to the sub-agents doc, a subagent runs in its own context window. Only a summary comes back to the main conversation.

> "the verbose output stays in the subagent's context while only the relevant summary returns to your main conversation."

**Subagents save main-context space, but they don't reduce total tokens.** The same doc says subagents send their own requests, and those count against the same usage limits as the main conversation. They start with a fresh context, so they can't see files or conversation the main session already has. According to the prompt-caching doc, a subagent's first request can't read the parent's cache either. Total usage can go up. The official docs don't offer a quantitative comparison.

This repo uses three subagents for writing.

| Agent              | Model  | Job                                      |
| ------------------ | ------ | ---------------------------------------- |
| researcher         | sonnet | Research external sources → `research.md` |
| article-writer     | opus   | New drafts, structural rewrites          |
| technical-reviewer | opus   | Verify technical claims                  |

Because total usage can grow, I set conditions for calling them. None of the three is used for typos or line edits. A draft that already cites its sources gets only the reviewer.

Material is passed as file paths, not pasted into prompts. Research results go to `.local/posts/<slug>/research.md`, and the next agent reads that file. I confirmed in the docs that a summary returns to the main conversation. I couldn't confirm that writing results to files and passing only paths is an official recommendation. That part is just how I run things.

## 6. Match the Model and Effort to the Task

### Sonnet by default, Opus when it's hard

The costs doc is clear.

> "Sonnet handles most coding tasks well and costs less than Opus. Reserve Opus for complex architectural decisions or multi-step reasoning."

For simple subagent tasks, it suggests `model: haiku`. Also, if you switch the session to Opus, subagents that inherit the model run on Opus too. That's why I pin `model:` in each subagent.

API prices (2026-11-23, USD per million tokens). In Claude Code, the `opus`, `sonnet` and `haiku` aliases resolve to the 5.5 versions on the Anthropic API.

| Model                          | Input | Output | Cache read | 5-min cache write | 1-hour cache write |
| ------------------------------ | ----- | ------ | ---------- | ----------------- | ------------------ |
| Fable 5.2                      | 8     | 40     | 0.20       | 10                | 16                 |
| Opus 5.5                       | 4     | 20     | 0.20       | 5                 | 8                  |
| Sonnet 5.5                     | 2     | 10     | 0.10       | 2.50              | 4                  |
| Haiku 5.5 (prompts up to 100k) | 0.10  | 0.50   | 0.01       | 0.125             | 0.20               |
| Haiku 5.5 (>100k)              | 0.50  | 2.50   | 0.05       | 0.625             | 1                  |

At API prices, Sonnet 5.5 is half the cost of Opus 5.5. Subscriptions are different. I couldn't find any official statement that price ratios map directly to how fast subscription limits drain. The support article only says "Opus costs several times more per turn than Sonnet, and Sonnet more than Haiku."

Read limit messages carefully, too. According to the costs doc, session and weekly limits apply across all models, so switching with `/model` won't lift them. If you see a model-specific message like "Opus limit," you can keep going on a different model family. I couldn't find an official doc explaining the "All models / Fable" split on my usage screen.

In this repo, research (researcher) goes to Sonnet. It's searching the web and collecting sources. Drafting and technical review stay on Opus.

The official docs describe Haiku's use only as "simple tasks": model-config says "simple tasks," and costs says simple subagent tasks. There's no finer breakdown by task type.

### Lower effort per task

`/effort` sets how much the model thinks. The model-config doc puts it this way:

> "Each level trades token spend against capability."

Another paragraph in the same doc says lower effort is faster and cheaper for simple tasks.

The 5.5 family and Fable use `low`, `medium`, `high`, `xhigh` and `max`. Defaults vary by model: Fable 5.2 and the 5.5 family default to `medium`, while most other models default to `high`. The doc says `max` "has diminishing returns and is prone to overthinking." Thinking tokens are billed as output tokens. However, thinking can't be turned off on Opus 5.5, Sonnet 5.5, Haiku 5.5 or Fable.

### Choose at the start of the session

Switching models breaks the cache. Each model has its own cache, so the request after a `/model` switch reads the whole conversation uncached. Changing effort also breaks the cache on most models. The exception, per the prompt-caching doc: Fable 5.1 and later and the 5.5 family keep the cache with API keys and subscriptions.

> "Pick your model and effort level at the top of a session, then save `/compact` for natural breaks between tasks."

## 7. Hooks: Let Code Do the Checking, and Speak Only on Failure

Not all hook output enters the context. Here are the rules I confirmed in the hooks doc.

| Path                                               | Does Claude see it?                  |
| -------------------------------------------------- | ------------------------------------ |
| `SessionStart` / `UserPromptSubmit` stdout (exit 0) | Yes. Added to context               |
| stderr on exit 0                                   | No                                   |
| `PostToolUse` stderr on exit 2                     | Yes (the tool has already run)       |
| `PreToolUse` stderr on exit 2                      | Yes. The call is blocked             |
| `additionalContext`                                | Yes. Injected as a system-reminder   |

Each output is capped at 10,000 characters. Anything longer is saved to a file, and only the path and the first 2,000 characters go in.

That gives a design principle: **stay silent on success, say something short on failure.** It isn't an official phrase, but it follows from the rules above. All three hooks in this repo are built this way.

| Event                    | Script             | What it does                                                      | When it enters context            |
| ------------------------ | ------------------ | ----------------------------------------------------------------- | --------------------------------- |
| PreToolUse(Bash)         | guard-bash.mjs     | Blocks `pnpm thumbnail` without a slug and `pnpm fonts` off main  | Only when blocking (exit 2 stderr) |
| PostToolUse(Edit\|Write) | check-post.ts      | Checks only the edited post: frontmatter, broken `**`, ko/en pair | Only on problems (exit 2 stderr)  |
| SessionStart(startup)    | session-status.mjs | Lists drafts and posts missing an English version                 | Only when there's work (stdout)   |

`SessionStart` output goes in at the top of the conversation and rides along with every later request in that session. No output, no cost. `PostToolUse` output isn't fixed per session; it accumulates each time it fires.

On 2026-11-23 I added a check for broken bold markup. One option was to hand it to a Sonnet agent, but I put it in a hook and `pnpm test` instead. It's a syntax problem, so code catches all of it, and no model call is involved. When nothing is wrong, not a single character enters the context.

The costs doc gives a similar example: filter a 10,000-line log down to the ERROR lines before handing it over, and tens of thousands of tokens shrink to hundreds. That's an illustrative example, not a measurement.

## 8. Compact at Natural Breaks, With Instructions

When the context nears its limit, auto-compact kicks in. Compaction replaces the conversation with a summary, so losing detail is built into how it works. Content injected earlier by hooks gets summarized too.

Running `/compact` yourself lets you choose what to keep.

```text
/compact Focus on code samples and API usage
```

The docs explain: "The summary keeps what you choose instead of what the automatic pass guesses is important." You can also add a `# Compact instructions` section to `CLAUDE.md`.

The docs don't say auto-compact is bad. They present it as the default behavior. The recommendation is twofold: `/compact` at natural breaks between tasks, `/clear` for unrelated work.

Compaction is a request, too. According to the costs doc, compacting a large context is itself a large request. According to the prompt-caching doc, it's cheap while the cache is warm, but reopening an old session past its cache TTL and compacting it is the most expensive case.

What survives compaction is also defined (context-window doc).

| Item                            | After compaction                                         |
| ------------------------------- | -------------------------------------------------------- |
| Root `CLAUDE.md`, auto memory   | Re-injected from disk                                    |
| Recently read files             | Up to 5 re-read (files over 5,000 tokens: path only)     |
| Invoked skill bodies            | Re-injected up to 5,000 tokens per skill, 25,000 total   |
| Hook-injected content           | Summarized                                               |

## 9. Habits That Don't Break the Cache

According to the prompt-caching doc, Claude Code handles caching on its own. The API reads from cache when the start of a request (the prefix) matches exactly. If something in the middle changes, everything after it is recomputed. Cache reads cost a fraction of the input price (0.05x for Opus 5.5 and Sonnet 5.5).

So there's only one thing to do yourself: avoid cache-breaking actions mid-session.

| Breaks the cache                                     | Keeps the cache                     |
| ---------------------------------------------------- | ----------------------------------- |
| Switching models with `/model`                       | Editing repo files                  |
| Changing effort (most models)                        | Editing `CLAUDE.md` mid-session     |
| Turning on fast mode                                 | Changing permission mode, plan mode |
| Connecting/removing MCP servers (when lazy loading is off) | Changing output style         |
| Compaction                                           | Invoking skills or commands         |
| Accumulating images                                  | `/rewind`, spawning subagents       |
| Upgrading Claude Code                                |                                     |

Editing `CLAUDE.md` mid-session doesn't break the cache. According to the docs, it's read once at session start and held in memory.

> "When you edit your project-root or user-level CLAUDE.md mid-session, the cached prefix stays intact."

The flip side: your edits don't take effect until `/clear`, `/compact` or a restart. If an edit seems ignored, this is why.

There's also a cache lifetime (TTL). Within a Claude subscription's included usage, the main conversation gets 1 hour. API keys, usage credits and cloud providers, plus other requests like subagents and compaction, default to 5 minutes. If your break is longer than the TTL, the next message reprocesses the full context.

Be careful with images, too. The vision doc's formula is `⌈width / 28⌉ × ⌈height / 28⌉`: one token per 28×28 pixels.

| Image     | Standard (long edge up to 1,568px) | High-res (Claude 4.7 and later) |
| --------- | ---------------------------------- | ------------------------------- |
| 1000×1000 | 1,296                              | 1,296                           |
| 1920×1080 | 1,560                              | 2,691                           |
| 3840×2160 | 1,560                              | 4,784                           |

A large screenshot can cost thousands of tokens on recent models. Small images cost hundreds. This is from the API docs; I couldn't confirm whether Claude Code computes it the same way. When many images pile up, the oldest ones get dropped, which breaks the cache.

## 10. Scope Requests Narrowly and Agree on Direction First

The costs doc recommends specific prompts. Vague requests trigger broad exploration, and exploration burns tokens on file reads.

Start complex work in plan mode (Shift+Tab).

> "Claude explores the codebase and proposes an approach for your approval, preventing expensive re-work when the initial direction is wrong."

If the direction looks wrong, stop early with Esc and roll back with `/rewind`. Switching to plan mode doesn't break the cache. The `opusplan` setting does, though, because it switches models.

## 11. How to Measure Before and After

I don't have a before-and-after comparison yet. I've only measured the starting state and recent usage (below). When I measure, I'll use the official tools.

| What                                       | How                                                  |
| ------------------------------------------ | ---------------------------------------------------- |
| Current context usage, share by category   | `/context`                                           |
| Loaded `CLAUDE.md` and memory files        | `/context`, `/memory`                                |
| Cumulative session tokens, estimated cost  | Session block in `/usage` (resets to 0 on `/clear`)  |
| Cache hits                                 | `Prompt cache (main)` line in `/usage`               |
| Share by skill, subagent and MCP           | `/usage` (subscription plans)                        |
| Ongoing monitoring                         | Status line                                          |

Some `/usage` items depend on the version. The `Prompt cache (main)` line needs v2.1.251 or later, and applying suggestions with the `f` key needs v2.1.305 or later. I'm on v2.1.318, so both apply. Time spent and rework count aren't official metrics. If you want them, track them yourself.

Compare using the same task.

```text
1. Open a new session → run /context before doing anything
2. Do the same kind of task (e.g., draft one post)
3. When done, record session tokens and the cache line from /usage
4. Change the setup and repeat steps 1–3
```

### What a New Session Starts With

I opened a new session in the blog repo and ran `/context` without typing anything. The model was Opus 5.5 (1M-token context).

| Category                | Tokens | What it contains                       |
| ----------------------- | ------ | -------------------------------------- |
| System prompt           | 3.9k   | Claude Code's base prompt              |
| System tools            | 24.2k  | Built-in tool definitions              |
| MCP tools               | 605    | Connected MCP tools (lazy-loaded)      |
| MCP server instructions | 1.7k   | MCP server instructions                |
| Custom agents           | 387    | Descriptions of researcher and others  |
| Memory files            | 2.2k   | `CLAUDE.md`, `AGENTS.md`, `MEMORY.md`  |
| Skills                  | 5.7k   | Skill names and descriptions           |
| Messages                | 1.4k   | Messages present before any input      |
| **Total (as displayed)** | 39.9k | 4% of 1M tokens                        |
| Autocompact buffer      | 33.0k  | Space reserved for auto-compaction     |

Adding up the rows yourself gives 40.1k. The difference is rounding.

Before I've done anything, 39.9k tokens are loaded. That's the floor for every request that follows.

- The largest item is built-in tools (24.2k). That's not something my setup touches.
- The areas covered in section 4 (Memory files, Skills, Custom agents and the two MCP lines) add up to about 10.6k.
- Skills, at 5.7k, is bigger than I expected. This repo defines three skills, and publish-post is left out of the list. The rest are descriptions from installed plugins and built-in skills. If I want to trim, plugins are the place to look, not my own skills.
- Messages (1.4k) exist before any input, so they look like content injected by `SessionStart` hooks: this repo's draft reminder plus plugin instructions.
- The autocompact buffer isn't loaded content; it's reserved space. 39.9k + 33.0k + the remaining 927.1k makes 1M.

### Usage Over the Last 24 Hours

`/usage` has a panel showing what's consuming your limits, along with suggestions. It covers only sessions on this machine, over the last 24 hours, and the items overlap.

| Suggestion                                                            | Share | Section |
| --------------------------------------------------------------------- | ----- | ------- |
| Check which models your subagents use                                 | 86%   | 5, 6    |
| Review sessions that ran for hours (requests in 8 or more separate hours) | 86% | 3     |
| Start fresh when switching tasks (`/clear`)                           | 56%   | 3       |
| See what's filling your context (`/context`)                          | 24%   | 11      |
| Compact before stepping away (`/compact`)                             | 10%   | 8       |

Each share is the usage that matches that line's condition. The first two lines count whole sessions. The first one says so directly: "share covers whole sessions, not only subagents."

The second row stands out. 86% of my usage came from sessions with requests in 8 or more separate hours. The session where I wrote this post was one of them. I went from fixing another post to drafting this one in a single session. I wasn't following my own advice from section 3.

By skill, translate-post accounted for 7%, write-post 5% and code-review 1%.

Below the suggestions is a "Fix 1 of 5" button (in the VS Code extension; the terminal shows an `f to fix 1 of 5` hint instead). It means Claude Code can handle one of the five suggestions for you. According to the costs doc, what it does depends on the line.

| Line ends with            | Pressing `f`                                                     |
| ------------------------- | ---------------------------------------------------------------- |
| An `/effort` command      | Claude Code runs that command                                    |
| Something like `run /clear` | Does nothing. You run it yourself                              |
| Anything else             | Some lines are handed to Claude as steps; others aren't          |

What goes to Claude is a single prompt. According to the doc, that prompt asks Claude to show the changes before making them. On my screen, the three lines ending in `run` weren't eligible, and one of the remaining two was. The doc also notes that a share is "the usage that line applies to," not how much you'd save by fixing it.

## Summary

There are many techniques, but I think only a few questions really matter.

- Does this **load on every request, or only when needed?** If every time, is it really needed every time?
- Does this task need the earlier conversation? If not, `/clear` is the cheapest optimization there is.
- Does this need the model's judgment? If a rule can decide it, hooks and tests are cheaper.
- Is clearing the main context with a subagent worth more than the extra total tokens it costs?
- Will the change I'm about to make break the cache? If so, can it wait until the start of a session or a break between tasks?

I built this blog's setup around these questions. I've measured the starting state and usage, but I haven't compared before and after a setup change yet. Since 86% of my usage came from long sessions, splitting sessions by task is where I'll start.

## References

- [Manage costs effectively](https://code.claude.com/docs/en/costs) — Official cost management and token-saving recommendations
- [How Claude remembers your project](https://code.claude.com/docs/en/memory) — When `CLAUDE.md` loads, the 200-line guideline, imports, rules, auto memory
- [Extend Claude with skills](https://code.claude.com/docs/en/skills) — How skills load, `disable-model-invocation`
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents) — Separate context, the `model` field
- [Hooks reference](https://code.claude.com/docs/en/hooks) — Rules for hook output entering context, the 10,000-character cap
- [Explore the context window](https://code.claude.com/docs/en/context-window) — What loads at startup, what survives compaction, `/context`
- [How Claude Code uses prompt caching](https://code.claude.com/docs/en/prompt-caching) — Actions that break or keep the cache, TTL
- [Model configuration](https://code.claude.com/docs/en/model-config) — Model aliases, effort levels and defaults
- [MCP tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search) — MCP tool search and lazy loading
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) — Per-model prices, cache multipliers
- [Vision](https://platform.claude.com/docs/en/build-with-claude/vision#evaluate-image-size) — Image token formula
- [Models & usage limits in Claude Code](https://support.claude.com/en/articles/14552983-models-usage-limits-in-claude-code) — Support article noting Opus uses more of your limit than Sonnet
