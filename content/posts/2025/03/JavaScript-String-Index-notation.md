---
slug: JavaScript-String-Index-notation
title: "문자열에 'e'가 포함되면 지수 표기법"
date: 2025-03-10
tags: ["javascript"]
draft: false
---

# **문자열에 e가 포함되면 지수 표기법**

* * *

javascript에서 숫자와 문자열을 처리 할 때,

문자열에 <strong>`e`</strong>가 포함되면 이를 **지수 형식**으로 인식한다.

```javascript
    let str = '1e5';
    let num = 100000;

    str == num  => true

    str === num => false

    isNaN(str)  => false
  
```

'1e5' 는 1 \* 10 *^5*

*즉 100,000 로 해석 된다.*

***지수 표기법에서 `e`는***

<strong>*"10의 거듭제곱"</strong>를 의미한다.*

*javascript는 자연스레 숫자 100,000로 변환한다.*

```javascript
    let str = 'test1e5';

    isNaN(str)  => true
  
```

*이와 같이*

*문자열`e`가 포함된 일반적인 문자열이면*

*지수 표기법으로 자동 변환되지는 않는다.*

  

*결론*

*`e`가 들어간 문자열 -> 숫자 로 변환 할 때는*

*문자열이 지수 표기법 형식에 맞는지 확인하는 것이 중요!!!*
