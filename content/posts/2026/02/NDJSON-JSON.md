---
slug: NDJSON-JSON
title: "NDJSON이란?"
date: 2026-02-16
tags: ["javascript"]
draft: false
---

# NDJSON이란?

* * *

## 정의

JSON Lines (JSONL), 또는 Newline Delimited JSON (NDJSON) 이라고도 하는 이형식은 구조화된 데이터를 저장하기 위한 <strong>텍스트 형식( 통신 방식 아님 )</strong>입니다.

각 줄은 줄 바꿈 문자로 구분된 유효한 JSON 값으로 구성됩니다.

이 형식은 한 번에 하나의 레코드씩 처리될 수 있는 구조화된 데이터를 편리하게 저장하고 처리하도록 설계되었으므로 스트리밍, 로깅 및 추가 전용 데이터 시나리오에 이상적입니다.

  

  

이해가 안갈 수도 있으니 실제로 목업데이터로 실시간 로그 화면을 한다고 하면 아래와 같을 것이다.

## Demo

   <video controls="controls" width="500" height="300" poster=""> <source src="/uploads/2026/02/NDJSON&amp;JSON.mov"> </video> 

[🔗  NDJSON & JSON 비교](https://github.com/iamjunghwan/ndjson-react-demo)

  

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

  

## 특징

-   전체를 대괄호(\[)와 대괄호(\])로 묶어 JSON 배열로 파싱할 수 없다.
-   줄 사이에 쉼표가 없다.
-   각 줄은 독립적으로 존재한다.
-   CSV와 다르게 각 행이 완전한 JSON 객체이므로 중첩 객체, 배열 및 모든 JSON 데이터 유형을 완벽하게 지원한다.

  

## 규칙

-   각 줄은 유효한 JSON 값이여야 합니다. 가장 일반적인 유형은 JSON 객체이지만 배열, 문자열,숫자 불리언 및 null 값도 유효하다.
-   각 줄은 줄 바꿈 문자 \\n로 구분 해야한다.
-   파일은 UTF-8 인코딩을 사용해야 한다.
-   각 줄 사이에 쉼표를 사용하지 않는다.
-   각 JSON값은 한 줄에 포함되어야 한다. (여러 줄에 걸쳐 입력하는 것은 허용되지 않는다.)
-   빈 줄을 사용하지 않는 것이 가장 좋다.

  

## 언제 사용할까?

-   실시간 로그 화면
-   AI 스트리밍 응답 ( 챗 지피티 )
-   대용량 데이터

  

## 📌 참고

[https://ndjson.com/](https://ndjson.com/)
