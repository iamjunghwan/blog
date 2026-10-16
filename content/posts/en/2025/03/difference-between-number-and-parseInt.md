---
slug: difference-between-number-and-parseInt
title: "Number & parseInt "
date: 2025-03-24
tags: ["javascript"]
thumbnail: "/uploads/2025/03/difference-between-number-and-parseInt.png"
draft: false
description: "Number evaluates the whole value; parseInt reads character by character and stops at the first invalid one. Which to reach for when converting a numeric string."
---

# A Look at the Difference Between Number and parseInt

* * *

When converting a numeric `string` into a `number`,

I had been picking one of the two at random, so it felt like time to sort this out.

## #What they share

`Number` and `parseInt` are both functions that convert to a number

## #How they behave

`Number` : evaluates the **whole value** of the argument it receives and converts it to a number

                     `parseInt` : **checks the argument one character at a time, converts only up to the last valid integer**, ignores the rest, and returns a number

( forgiving about whitespace, though not about letters )

## #Examples

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
console.log(parseInt("  42"));     // 42 (whitespace allowed)
console.log(parseInt("101", 2));   // 5 (read as binary)
```

🤔 Something I wondered about

In an earlier post I wrote that JavaScript treats a string containing `e` as exponential notation.

Debugging it gives

```javascript
Number('1e5') // 100,000
parseInt('1e5') // 1
```

`Number` checks the entire argument, so the `e` in the string makes it exponential notation.

`parseInt` checks one character at a time, so it treats `e` as a letter and you can see it stops at 1.

So then,

which one should you use to turn a string type like '12345' into a number type?

## #Conclusion

When converting a string that **contains nothing but digits**, `Number` is the better choice.

`parseInt` is better when you need a number even though the string has letters in it, and when you want to **drop everything after the decimal point**.
