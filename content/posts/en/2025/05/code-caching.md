---
slug: code-caching
title: "Code Caching"
date: 2025-05-10
tags: ["browser"]
thumbnail: "/uploads/2025/05/code-caching.png"
draft: false
description: "Browsers cache the result of parsing and compiling JavaScript. How V8's cold, warm, and hot runs differ, and why parse and compile costs matter less than they used to."
---

# Code Caching 🫆

* * *

The most striking change in the cost of JS over the past few years is how much faster browsers have become at parsing and compiling scripts.

As of 2024, parsing and compilation are no longer as slow as they once were.

Raw JS parsing speed in V8, Google's JS engine, has kept improving since Chrome 60, and other optimizations in Chrome have made raw parse and compile costs less visible and less important.

In V8, the amount of parsing and compilation on the main thread dropped by about 40% on average, with worker threads taking it over.

This is in addition to the existing off-main-thread streaming parse and compile.

V8 can parse and compile JS without blocking the main thread.

That is a marked improvement over older versions of Chrome, which downloaded the entire script before parsing it.

## #Definition

Code caching (also called bytecode caching) is an important optimization in the browser.

By **caching the result of parsing and compilation**, it shortens startup time on sites you visit often.

## #How it works

![](/uploads/2025/05/codeCaching01.webp)

![](/uploads/2025/05/codeCaching02.webp)

1\. Cold run — the first visit

-   The user visits the site for the first time
-   Chrome downloads the resources the site needs (e.g. ./code/sample/js)
-   It hands the resource to the V8 engine to compile, and stores the original ./code/sample/js file in the browser cache (disk cache)

2\. Warm run — the second visit

-   The user visits the site again
-   Chrome reads the resources it needs straight from the browser cache (no download)
-   It hands the resource to the V8 engine to compile, and stores the original ./code/sample/js file + the bytecode (the compilation result) in the browser cache

3\. Hot run — the third visit onward

-   The user visits the site again
-   Because both the original ./code/sample/js and the bytecode (the compilation result) are there, the V8 engine can deserialize and run it right away (skipping compilation)

An analogy makes it easier to picture.

> First time, you read the book from the beginning → second time, you write a summary as you read → third time, you read only the summary and understand it immediately

References)

[v8.dev](https://v8.dev/blog/code-caching-for-devs#don%E2%80%99t-change-execution-behavior)

A book on building large-scale React web apps
