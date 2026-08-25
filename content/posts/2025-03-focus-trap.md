---
slug: focus-trap
title: "Focus Trap 🙊"
date: 2025-03-13
tags: ["react", "javascript"]
draft: false
---

# **포커스 트랩 (Focus Trap) 🙊**

* * *

구글링 해보면 아래와 같은 설명을 보여준다.

**모달 컴포넌트가 열린 상태에서 키보드 포커스가 모달 외부(모달 컴포넌트가 아닌 모달 뒤의 요소들)로 빠져나가지 못하도록 가두는 것을 포커스 트랩이라고 부릅니다**.

브라우저에서 Tab 키를 계속 누르면 바깥쪽 페이지 input 영역 ~ ( 개발자 도구를 연 상태에서 )개발자 도구 영역까지 Tab 키의 영향이 가게된다.

이는 사용자 경험을 안좋게 할 수 있다.

그러면

1\. 모달창이 띄워지면 모달 내에서만 Tab 유효 (마지막 keyin요소에 다달으면 첫 요소로 탭&포커스)

2\. Tab + Shift를 누르게 되면 이전 Tab의 요소로 움직이기 (첫 keyin요소에 다달으면 마지막 요소로 탭&포커스)

## #구현 해보자.

```javascript
const FocusTrapModal = ({ isOpen, onClose }) => {
  const focusTrapArea = useRef(null);
  const focusPossibleEles = useRef([]);
  const currFocusIdx = useRef(0);

  const handleTab = () => {
    const currHtml = focusPossibleEles.current[currFocusIdx.current + 1];
    if (currHtml !== undefined) {
      currHtml.focus();
      currFocusIdx.current++;
      return;
    }
    focusPossibleEles.current[0].focus();
    currFocusIdx.current = 0;
  };

  const wrapHandleTab = (e) => {
    if (!e.shiftKey && e.key === "Tab") {
      e.preventDefault();
      handleTab();
    }
  };

  const handleShiftTab = () => {
    const currenthtml = focusPossibleEles.current[currFocusIdx.current - 1];
    if (currenthtml !== undefined) {
      currenthtml.focus();
      currFocusIdx.current--;
      return;
    }
    focusPossibleEles.current.at(-1).focus();
    currFocusIdx.current = focusPossibleEles.current.length - 1;
  };

  const wrapHandleShiftTab = (e) => {
    if (e.shiftKey && e.key === "Tab") {
      e.preventDefault();
      handleShiftTab();
    }
  };

  const preventKeyDown = (e) => {
    // 한글 제어
    if (e.isComposing || e.key === "Backspace") {
      return;
    }

    wrapHandleTab(e);
    wrapHandleShiftTab(e);
  };

  const handleBeforeUnload = (event) => {
    const message = "변경사항이 저장되지 않았습니다. 정말 떠나시겠습니까?";
    event.returnValue = message;
    return message;
  };

  useEffect(
    function functionAnjunghwan() {
      if (isOpen) {
        focusPossibleEles.current = Array.from(
          focusTrapArea.current.children
        ).filter((val) => val.tabIndex >= 0 && val.disabled !== true);

        focusPossibleEles.current[0].focus();
        focusTrapArea.current.addEventListener("keydown", preventKeyDown);

        window.addEventListener("beforeunload", handleBeforeUnload);
      }
      return () => {
        if (focusTrapArea.current) {
          focusTrapArea.current.removeEventListener("keydown", preventKeyDown);
        }
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    },
    [isOpen]
  );

  const handleOnClick = (e) => {
    e.preventDefault();
    currFocusIdx.current = e.target.tabIndex;
    focusPossibleEles.current[e.target.tabIndex].focus();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" ref={focusTrapArea}>
        <button className="close-btn" onClick={onClose} tabIndex={-1}>
          X
        </button>
        <h2>모달 창</h2>

        <input
          type="text"
          placeholder="여기에 입력"
          onClick={handleOnClick}
          tabIndex={0}
        />
        <textarea
          placeholder="여기에 텍스트 입력"
          onClick={handleOnClick}
          tabIndex={1}
        />
        <input
          type="text"
          placeholder="여기에 입력"
          onClick={handleOnClick}
          tabIndex={2}
        />
        <input
          type="text"
          placeholder="여기에 입력"
          onClick={handleOnClick}
          tabIndex={3}
        />

        <button onClick={onClose} tabIndex={-1}>
          저장
        </button>
        <button onClick={onClose} tabIndex={-1}>
          취소
        </button>
        <button disabled onClick={onClose} tabIndex={-1}>
          임시저장
        </button>
      </div>
    </div>
  );
};
export default FocusTrapModal;
```

그런데 keyin 요소에 영어를 keyin하고 Tab하면 잘되는데

한글을 keyin하고 Tab하면 마지막 글자가 복사되어 Tab이후에 다음 keyin요소에 복제되는 상황이 생겼다.

이러한 문제가 발생했을때는

```javascript
if(e.isComposing){
   return;
}
```

으로 막아주면 된다.

구글링 해보면

한글은 영어와 달리 자음,모음으로 이루어져 있기 때문이라고 한다.

자음,모음을 입력할 때 IME(Input Method Editor)가 입력중(문자 조합 중)임을 나타내는 `` `isComposing` ``상태가 된다고 한다.
