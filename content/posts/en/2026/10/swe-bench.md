---
slug: swe-bench
title: "What SWE-bench Scores Don't Tell You"
date: 2026-10-12
tags: ["swe-bench", "ai"]
thumbnail: "/uploads/2026/10/swe-bench.png"
draft: false
description: "Benchmark scores went from 1.96% to over 70% while their meaning eroded. What SWE-bench measures, what it misses, and what I saw migrating this blog with Claude Code."
---

# What SWE-bench Scores Don't Tell You

---

When SWE-bench came out in October 2023, the best model solved **1.96%** of the problems.

Today, scores above 70% are common. That took less than three years.

Yet in February 2026, OpenAI announced that it would **no longer report this benchmark's scores**. While the number went up, what the number meant went down.

I recently migrated this whole blog with Claude Code, and I got to see firsthand how what a benchmark measures differs from what matters in real work. This post is partly a record of that.

## What Is SWE-bench

Carlos E. Jimenez, John Yang, and others at Princeton released it in October 2023. The idea is simple.

**"Can an AI actually fix an issue that was really filed on GitHub?"**

They collected **2,294 pairs of an issue and the PR that resolved it** from 12 popular Python repositories. Each problem is given like this.

- The repository rolled back to the commit from when the issue was opened
- The issue text (exactly as a person wrote it)

From there, the model has to **produce a patch.**

There is one decisive difference from earlier coding benchmarks. Something like HumanEval says "implement a function," but SWE-bench problems require **changes across multiple files**. The model has to work out which files to look at in the first place.

## How It's Graded: This Is the Crux

After applying the submitted patch, **the tests are run.** Two kinds are checked.

| | Meaning |
|---|---|
| `FAIL_TO_PASS` | Tests that were failing because of the issue. **These must pass** |
| `PASS_TO_PASS` | Tests that were passing already. **These must not break** |

If both hold, the problem counts as "resolved." The score is the share of the 2,294 problems that were resolved.

It's a clean design. No human subjectivity, it can run automatically, and it uses real codebases.

**And this is exactly where the limit lies.** What this grading measures is precisely this:

> Do the tests pass?

Not "is the code correct?" Usually the two go together, but **not always.** The rest of this post is about that gap.

### That Gap Has Been Measured

This isn't speculation. The **UTBoost** study, published at ACL 2025, augmented SWE-bench's tests and re-graded it.

The results:

- **36** tasks with insufficient tests
- **345 patches that the benchmark judged as passing but that did not actually fix the issue**

And correcting this **changed the leaderboard rankings.** On Lite, 40.9% of entries were affected, with 18 ranking changes; on Verified, 24.4% were affected, with 11 ranking changes.

**That "passed the tests" differs from "solved the problem" was measured, as 345 cases.** And the gap was large enough to reorder the models.

## Why Verified Exists

In August 2024, OpenAI, together with the original authors, released **SWE-bench Verified**. Ninety-three Python developers reviewed 1,699 samples by hand and kept only **500**.

They filtered because the original contained problems like these.

- **The issue description is insufficient.** Even a person couldn't tell what to fix from the text alone.
- **The tests are overly specific.** They pass only if you follow the implementation the original PR chose. A different fix that is equally correct still fails.
- **Some problems are simply unsolvable.**

So **the original scores were underestimating model ability.** The models hadn't failed; the problems couldn't be solved.

This is an important lesson in benchmark design. Being able to grade automatically doesn't mean the grading is right. It took 93 people to narrow it down to 500.

## And in February 2026, It Ended

OpenAI's Frontier Evals team announced it was ending its reporting of SWE-bench Verified. There are two main reasons.

**Saturation.** The top models cluster at similarly high scores, so the benchmark no longer discriminates. There's no telling whether the difference between 85% and 87% is skill or noise.

**Contamination.** The problems come from **public GitHub repositories.** Models have likely seen those repositories, those issues, and those PRs during training. It's like exam questions printed in the textbook.

The second is more fundamental. **A benchmark built from public data inevitably becomes contaminated over time.** Its lifespan is built into the design.

> Some of the numbers floating around conflict with each other (such as the share of flawed tests), so I haven't reproduced them here. There are also conflicting reports on the state of successor benchmarks, so I'd recommend checking them yourself.

## Putting It to Work: Notes from the Blog Migration

This blog used to store its posts in a headless CMS and fetch them at build time. I moved them into Markdown files inside the repository. It was a job of 16 posts and 64 commits, done with Claude Code Opus 5.

On the surface, it's a success. 77 tests, every public URL preserved, a passing build. But **the failures along the way point exactly at what benchmarks can't see.**

### 1. The Tests Passed, but Everything Was Broken

During the HTML-to-Markdown conversion, **all 46 code blocks were broken.** That's every one of the 14 posts that contain code.

Here is the cause. The HTML this CMS stored had **no** `<code>` inside `<pre>`. The editor, while applying syntax highlighting, put token fragments directly inside `<pre class="language-javascript">`. The conversion rule assumed a `pre > code` structure, so **not one of them fired.** The code fell through as ordinary paragraphs and got Markdown-escaped.

Open the file and it looks fine. The tests pass. **It only shows up when rendered.**

### 2. The Verification Script Built to Catch That Was Wrong Too

