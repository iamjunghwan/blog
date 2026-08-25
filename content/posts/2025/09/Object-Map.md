---
slug: Object-Map
title: "왜 Object 대신 Map을 사용해야할까?"
date: 2025-09-16
tags: ["javascript"]
draft: false
---

# 왜 Object 대신 Map을 사용해야할까?

* * *

## 배경

Object와 Map 모두 key-value 저장을 위한 자료구조인데 헷갈리는 부분이 있어서 정리해본다.

  

## key 순서 차이

1.key값을 정수형으로 사용할 때

정수형 key -> 오름차순으로 정렬된다

```javascript
1-1. Object
    const obj = {};
    obj[100] = 'a';
    obj[2] = 'b';
    obj[7] = 'c';
    
    console.log(Object.keys(obj)); // ['2', '7', '100'] ← 순서 뒤바뀜
```

```javascript
 1-2. Map
    const map = new Map();
    map.set(100, 'a');
    map.set(2, 'b');
    map.set(7, 'c');
    
    console.log([...map.keys()]); // [100, 2, 7] ← 그대로 유지
```

  

📌 참고

그런데 왜 오름차순으로 정렬이 되는 것 일까?

키 값이 정수이면 '배열처럼' 쓰이기 위해 특별 취급된다.

-   js에서는 배열도 결국 객체이기 때문에, arr\[0\]같은 배열 접근도 내부적으로 obj\['0'\]으로 작동
-   정수형 키는 배열처럼 동작하도록 일부러 오름차순 정렬되도록 설계된 것

```javascript
const obj = {2: 'two', 1: 'one'};
console.log(Object.keys(obj)); // ['1', '2']
```

  

  

2\. key값을 문자열로 사용할 때

문자열 key (정수아님) -> 삽입 순서 유지  

```javascript
   2-1. Object
    const obj2 = {};
    obj2['banana'] = 1;
    obj2['apple'] = 2;
    obj2['cherry'] = 3;
    
    console.log(Object.keys(obj2)); // ['banana', 'apple', 'cherry'] ← 순서 유지되는 듯?
```

```javascript
 2-2. Map
    const map2 = new Map();
    map2.set('banana', 1);
    map2.set('apple', 2);
    map2.set('cherry', 3);
    
    console.log([...map2.keys()]); // ['banana', 'apple', 'cherry']
```

  

3\. key값을 숫자+문자열로 사용할 떄

```javascript
3-1. Object
    const obj3 = {};
    obj3['3'] = 'three';
    obj3['b'] = 'bee';
    obj3['1'] = 'one';
    obj3['a'] = 'ay';

 console.log(Object.keys(obj3)); // ['1', '3', 'b', 'a'] ← 정수 먼저 정렬됨
```

```javascript
 3-2. Map
    const map3 = new Map();
    map3.set('3', 'three');
    map3.set('b', 'bee');
    map3.set('1', 'one');
    map3.set('a', 'ay');
    
    console.log([...map3.keys()]); // ['3', 'b', '1', 'a'] ← 삽입 순서 그대로
```

  

  

## 순회 차이

1.Object ( 순회 불가능 )

```javascript
  const obj = {};
    obj[100] = 'a';
    obj[2] = 'b';
    obj[7] = 'c';
   
    // for...in으로 객체의 key 열거 (순회가 아님)
    for (const key in obj) {
      console.log(key); // 2,7,100 
    }
        
    // 키-값 쌍 반복
    Object.entries(obj) // [['2','b'],['7','c'],['100','a']]
    // 키만 반복
    Object.keys(obj);   // ['2','7','100']    
    // 값만 반복
    Object.values(obj); // ['a','b','c']
```

  

2\. Map ( 순회 가능 )

```javascript
const map = new Map();
    map.set(100, 'a');
    map.set(2, 'b');
    map.set(7, 'c');

    for (const [key, value] of map) {
      console.log(key, value);
    }    
    // 100 'a'
    //  2  'b'
    //  7  'c'
        
    map.forEach((value,key,array)=>{
        console.log(value,key,array);
    });
    // a 100 Map(3) {100 => 'a', 2 => 'b', 7 => 'c'}
    // b 2   Map(3) {100 => 'a', 2 => 'b', 7 => 'c'}
    // c 7   Map(3) {100 => 'a', 2 => 'b', 7 => 'c'}
```

  

📌 참고

배열을 forEach로 순회하게 되면 Array.prototype.forEach()에 arr.forEach((element,index,array)=>{})이렇게 되어있는데  

Map은 다르게 Map.prototype.forEach()은 map.forEach((value,key,map)=>{})으로 되어있다.  

  

## 속도 차이

```javascript
const N = 100,000;
const keys = Array.from({ length: N }, (_, i) => `key${i}`);

const obj = {};
keys.forEach((key, i) => {
  obj[key] = i;
});
keys.forEach((key) => {
  const val = obj[key];
});

const map = new Map();
keys.forEach((key, i) => {
  map.set(key, i);
});
keys.forEach((key) => {
  const val = map.get(key);
});
```

  

<table style="border-collapse: collapse; width: 100.012%; height: 73.6458px;"><colgroup><col style="width: 25.044%;"><col style="width: 25.044%;"><col style="width: 25.044%;"><col style="width: 24.9312%;"></colgroup><tbody><tr style="height: 24.5486px;"><td style="text-align: center;">테스트</td><td style="text-align: center;">실행 속도 (ops/s)</td><td style="text-align: center;">오차 범위</td><td style="text-align: center;">비교 결과</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">Map</td><td style="text-align: center;">67 ops/s</td><td style="text-align: center;">±5.72%</td><td style="text-align: center;">✅ 가장 빠름 (기준)</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">Object</td><td style="text-align: center;">61 ops/s</td><td style="text-align: center;">±6.4%</td><td style="text-align: center;">🔻 약 10.25% 느림</td></tr></tbody></table>

  

<table style="border-collapse: collapse; width: 99.7442%; height: 122.743px;"><colgroup><col style="width: 50.13%;"><col style="width: 49.8194%;"></colgroup><tbody><tr style="height: 24.5486px;"><td style="text-align: center;">항목</td><td style="text-align: center;">의미</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">ops/s</td><td style="text-align: center;">초당 실행 횟수 (operations per second), 숫자가 클수록 빠르다</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">± 퍼센트</td><td style="text-align: center;">오차 범위 (statistical margin of error)</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">X% slower</td><td style="text-align: center;">가장 빠른 테스트보다 몇 % 느린지</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">Fastest</td><td style="text-align: center;">이 테스트가 가장 빠른 성능을 기록했다는 뜻</td></tr></tbody></table>

  

📌 참고

JSBench.me에서 동일한 코드를 여러번 실행 하면 세부적인 숫자 차이는 있지만 결론은 Map이 조금 더 빠르다고 나온다.

  

## 참고

[https://tc39.es/ecma262/#sec-array.prototype.foreach](https://tc39.es/ecma262/#sec-array.prototype.foreach)

[https://tc39.es/ecma262/#sec-map.prototype.foreach](https://tc39.es/ecma262/#sec-map.prototype.foreach)

[https://jsbench.me/](https://jsbench.me/)
