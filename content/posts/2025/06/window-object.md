---
slug: window-object
title: "window[ elementId or elementName]"
date: 2025-06-17
tags: ["javascript", "browser"]
draft: false
---

# window\[ elementId or elementName\]

* * *

## 배경

Id 속성이 있는 DOM 요소에 대응하는 변수를 자동으로 전역에 등록하는 것은 브라우저 환경에서 오래전부터 지원하던 기능이다.

여전히 이 레거시 기능을 지원하는 이유는 만들어진 지 오래된 사이트 중 자동 변수 등록에 의존하는 경우가 많기 때문이다.

자동으로 등록된 전역 변수는 되도록 사용하지 않길 바란다.

## window\[elementId or name\]의 동작원리

이는 브라우저 환경에서 제공되는 특수 기능인데

1.  HTML이 파싱할 때 id가 있는 요소를 발견한다.
2.  DOM 생성 시 해당 id를 가진 요소를 전역 스코프 (window)에 등록한다.
3.  이후 window\[‘elementId’\]에 접근하게되면 등록된 DOM 요소를 반환 할 수 있다.

## 접근 조건

Id는 거의 모든 요소에 가능하고

DOM에 name 속성이 있어도 일부 특정 요소 (&lt;iframe>, &lt;embed>, &lt;object>, &lt;img>, &lt;form>)만 전역 등록을 해준다.

## window\[elementId or name\] & document.getElementById(‘elementId’) 차이점

결과는 같아 보이지만 동작원리의 차이 ( 어떻게 요소를 찾아서 반환하느냐 )

![](/uploads/2025/06/differencesInPrincipleOfOperation.webp)

```javascript
// example Dom 
   <div id="div1">5</div>
   <div id="div1">1</div>
   <div id="div1">2</div>
   <div id="div1">3</div>
   <div id="div1">4</div>

// id값이 있는 요소를 아래처럼 넣으면
window['div1'] // 위의 dom을 다 가져온다.
document.getElementById('div2') // 첫 번째 요소  <div id="div1">5</div> 반환

// id값이 없는 요소를 아래처럼 넣으면
window['div2'] // undefined (그런 전역 변수 없음)
document.getElementById('div2') // null (그런 ID가진 DOM없음)
```

## 결론

window\[elementId or name\]는 개발자 도구로 **디버깅 용도**로 사용하는 것이 좋은것 같다.

## 참고

[https://html.spec.whatwg.org/multipage/nav-history-apis.html#named-access-on-the-window-object](https://html.spec.whatwg.org/multipage/nav-history-apis.html#named-access-on-the-window-object)
