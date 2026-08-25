---
slug: truthy-falsy
title: "왜 JS는 truthy , falsy 라는 개념을 사용할까?"
date: 2025-08-29
tags: ["javascript"]
draft: false
---

# 왜 JS는 truthy , falsy 라는 개념을 사용할까?

* * *

## 배경

Js 데이터 타입에 boolean에는 논리값(참/거짓) true, false라는 값이 있는데

truth, falsy는 정확히 무엇일까?

그냥 ture, false랑 비슷한거 아닌가? 라는 막연한 생각만 가지고 사용하고 있었다.

  

## 정의

Boolean이 아닌 모든 값을 조건문에서 유연하게 true/false처럼 쓸 수 있게 해주는 JS의 특징

  

## 동작 원리

조건 및 논리 연산자( || , && , ! )에서 JS엔진은 값을 Boolean으로 암묵적으로 변환하여 truthy인지 falsy인지 평가한다.

  

## 비교

```javascript
배열내에 있는 과일의 갯수를 Object에 담는다고 할 때 아래와 같이 가능하다.

const arr = ["apple", "banana", "apple", "orange", "banana", "apple"]
const result = {};
arr.forEach((val)=>{
    if(!result[val]){	 // result내부에 과일 key값이 없으면 !undefined 이므로 true
        result[val] = 0;
    };
    result[val] += 1; // 이후 key값이 추가될 경우 +1
});
```

  

```javascript
truthy , falsy 라는 개념을 적용해 보면 아래와 같이 가능하다.

const arr = ["apple", "banana", "apple", "orange", "banana", "apple"]
const result = {};
arr.forEach((val)=>{
    result1[val] = ( result1[val] || 0 ) + 1;
});
```

  

## falsy 값들 ( 6개 외우기 )

-   false
-   0
-   ""
-   Null
-   Undefined
-   NaN  
      
      
    

## 그래서 왜 JS는 truthy , falsy 라는 개념을 사용할까?🤔

이는 곧 코드가 간결해지고(직관적) 유연해지고. 값의 존재 여부와 유효성을 빠르게 확인할 때 유용합니다.  
  

## 참고

-   [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Boolean?utm\_source=chatgpt.com](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean?utm_source=chatgpt.com)  
    
-   [https://ko.javascript.info/logical-operators](https://ko.javascript.info/logical-operators)
