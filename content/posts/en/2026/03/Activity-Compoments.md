---
slug: Activity-Compoments
title: "Activity Compoments"
date: 2026-03-24
tags: ["react", "javascript"]
thumbnail: "/uploads/2026/03/Activity-Compoments.png"
draft: false
description: "Keeping UI state alive while hiding it. What was wrong with lifting state up or display:none, and how React's Activity keeps the Fiber tree in memory instead."
---

# Activity Compoments

* * *

  

## Background

You use this component when you want an easy, convenient way to preserve the state of the UI you're on (clicks, scroll position, keyboard input, and so on).

  

## Problems with the old approaches ( ex: Modal )

-   Managing state in the parent component that controls the modal
    
    ```javascript
    const [inputValue, setInputValue] = useState(''); // the parent manages it
    ```
    
    -   The more complex the modal's internal state gets, the more bloated the parent component becomes.
    -   Changing the modal's state re-renders the entire parent.
-   css display : none
    
    ```javascript
    <div style={{display: isOpen ? 'block' : 'none'}}>
      <Modal />
    </div>	
    ```
    
    -   React hides it at the css level, so it still considers the component alive, which causes Effect problems
    -   The DOM isn't gone, so accessibility tools such as screen readers end up reading the hidden modal
    -   You can tab into the hidden elements

  

## How it works

-   active -> hidden
    -   Since this component is no longer visible on screen, React tries to handle it as follows.
        -   Using the OffscreenMode type from the Fiber object, React   
            manages state in ReactFiberOffscreenComponent.js,  
            manages rendering in ReactFiberBeginWork.js,  
            and manages effects and the DOM in ReactFiberCommitWork.js.  
              
              
            

1.  DOM display : none
2.  effect cleanup
    1.  e.g.) when using setInterval, the cleanup function needs to clearInterval. Skip it and you waste CPU and memory
3.  Fiber is kept
4.  Controlled at a lower priority
5.  Commit is suspended ( 🔥 important 🔥 )

  

## When should you use it?

-   It's also used to prepare content the user hasn't seen yet, ahead of time.
    -   Preloading code and data ( shortening UI load time )
    -   ※ Before the render phase, only data sources with Suspense enabled are fetched
-   The user experience improves.
    -   Clicks, scrolling, keyboard input, video, and so on — the interactions the user has already made are preserved.
-   By signaling which parts of the page can interact independently, it helps improve app performance during hydration.

  

## The heart of Activity

-   The Fiber tree is preserved in memory
-   Only the DOM nodes are detached
-   State stays alive

  

## References

[https://react.dev/reference/react/Activity](https://react.dev/reference/react/Activity)

[https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberOffscreenComponent.js](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberOffscreenComponent.js)

[https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberBeginWork.js](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberBeginWork.js)

[https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberCommitWork.js](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberCommitWork.js)
