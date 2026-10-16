---
slug: NDJSON-JSON
title: "What Is NDJSON?"
date: 2026-02-16
tags: ["javascript"]
thumbnail: "/uploads/2026/02/NDJSON-JSON.png"
draft: false
description: "One valid JSON value per line, separated by newlines. Why that shape suits streaming, logging, and append-only data better than a JSON array does."
---

# What Is NDJSON?

* * *

## Definition

Also called JSON Lines (JSONL) or Newline Delimited JSON (NDJSON), this format is a **text format ( not a transport protocol )** for storing structured data.

Each line consists of a valid JSON value, separated by a newline character.

The format is designed to store and process structured data conveniently, one record at a time, which makes it ideal for streaming, logging, and append-only data scenarios.

  

  

That may not land yet, so here is what a live log screen built from mock data would look like.

## Demo

   <video controls="controls" width="500" height="300" poster=""> <source src="/uploads/2026/02/NDJSON&amp;JSON.mov"> </video> 

[🔗  NDJSON & JSON compared](https://github.com/iamjunghwan/ndjson-react-demo)

  

```javascript
mock-data.ndjson

{"id":1,"type":"click","target":"button#login","time":"10:01:02"}
{"id":2,"type":"navigate","target":"/dashboard","time":"10:01:05"}
{"id":3,"type":"input","target":"input#search","time":"10:01:08"}
{"id":4,"type":"click","target":"button#logout","time":"10:01:12"}
{"id":5,"type":"navigate","target":"/login","time":"10:01:15"}
```

  

```javascript
mock-data.json

[
  { "id": 1, "type": "click", "target": "button#login", "time": "10:01:02" },
  { "id": 2, "type": "navigate", "target": "/dashboard", "time": "10:01:05" },
  { "id": 3, "type": "input", "target": "input#search", "time": "10:01:08" },
  { "id": 4, "type": "click", "target": "button#logout", "time": "10:01:12" },
  { "id": 5, "type": "navigate", "target": "/login", "time": "10:01:15" }
]
```

  

## Characteristics

-   You cannot wrap the whole thing in brackets (\[ and \]) and parse it as a JSON array.
-   There are no commas between lines.
-   Each line stands on its own.
-   Unlike CSV, every row is a complete JSON object, so nested objects, arrays, and every JSON data type are fully supported.

  

## Rules

-   Each line must be a valid JSON value. The most common type is a JSON object, but arrays, strings, numbers, booleans, and null are valid too.
-   Each line must be separated by the newline character \\n.
-   The file must use UTF-8 encoding.
-   Do not use commas between lines.
-   Each JSON value must fit on one line. (Spreading it across several lines is not allowed.)
-   It's best not to use blank lines.

  

## When would you use it?

-   Live log screens
-   Streaming AI responses ( ChatGPT )
-   Large volumes of data

  

## 📌 Reference

[https://ndjson.com/](https://ndjson.com/)
