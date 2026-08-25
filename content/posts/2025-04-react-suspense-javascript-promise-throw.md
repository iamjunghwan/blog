---
slug: react-suspense-javascript-promise-throw
title: "⚛️ Suspense 살펴보기"
date: 2025-04-26
tags: ["react", "javascript"]
draft: false
---

# ⚛️ Suspense 살펴보기

* * *

## **#정의**

React 공식 홈페이지를 들어가면 

> Suspense
> 
> `Suspense` 컴포넌트는 자식 요소를 로드하기 전까지 화면에 대체 UI를 보여줍니다.  
>   

라고 정의하고 있습니다.

간단한 예제를 한번 짜보겠습니다.  
  

## **#샘플 코드**

```javascript
const fetchData = () => {
  let status = "pending";
  let result, promiseErrorResult;

  let promiseResult = fetch("https://jsonplaceholder.typicode.com/todos")
    .then((response) => {
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`통신 부분 버그 ${response.status}`);
        }
      }
      return response.json();
    })
    .then((data) => {
      status = "success";
      result = data;
    })
    .catch((error) => {
      status = "error";
      promiseResult = error;
      throw error;
    });

  return {
    read() {
      if (status === "pending") {
        throw promiseResult;
      } else if (status === "error") {
        throw promiseErrorResult;
      }
      return result;
    },
  };
};
```

  

```html
const resource = fetchData();

const Child = () => {
  const data = resource.read();
  return (
    <>
      <p>`${JSON.stringify(data)}`</p>
    </>
  );
}
export default Child;
```

  

```javascript
const Parents = () => {
  return (
      <ErrorBoundary FallbackComponent={WrapErrorFallback}>
        <Suspense
          fallback={<h2>💤 Data is comming....💤</h2>}
        >
          <Child/>
        </Suspense>
      </ErrorBoundary>
  );
};

export default Parents;
```

  

실행 해 보게되면

아래와 같이 fallback ui가 나타나게 되고

![](/uploads/2025/05/suspense01.webp)    

이후 Promise 객체가 fullfill 상태가 되면

  

![](/uploads/2025/05/suspense02.webp)  

  

이렇게 원하는 결과 ui를 렌더링 하는 것을 볼 수 있습니다.

  

## **#그런데 여기서 궁금한점이 생겼습니다.🤔**

`Suspense`는 어떻게 자식 컴포넌트가 비동기 행위를 할 때 이를 감지하고 fallback ui를 보여줄 수 있는 것일까?  
  
또한 비동기 행위가 종료되면 개발자가 원하는 컴포넌트를 다시 보여줄 수 있는 것일까?

라는 점이 너무 궁금했습니다.

결론부터 말하자면  
자식 컴포넌트가 비동기 행위의 상태(Promise)를 `Suspense`에 throw함으로써 `Suspense`는 내부적으로 처리를 한다는 것이였습니다.

일반 javascript 코드를 이용해서 위의 React 컴포넌트와 비슷하게 구현 해 보았습니다. (추측)

## **#JavaScript로 구현해 보기 (동작원리)**

```html
const fetchData = () => {
  let status = "pending";
  let result, promiseErrorResult;

  let promiseResult = fetch("https://jsonplaceholder.typicode.com/todos")
    .then((response) => {
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`통신 부분 버그 ${response.status}`);
        }
      }
       return new Promise((resolve) => {
        setTimeout(() =>{
          resolve(response.json());
        }, 2000);
      });
    })
    .then((data) => {
      status = "success";
      result = data;
    })
    .catch((error) => {
      status = "error";
      promiseResult = error;
      throw error;
    });
  
  return {
    read() {
      if (status === "pending") {
        throw promiseResult;
      } else if (status === "error") {
        throw promiseErrorResult;
      }
      return result;
    },
  };
};

 
const resource = fetchData();

function Child(flag){
    return console.log(resource.read());
}

async function suspense() {
    for (;;) {
        try {
          return Child();
        } catch (promiseProcess) {
          if (promiseProcess instanceof Promise) {
            console.log("✅ fallback ui loading....✅",promiseProcess)
            await promiseProcess;
          } else {
            throw promiseProcess;
          }
        }
    }
}

suspense(); 
```

  

과정

Suspense 호출 -> Child 호출 -> 현재 Promise (pending) 상태를 suspense에 throw ->  suspense는 catch에  fallback ui loading & 비동기 행위 재계 (이행 | 거부) -> 결과에 따른 처리

  

결과

![](/uploads/2025/05/suspense03.webp)

  

이렇게 일반 자바스크립트의 비동기 객체 Promise를 throw하여 throw한 함수의 가까운 try catch를 이용하여 처리를 한다는 것이였습니다.

  

## **#결론**

Suspense의 동작 원리를 공부해보면서 비동기 처리 방식과 원리를 새로운 관점으로 바라볼수 있었습니다. 

> "비동기 작업이 Promise를 throw" 해야 한다는 React의 특별한 패턴으로 인한 선언형 프로그래밍.

  

  

\- 이러한 패턴은 아래와 같은 상황에서도 주로 사용한다고 합니다.

-    React.lazy로 동적 import 할 경우 ( 컴포넌트 자체가 Promise로 로드되어 Suspense가 fallback ui를 보여줌)
-     use 훅 ( RCC에서 use(fetch) 처럼 사용하면 내부에서 Promise가 throw됨 )
-    서버 컴포넌트 + streaming (서버에서 데이터를 비동기로 받아와 fallback을 보여줌 )

  

  

참고:)   
[https://mieszkogulinski.github.io/react-suspense-and-throwing-promise/](https://mieszkogulinski.github.io/react-suspense-and-throwing-promise/)  

[https://maxkim-j.github.io/posts/suspense-argibraic-effect/](https://maxkim-j.github.io/posts/suspense-argibraic-effect/)
