---
slug: javascript-proxy
title: "Proxy 알아보기"
date: 2025-07-01
tags: ["javascript"]
draft: false
---

# Proxy 알아보기

* * *

## 배경

JS는 유연한(동적) 언어 이기 때문에 객체 내부의 속성을 쉽게 추가, 삭제, 수정이 가능한데 복잡한 애플리케이션을 개발 할 때는 이렇게 유연한 부분을 제어할 필요가 있다.

  

## 정의

Proxy… 인프라에서 들어본것같은데….? 

구글링 해보면

사전적 의미에서는 “대리(행위)”라고 하고

컴퓨터 네트워크 관점에서는

클라이언트와 서버 간의 통신을 중계하는 역할을 하는 서버나 소프트웨어를 의미한다고 알려준다.

결국은 어떠한 것의 대리 역할을 한다는 것인데 한번 알아보자.

MDN에서는

Proxy 객체를 사용하면 한 객체에 대한 기본 작업을 가로채고 재정의하는 프록시를 만들 수 있습니다.

라고 정의하고있다.

  

## 검증하기

```javascript
type Obj = {
  name: string;
  age: number;
  job: string;
  NumberArr: number[];
  _private: string;
};

const obj = {
    name: "kim",
    age: 20,
    job: "developer",
    NumberArr: [1, 2, 3, 4, 5],
    _private: "private",
  };

const proxyObj = new Proxy(obj, {
    get(target, prop: keyof Obj) {
      if (prop in target) {
        return target[prop];
      }
      return "not found property";
    },
    set(target, prop: keyof Obj, value: any) {
      if (prop === "age" && typeof value === "number") {
        target[prop] = value;
      } else {
        console.log("The age is not an integer");
      }
      return true;
    },
    ownKeys(target) {
      return Object.keys(target).filter((key) => !key.startsWith("_"));
    },
  });


  console.log(proxyObj.name);   //kim
  console.log(proxyObj.weight);  // not found property

  proxyObj.age = 22;
  console.log(proxyObj.age);  //22

  proxyObj.age = "나이";
  console.log(proxyObj.age);  // The age is not an integer

  console.log(Object.keys(proxyObj));     // ['name', 'age', 'job', 'NumberArr'] -> _private 제외
  console.log(Object.values(proxyObj));  // ['kim', 22, 'developer', Array(5)]  ->  "private" 제외
 
```

  

## 트랩 메서드

-   *Get :* 프로퍼티 읽기
-   *Set :* 프로퍼티 수정
-   *Has : in* 연산자 사용할 때 호출
    -   특정 범위 내 여부 확인
-   *deleteProperty : delete* 연산자 사용시 호출
-   *Apply :* 함수가 호출될 때
-   *Construct : new* 연산자가 호출될 때  
    

  

## 반드시 따라야하는 규칙

-   프로퍼티 값 수정<em>(set)</em>시 반드시 *ture*를 반환 그렇지 않으면 *false*를 반환
-   프로터피 값 삭제<em>(delete)</em>시 반드시 *ture*를 반환 그렇지 않으면 *false*를 반환  
    

  

## 활용 사례 생각해보기

-   객체의 프로퍼티 값이 조건을 만족하는지에 대한 검증과 특정 규칙 넣기
-   객체의 프로퍼티 값을 캐시해서 중복된 계산 피하기
-    객체의 프로퍼티에 접근 *or* 변경 할 때 로그 및 제어

  

## 참고

-   [*https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global\_Objects/Proxy*](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
-   [*https://ko.javascript.info/proxy*](https://ko.javascript.info/proxy)
