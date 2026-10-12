---
slug: difference-between-number-and-parseInt
title: "Number & parseInt "
date: 2025-03-24
tags: ["javascript"]
draft: false
---

# Number 와 parseInt 차이점 살펴보기

* * *

숫자형식의 `string` 타입을 `number` 타입으로 변경할 때

무조건적으로 둘중 아무거나 선택해서 사용하던중에 정리가 필요할거 같아 정리 해본다.

## #공통점

`Number` 와 `parseInt` 둘 다 숫자로 변환하는 함수

## #동작 방식

`Number` : 전달 받은 매개변수의 **전체 값**을 평가하여 숫자 형식으로 변환

                     `parseInt` : 전달 받은 매개변수를 **하나씩 체크 하여 유효한 정수 까지만** 변환하고 이후 매개변수는 무시 하고 숫자 형식으로 변환

( 문자가 아닌 공백에 관대)

## #예시

```javascript
console.log(Number("123"));        // 123
console.log(Number("12.34"));      // 12.34
console.log(Number("123abc"));     // NaN
console.log(Number("   0012 300  "));   // NaN
console.log(Number(true));         // 1
console.log(Number(false));        // 0
console.log(Number(null));         // 0
console.log(Number(undefined));    // NaN
console.log(Number("Infinity"));   // Infinity
```

  

  

```javascript
console.log(parseInt("123"));      // 123
console.log(parseInt("12.34"));    // 12
console.log(parseInt("123abc"));   // 123
console.log(parseInt("   0012 300  "));   // 12
console.log(parseInt("abc123"));   // NaN
console.log(parseInt("  42"));     // 42 (공백 허용)
console.log(parseInt("101", 2));   // 5 (이진수로 해석)
```

🤔 궁금한 점

지난 글에 javaScript는 문자열에 `e`가 포함되면 지수 표기법으로 처리 한다고 했다.

디버깅 해보면

```javascript
Number('1e5') // 100,000
parseInt('1e5') // 1
```

`Number`는 전체 매개변수를 체크 하므로 문자열에 `e`가 포함 되어 있어 지수 표기법으로 처리 한다.

`parseInt`는 하나씩 체크 하므로 `e`는 문자로 취급해 1까지만 출력 하는 걸 볼 수 있다.

그래서

'12345' 이러한 문자타입을 숫자타입으로 변경하려면 무엇을 사용해야 할까?

## #결론

**정확하게 숫자만 포함된 문자열**을 숫자로 변환할 때는 `Number`을 사용하는 것이 좋다.

`parseInt`는 문자열 안에 문자가 들어가있어도 숫자를 필요로 할 때 그리고 **소수점 이하를 버릴 때** 사용하는 것이 좋다.
