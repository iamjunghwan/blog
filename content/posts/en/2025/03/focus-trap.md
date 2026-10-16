---
slug: focus-trap
title: "Focus Trap 🙊"
date: 2025-03-13
tags: ["react", "javascript"]
thumbnail: "/uploads/2025/03/focus-trap.png"
draft: false
description: "Keeping keyboard focus inside an open modal. A React implementation of Tab and Shift+Tab cycling, plus the IME composition bug that duplicated the last Korean character."
---

# **Focus Trap 🙊**

* * *

Searching around turns up an explanation like this.

**Trapping keyboard focus so that it cannot escape a modal component while it is open — out to the elements behind the modal rather than the modal itself — is called a focus trap**.

In a browser, if you keep pressing Tab, the Tab key's reach extends from the input areas of the page behind it all the way to the devtools panel ( when devtools is open ).

That can make for a poor user experience.

So what we want is

1\. When the modal opens, Tab is only valid within the modal (on reaching the last focusable element, tab and focus wrap to the first)

2\. Pressing Tab + Shift moves to the previous Tab element (on reaching the first focusable element, tab and focus wrap to the last)

## #Let's implement it.

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
    // handle Korean input
    if (e.isComposing || e.key === "Backspace") {
      return;
    }

    wrapHandleTab(e);
    wrapHandleShiftTab(e);
  };

  const handleBeforeUnload = (event) => {
    const message = "Your changes have not been saved. Do you really want to leave?";
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
        <h2>Modal window</h2>

        <input
          type="text"
          placeholder="Type here"
          onClick={handleOnClick}
          tabIndex={0}
        />
        <textarea
          placeholder="Enter text here"
          onClick={handleOnClick}
          tabIndex={1}
        />
        <input
          type="text"
          placeholder="Type here"
          onClick={handleOnClick}
          tabIndex={2}
        />
        <input
          type="text"
          placeholder="Type here"
          onClick={handleOnClick}
          tabIndex={3}
        />

        <button onClick={onClose} tabIndex={-1}>
          Save
        </button>
        <button onClick={onClose} tabIndex={-1}>
          Cancel
        </button>
        <button disabled onClick={onClose} tabIndex={-1}>
          Save draft
        </button>
      </div>
    </div>
  );
};
export default FocusTrapModal;
```

Now, typing English into a field and pressing Tab works fine,

but typing Korean and pressing Tab produced a situation where the last character was copied and duplicated into the next field after the Tab.

When that happens, you can block it with

```javascript
if(e.isComposing){
   return;
}
```

Searching around, the reason is that Korean, unlike English, is made up of consonants and vowels.

While you type those consonants and vowels, the IME (Input Method Editor) puts you in the `` `isComposing` `` state, which indicates that input is still in progress (characters are being composed).