Worse was this one. I had built a separate script to compare the original HTML against the converted output, and its code-block comparison **looked for `pre > code` on both sides.**

Since the original had no such structure, the thing being compared was **always an empty array against an empty array.** It was a check that **passes silently even if the code vanishes entirely.**

The safety net was blind to the biggest accident of all. In SWE-bench terms, it's like a `FAIL_TO_PASS` test that verifies nothing.

### 3. Automated Checks Passed 16/16, but the Screen Looked Different

After every structural comparison passed, I opened it in a browser and **the code had no color.**

The original HTML stored the syntax-highlighting output wholesale (2,703 token fragments), and the CSS had a matching color table. Flattening to Markdown erased that information.

The verification script compares **text and structure.** Color isn't text; it's **presentation**, so it wasn't part of the comparison. Automated verification would never catch it.

### 4. The Premise Was Wrong

The most painful one is this. The design document said, **"this blog has no code syntax highlighting."** That was asserted without checking.

It did exist. It just wasn't noticeable because of an unusual storage method. So it was classified as "out of scope," and all the work proceeded on that premise.

**SWE-bench can't measure failures like this.** A problem is given, and tests are given. But in real work, the most expensive mistake is when **the problem definition itself is wrong.**

### 5. What Broke Because of Korean

This is a side note, but an interesting one.

```
**텍스트 형식( 통신 방식 아님 )**입니다.
```

Under CommonMark's flanking rules, a closing `**` that comes **after punctuation and before a letter** isn't interpreted as emphasis. Korean particles attach directly to words, so it hits this condition easily. The `**` showed up as-is on screen.

It's a problem that would never appear in an English-centric benchmark.

Incidentally, **I stepped on the same bug while writing the Korean version of this post.** Sentences like `**1.96%**였다` and `**Verified(500개)**가` all failed to render as emphasis, so I replaced those spots with `<strong>` tags.

## So How Should You Read Benchmarks

**This isn't to say SWE-bench is useless.** Going from 1.96% to the 70s is a real change. Without measurement, we couldn't even talk about that change.

Still, it helps to keep the following in mind when reading the numbers.

| What a benchmark measures | What it doesn't |
|---|---|
| Whether the tests pass | Whether the change is **correct** |
| Whether it solves the given problem | Whether **the problem definition is right** |
| How the code behaves | **What shows up on screen** |
| English issues | Korean content, non-English environments |
| A single patch | The **accumulated judgment** of work spanning days |

It's true that a high-scoring model is genuinely capable. The work above would have taken far longer for one person alone. But **"what percent" doesn't translate directly into "how much you can trust it with."**

What actually helped wasn't the score but the way of working.

- **Separating conversion from verification**, so I could rerun the conversion many times and watch whether the verification results improved
- **Dumping the original wholesale and committing it**, so I could roll back even when the conversion was wrong
- **Looking at the screen myself** even after automated verification passed. That's how number 3 above was caught
- Running a separate review. It disproved, by actually executing it, that the "remove the fence" fix **doesn't work on indented fences, nested fences, or CRLF**

A benchmark measures "how well this model does," but what decided real outcomes was **"how do you notice when you're wrong."**

## Summary

- SWE-bench is a benchmark that measures an AI's code-fixing ability with 2,294 real GitHub issues. The top score in 2023 was 1.96%.
- Grading is **whether the tests pass.** If `FAIL_TO_PASS` passes and `PASS_TO_PASS` doesn't break, it counts as resolved.
- That the two aren't the same has been measured. The UTBoost study found **345 patches judged as passing that were actually wrong**, and correcting this changed the leaderboard rankings.
- Because the original had many flaws, **Verified (500 problems)**, reviewed by 93 people, appeared in 2024.
- In February 2026, OpenAI stopped reporting this benchmark, citing **saturation and contamination.** It's a structural limit of benchmarks built from public data.
- The expensive mistakes in real work were **tests passing while the change is wrong**, **problems visible only on screen**, and **a wrong premise to begin with.** All of them lie outside the benchmark.

## References

- [SWE-bench: Can Language Models Resolve Real-World GitHub Issues? (arXiv 2310.06770)](https://arxiv.org/abs/2310.06770)
- [SWE-bench official site](https://www.swebench.com/)
- [SWE-bench Verified leaderboard](https://www.swebench.com/verified.html)
- [SWE-bench GitHub repository](https://github.com/swe-bench/SWE-bench)
- [Princeton PLI blog: introducing SWE-bench](https://pli.princeton.edu/blog/2023/swe-bench-can-language-models-resolve-real-world-github-issues)
- [Introducing SWE-bench Verified — OpenAI](https://openai.com/index/introducing-swe-bench-verified/)
- [Why we no longer evaluate SWE-bench Verified — OpenAI](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)
- [princeton-nlp/SWE-bench — Hugging Face dataset](https://huggingface.co/datasets/princeton-nlp/SWE-bench) — the `FAIL_TO_PASS` / `PASS_TO_PASS` field definitions are here
- [SWE-bench evaluation harness docs](https://www.swebench.com/SWE-bench/api/harness/) — the grading logic that counts a problem as resolved only if both sets pass
- [UTBoost: Rigorous Evaluation of Coding Agents on SWE-Bench (ACL 2025, arXiv 2506.09289)](https://arxiv.org/abs/2506.09289) — the study showing that 345 patches judged as passing were actually wrong
