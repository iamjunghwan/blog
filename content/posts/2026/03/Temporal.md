---
slug: Temporal
title: "Temporal의 등장 ( Date의 문제점 )"
date: 2026-03-16
tags: ["javascript"]
draft: false
---

# Temporal의 등장 ( Date의 문제점 )

* * *

  

## 정의

`Temporal`의 뜻은 시간의, 시간적인 이라는 뜻을 가지고 있다.

  

## 배경

### 1\. 복잡한 날짜 처리 🤬

-   기존의 Date API는 자바의 근본적인 설계가 부실한 `java.util.Date` 클래스를 기반으로 2010년 초에 대체 되었다.
-   javascript는 하위 호환성을 유지하기 위해 해당 클래스를 `Date`언어에 계속 남겨 두고 사용하였다.  
    

### 2\. 파싱 동작의 불안정 😖

### 3\. Date자체가 뮤터블해서 추적하기 어려운 버그 유발 🐛

  

## Temporal의 핵심 개선점

1.  불변
    
    ```javascript
    const meeting = Temporal.PlainDateTime.from('2025-09-04T10:00')
    const later = meeting.add({ hours: 2 })
    
    console.log(meeting.toString()) // 2025-09-04T10:00:00 (원본 유지!)
    console.log(later.toString())   // 2025-09-04T12:00:00 (새 객체)
    ```
    
      
    
2.  목적에 맞게 분리된 클래스
    
    <table style="border-collapse: collapse; width: 99.9671%; height: 202.4px;"><colgroup><col style="width: 49.9845%;"><col style="width: 49.9845%;"></colgroup><tbody><tr style="height: 24.8px;"><td>클래스</td><td>용도</td></tr><tr style="height: 25.6px;"><td><code>Temporal.PlainDate</code></td><td>날짜만 (2025-03-16)</td></tr><tr style="height: 25.6px;"><td><code>Temporal.PlainTime</code></td><td>시간만 (14:30:00)</td></tr><tr style="height: 25.6px;"><td><code>Temporal.PlainDateTime</code></td><td><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]"></code>날짜 + 시간 (타임존 없음)</td></tr><tr style="height: 25.6px;"><td><code>Temporal.ZonedDateTime</code></td><td><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]"></code>날짜 + 시간 + 타임존</td></tr><tr style="height: 25.6px;"><td><code>Temporal.Instant</code></td><td>UTC기준 절대 시점</td></tr><tr style="height: 24.8px;"><td><code>Temporal.Duration</code></td><td>시간 간격</td></tr><tr style="height: 24.8px;"><td><code>Temporal.Now</code></td><td>현재 시각 유틸리티</td></tr></tbody></table>
    
      
    
3.  타임존 완벽 지원
    
    ```javascript
    // 서울 시각
    const seoul = Temporal.Now.plainDateTimeISO('Asia/Seoul')
    
    // 뉴욕 시각
    const newYork = Temporal.Now.plainDateTimeISO('America/New_York')
    ```
    
4.  나노초 정밀도
    
    ```javascript
    const now = Temporal.Now.instant()
    // 밀리초가 아닌 나노초 단위까지 지원
    ```
    

  

## 형식

-   모든 클래스는 ISO 8601 / RFC 3339를 기반으로 하는 명시적 형식을 사용
    -   📌 iso 8601 : 날짜와 시간을 표현하는 국제 표준 형식
    -   📌 RFC 3339 : ISO 8601을 확장해서 타임존 정보를 더 명확하게 표현하기 위한 표준
        
        ```javascript
        나라 마다 예를 들어 06/07/08 이라는 날짜는 해석이 다르다
        미국 : 2008년 6월 7일
        유럽 : 2008년 07월 6일
        iso 8601 : 2006년 7월 8일 (YYYY-MM-DD) 
        => 슬래시 사용('2026/03/16')은 ISO 8601 아님
        ```
        
-   큰 단위 → 작은 단위 순서로 표기하는 국제 표준
-   문자열 정렬 = 날짜 정렬이 되도록 설계되어있어 개발 생태계 표준

  

## 3줄 요약 ✔️

-   `Date`의 잘못된 설계를 다시 처음부터 설계해서 나오는 `Temporal`
-   `moment.js`, `date-fns`과 같은 라이브러리가 필요없어지는 시대가 곧 온다.
-   지금 사용하려면 폴리필을 사용해야한다.

  

## 참고

-   [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Temporal#api\_overview](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal#api_overview)
-   [https://datatracker.ietf.org/doc/html/rfc3339](https://datatracker.ietf.org/doc/html/rfc3339)
