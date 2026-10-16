---
slug: JavaScript-String-Index-notation
title: "A String Containing 'e' Is Read as Exponential Notation"
date: 2025-03-10
tags: ["javascript"]
thumbnail: "/uploads/2025/03/JavaScript-String-Index-notation.png"
draft: false
description: "When JavaScript converts a string to a number, an 'e' in the string makes it exponential notation. '1e5' becomes 100,000."
---

# A String Containing e Is Read as Exponential Notation

* * *

When JavaScript handles numbers and strings together,

a string containing **`e`** is recognized as **exponential notation**.

```javascript
    let str = '1e5';
    let num = 100000;

    str == num  => true

    str === num => false

    isNaN(str)  => false
  
```

`'1e5'` is 1 \* 10 *^5*

*which is read as 100,000.*

***In exponential notation, `e` means***

**"ten to the power of"**.

*JavaScript converts it to the number 100,000 without being asked.*

```javascript
    let str = 'test1e5';

    isNaN(str)  => true
  
```

*As shown here,*

*an ordinary string that merely contains an `e`*

*is not automatically converted to exponential notation.*

  

*Conclusion*

*When converting a string containing `e` into a number,*

*check whether the string actually fits the exponential notation format!!!*
