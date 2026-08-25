---
slug: Activity-Compoments
title: "Activity Compoments"
date: 2026-03-24
tags: ["react", "javascript"]
draft: false
---

# Activity Compoments

* * *

  

## 배경

현재 사용하는 UI에서 상태(클릭, 스크롤, 키보드 입력 등…)를 유지하고 싶은 상황에서 쉽고 편리하게 사용하고 싶을 때 이 컴포넌트를 사용한다.

  

## 기존의 문제점 ( ex: Modal )

-   모달을 컨트롤 하는 부모 컴포넌트에서 상태관리
    
    ```javascript
    const [inputValue, setInputValue] = useState(''); // 부모가 관리
    ```
    
    -   모달 내부 state가 복잡해질수록 부모 컴포넌트가 비대해진다.
    -   모달 state 변경 시 부모 전체가 리렌더링 된다.
-   css display : none
    
    ```javascript
    <div style={{display: isOpen ? 'block' : 'none'}}>
      <Modal />
    </div>	
    ```
    
    -   React는 css 레벨에서 숨기기 때문에 이 컴포넌트가 살아 있다고 감지 하기 때문에 Effect 문제가 발생
    -   DOM이 없어지는건 아니기 때문에 스크린리더 등 접근성 도구가 숨겨진 모달을 읽는 문제 발생
    -   탭으로 포커스하여 숨겨진 요소로 이동 가능

  

## 동작원리

-   active -> hidden
    -   React는 이 컴포넌트는 화면에 보이지 않기 때문에 아래와 같이 처리 하려고 한다.
        -   React는 Fiber객체에서 사용하는 OffscreenMode type을 이용하여   
            ReactFiberOffscreenComponent.js에서 상태를 관리하고  
            ReactFiberBeginWork.js에서 렌더링을 관리하고  
            ReactFiberCommitWork.js에서 effect 와 DOM을 관리한다.  
              
              
            

1.  DOM display : none
2.  effect cleanup
    1.  예:) setInterval 사용시 클린업 함수에 clearInterval 처리 필요. 하지 않을 경우 CPU, 메모리 낭비
3.  Fiber 유지
4.  낮은 우선순위로 제어
5.  커밋 중단 ( 🔥 중요 🔥 )

  

## 어느 상황에서 사용해야 할까?

-   사용자가 아직 보지 못한 콘텐츠를 처음으로 준비하는데에도 사용한다.
    -   코드 및 데이터를 미리 로드 ( UI로딩시간 단축 )
    -   ※ 렌더링 전 단계에서는 서스펜스 기능이 활성화된 데이터 소스만 가져옵니다
-   사용자 경험이 향상된다.
    -   클릭, 스크롤, 키보드 입력, 동영상, 비디오 등... 사용자가 상호작용 했던 인터렉션을 유지시킨다.
-   페이지의 어떤 부분이 독립적으로 상호 작용할 수 있는지 알려줌으로써 하이드레이션 중에 앱 성능을 향상 시키는데 도움이 된다.

  

## Activity의 핵심

-   Fiber 트리를 메모리에 보존
-   DOM 노드만 분리
-   state는 살아있음

  

## 참고

[https://ko.react.dev/reference/react/Activity](https://ko.react.dev/reference/react/Activity)

[https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberOffscreenComponent.js](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberOffscreenComponent.js)

[https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberBeginWork.js](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberBeginWork.js)

[https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberCommitWork.js](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberCommitWork.js)
