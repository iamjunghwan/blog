---
slug: scion-source-control
title: "Writing Code Is No Longer the Bottleneck — Anthropic's Scion"
date: 2026-11-16
tags: ["news", "ai"]
draft: true
description: "Daily merges went from 2,500 to over 30,000 in four months, and the infrastructure built to absorb them became the constraint. What Anthropic changed, what it means for merge queues and CI, and why git isn't going anywhere."
---

# Anthropic's Scion: From Human Scale to Agent Scale

---

In October 2026, Anthropic published a post about migrating its internal monorepo off git entirely, onto a version control system of its own called Scion. The migration took five months. Seven people built it.

The reason is the interesting part. As code output climbed, the infrastructure that stores, verifies, and merges those changes became the bottleneck.

What stands out here isn't only throughput — it's the change in the working environment. Git's distributed design fits a world where developers keep independent workspaces. Anthropic's agents and CI jobs, by contrast, run at scale on always-connected infrastructure.

**When the working environment changes, the costs and benefits of an existing design change with it.** Scion shows how that shift affects not just the repository but merge queues and CI.

## 1. The Numbers First

Here is the number of changes **merged per day** into Anthropic's monorepo.

| Date | Merges per day |
|---|---|
| May 2026 | about 2,500 |
| September 2026 | over 30,000 |

More than a twelvefold increase in four months. Anthropic attributes it to the rise in code output from agents.

Running agents in parallel can amplify the workload very quickly. The question becomes whether existing infrastructure has the capacity to keep up.

## 2. Where git Stopped Holding Up

The repository figures the post discloses:

- The history of the main branch alone is roughly 100 GB
- A compressed working copy is over 25 GB
- Checkouts for CI run about 25 million times a day

That last number is the problem. Fetching 25 GB naively, 25 million times a day, works out to

> over 600 PB of git traffic per day

So you add caches. At peak, Anthropic says it was running **several hundred internal git mirrors**.

But adding mirrors breaks something else. The post names two problems.

1. A mirror's **seed drifts further from the tip of main**. The staler the cache, the more there is to fetch again
2. Keeping **`diff` and `blame` working** on top of a partial clone gets harder

Mirrors reduced the download load, but they did not fundamentally solve either the drift from current state or the query handling on partial clones.

## 3. Changing the Premise: "Clients Are Always Online"

Scion's design starts by inverting **one of git's assumptions**.

Git was designed so that version control work can happen locally, without depending on a central server. A standard clone copies the commit history and the associated objects, which is why you can commit and run `log` on a plane. In 2005, git paired that independence with fast operations. It was not the first distributed version control system, and today it also supports shallow and partial clones.

But the clients of Anthropic's monorepo are mostly **agents and CI jobs, not people**. They run inside a data center, so a constant connection can be taken as a design premise.

Change the premise and a lot follows.

| | Git | Scion |
|---|---|---|
| Client | copies history and objects locally by default | always online, requests only what it needs |
| History, blame, merge, rebase | computed mostly locally | computed on the server |
| Commits | accumulate locally, then push | created on the server, no push |
| Commit cost | affected by change size and index/tree handling | proportional to the size of the change |
| Checkout | used for file work, may be unnecessary for queries | optional; sparse and virtualized checkouts |
| Queries | local CLI or platform API | exposed as an API |
| Repository maintenance | packfile upkeep and similar | no packfiles at all |

"Source control as an API" is the item with the most practical weight. Many CI jobs finish their work through queries alone, with no local repository. The automated bisect and revert pipelines are built on top of it.

## 4. The Data Model: A Change List, Not a Tree

A git commit points to the root tree at that moment. It is logically a snapshot, but it does not copy every file each time — unchanged trees and blob objects are reused.

Scion's unit is a changeset, and it is an entry in a write-ahead log. What it points to is different.

```text
git commit   →  points at the whole tree at that moment
changeset    →  holds only the list of files changed
                relative to its first parent
                (contents are content-addressed pointers
                 to compressed blobs)
```

Updating a ref is separate from creating a changeset. It is handled by a compare-and-swap on a single Spanner row. Creating the commit object and updating the ref are handled independently. Contention on the same ref still has to be coordinated. This structure is what the post calls "cheap, incremental, lock-free commits."

There is a cost to it. If a changeset carries only the delta, queries that have to walk the entire past — `blame`, file history — get expensive.

So Scion builds those separately, as **derived data**.

- Blame structures, path-history structures, and skip lists for the commit graph
- Each derived type is computed recursively from its parents' values
- Types can be added, computed eagerly or lazily, and optimized without changing the client

I think this is the heart of the design. In ordinary git, `blame` is an operation that analyzes local history. Scion computes derived data on the server and reuses it, which cuts the repeated work done at query time. Derived data can be computed eagerly or lazily.

## 5. Three Tiers, and the Transfer Protocol

Where the `scn` client differs from git is **negotiation**.

A git fetch exchanges "what I already have" with the server, and the server packs the difference into a single packfile. Scion doesn't do that.

```text
1. The client negotiates only the trees and blobs it WANTS
   (what it already has is not part of the exchange)
2. It fetches the missing trees recursively
3. Then it fetches the blobs
```

Every single request is a request for an **immutable object**. That gives you two things.

- Any cache holding that object can answer. The server doesn't have to compute it each time
- An interrupted transfer can be resumed. You don't re-fetch a huge packfile from the start

The structure has three tiers, and all three speak the same RPCs.

| Tier | Where | Role |
|---|---|---|
| `scion-daemon` | one per node | connects to clients over a socket |
| `scion-cache` | regional | streams objects from memory |
| `scion-server` | authoritative | reads from Spanner / cloud storage |

