---
slug: Temporal
title: "The Arrival of Temporal ( What's Wrong with Date )"
date: 2026-03-16
tags: ["javascript"]
thumbnail: "/uploads/2026/03/Temporal.png"
draft: false
description: "Date was built on java.util.Date and JS kept it for backward compatibility. Temporal redesigns it from scratch: immutable, purpose-split classes, real time zones, nanosecond precision."
---

# The Arrival of Temporal ( What's Wrong with Date )

* * *

  

## Definition

`Temporal` means "of time, relating to time."

  

## Background

### 1\. Date handling is complicated 🤬

-   The existing Date API was based on Java's `java.util.Date` class, whose fundamental design was poor enough that Java replaced it in the early 2010s.
-   To preserve backward compatibility, JavaScript kept that class in the language as `Date` and went on using it.  

### 2\. Parsing behaves unreliably 😖

### 3\. Date itself is mutable, which breeds bugs that are hard to trace 🐛

  

## What Temporal improves

1.  Immutability
    
    ```javascript
    const meeting = Temporal.PlainDateTime.from('2025-09-04T10:00')
    const later = meeting.add({ hours: 2 })
    
    console.log(meeting.toString()) // 2025-09-04T10:00:00 (the original is intact!)
    console.log(later.toString())   // 2025-09-04T12:00:00 (a new object)
    ```
    
      
    
2.  Classes split by purpose
    
    <table style="border-collapse: collapse; width: 99.9671%; height: 202.4px;"><colgroup><col style="width: 49.9845%;"><col style="width: 49.9845%;"></colgroup><tbody><tr style="height: 24.8px;"><td>Class</td><td>Purpose</td></tr><tr style="height: 25.6px;"><td><code>Temporal.PlainDate</code></td><td>Date only (2025-03-16)</td></tr><tr style="height: 25.6px;"><td><code>Temporal.PlainTime</code></td><td>Time only (14:30:00)</td></tr><tr style="height: 25.6px;"><td><code>Temporal.PlainDateTime</code></td><td><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]"></code>Date + time (no time zone)</td></tr><tr style="height: 25.6px;"><td><code>Temporal.ZonedDateTime</code></td><td><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]"></code>Date + time + time zone</td></tr><tr style="height: 25.6px;"><td><code>Temporal.Instant</code></td><td>An absolute point in time, in UTC</td></tr><tr style="height: 24.8px;"><td><code>Temporal.Duration</code></td><td>A span of time</td></tr><tr style="height: 24.8px;"><td><code>Temporal.Now</code></td><td>Current-time utilities</td></tr></tbody></table>
    
      
    
3.  Full time zone support
    
    ```javascript
    // Seoul time
    const seoul = Temporal.Now.plainDateTimeISO('Asia/Seoul')
    
    // New York time
    const newYork = Temporal.Now.plainDateTimeISO('America/New_York')
    ```
    
4.  Nanosecond precision
    
    ```javascript
    const now = Temporal.Now.instant()
    // supports nanoseconds, not just milliseconds
    ```
    

  

## Format

-   Every class uses an explicit format based on ISO 8601 / RFC 3339
    -   📌 ISO 8601 : the international standard format for expressing dates and times
    -   📌 RFC 3339 : a standard that extends ISO 8601 to express time zone information more clearly
        
        ```javascript
        A date like 06/07/08 is read differently from country to country
        US     : June 7, 2008
        Europe : July 6, 2008
        ISO 8601 : July 8, 2006 (YYYY-MM-DD)
        => using slashes ('2026/03/16') is not ISO 8601
        ```
        
-   An international standard that writes larger units first, then smaller ones
-   Designed so that sorting strings = sorting dates, which is why it's the standard across the development ecosystem

  

## Three-line summary ✔️

-   `Temporal` comes from redesigning `Date`'s bad design from scratch
-   The era when libraries like `moment.js` and `date-fns` are no longer needed is nearly here.
-   To use it today, you need a polyfill.

  

## References

-   [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Temporal#api\_overview](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal#api_overview)
-   [https://datatracker.ietf.org/doc/html/rfc3339](https://datatracker.ietf.org/doc/html/rfc3339)