An important reason for keeping the tiers strictly separated is failure isolation. The design reduces the risk that a failure in one tier turns into overload in another.

## 6. Results

The figures the post reports:

| Item | Result |
|---|---|
| Cache hit rate at each tier | over 99% |
| Infrastructure CPU and memory | about 1/200th of the previous git mirror setup |
| Checkouts for CI and research jobs | minutes → seconds (roughly two orders of magnitude) |
| CI CPU headroom | 25% recovered |
| Long-lived state | none tied to service or cache nodes |

Durable data lives in Spanner and cloud storage. Because no long-lived state is tied to a service or cache node, individual nodes are easy to replace or scale.

## 7. Merge Queues and CI Mean Something Different Now

This part stayed with me longer than the implementation did.

Anthropic argues that a strict merge queue loses its effectiveness at agent scale.

A merge queue coordinates the order in which changes land and the verification of the integrated state. It can test speculative merge states in parallel, or batch several changes together. Even so, Anthropic concluded that at their volume of changes, global pre-merge verification caps throughput.

The post asks a sharper question.

If hundreds or thousands of changes can merge while the tests are running, what is CI guaranteeing?

The test result is still valid for the commit it verified. It just doesn't mean that the latest main at the moment the tests finish has been verified too.

So instead of reproducing a global lock, Anthropic invested in automated post-merge and pre-deploy testing. Concurrent changes conflicting with each other is accepted. The reasoning:

Anthropic says Claude was able to fix those conflicts quickly.

A strategy concentrated on verification up front was redistributed toward detecting and recovering from regressions after the merge. That choice depends on regressions being detectable and fixable fast. It does not follow that the same strategy fits changes where recovery after the fact is hard, such as security or data integrity.

## 8. What Did the People Do?

This is probably the line from the post that will get quoted most.

Per the post, the engineers who built this system rated Claude's code-writing ability highly.

So what did the people do? The post's answer:

- Understanding the system as a whole, and judgment on design-level tradeoffs
- And — "the role of the engineers was to tell Claude 'no.'"

Because agents sometimes violate the system's core constraints. Writing code that works and holding the line the system has to hold are different jobs, and the second one stayed with the humans.

Review changed too. The post describes human reviewers focusing more on the intent of a change. That can't be stretched into meaning all code-level verification became unnecessary.

There is one concrete example. When Claude was asked to rewrite the git-to-Scion ingestion prototype, the result reportedly used 20x less memory and ran 4x faster. Anthropic also keeps separate "superfan" agents that watch individual components.

## 9. Will git Disappear?

Anthropic states explicitly that Scion is not a general-purpose replacement for git.

Scion is most valuable with always-connected clients, a very large monorepo, and a high volume of concurrent changes. Spanner is a technology chosen to implement that design, not a prerequisite. Organizations centered on human developers rather than agents can hit problems of a similar scale.

Google's Piper and Meta's Sapling (particularly Mononoke and the Bonsai data model) are the precedents. Anthropic applied a direction already explored in large monorepos to an agent-centric environment.

Git's basic concepts — commits, refs, blame, diff — carry over into Scion. What changed is mainly the data model, where computation happens, and how data is transferred.

Git supports optimizations of its own.

| Git feature | What it does |
|---|---|
| partial clone | defers downloading some objects |
| sparse checkout | expands only part of the working tree |
| commit-graph | stores the information needed to traverse the commit graph |

Some of those directions resemble Scion's. But git has to preserve backward compatibility and the distributed working model. Packfiles are not a device for offline work alone, either — they are valuable for object compression and efficient network transfer.

What Anthropic proposes is likewise not discarding git, but bringing new server architectures and server-side RPCs into the git ecosystem. Once compatibility with existing tooling and operational cost are taken into account, a typical team has plenty of reason to stay on git.

## 10. Reading the Numbers

Every performance figure in that post is self-reported by Anthropic. None of it is an independent benchmark.

The result that infrastructure shrank to roughly 1/200th is measured against the git mirror infrastructure they themselves were running. It should not be read as a like-for-like comparison with another optimized git server.

Even so, over 30,000 merges and roughly 25 million checkouts a day is scale enough to justify revisiting an architecture. What matters more than the figures is which design decisions they made to absorb that load.

## Wrapping Up

When the cost of producing code falls, costs that were never very visible — checkout, review, integration verification — can surface as the new bottleneck.

Designing development infrastructure means weighing two conditions together: how many changes the actors produce, and what environment they work in.

A change in throughput can sometimes be absorbed by scaling the existing system. But when the working environment changes as well, the costs and benefits of the existing design have to be evaluated again.

There is a question left for teams that will never adopt Scion. Can your current code review and CI strategy absorb a rising volume of changes? Can you reduce the cost of verification while still holding the system's core constraints?

What makes Scion interesting isn't only the self-reported claim that it is faster than git. It is a concrete case of re-examining the premises of an existing design and changing the architecture and the workflow to match.

---

### References

- [Redesigning source control at Anthropic](https://www.anthropic.com/research/redesigning-source-control) — the original post (published 2026-10-13, updated 10-15)
- [Google — Why Google Stores Billions of Lines of Code in a Single Repository](https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/) — Piper
- [Sapling SCM](https://sapling-scm.com/) — Meta's VCS
- [Mononoke](https://sapling-scm.com/docs/internals/internal-structure/) — Sapling's server
- [Google Cloud Spanner](https://cloud.google.com/spanner/docs) — where the compare-and-swap on a single row for refs happens
- [Git — partial clone documentation](https://git-scm.com/docs/partial-clone)
- [Git — packfile format](https://git-scm.com/docs/pack-format)
