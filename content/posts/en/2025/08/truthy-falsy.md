---
slug: truthy-falsy
title: "Why Does JS Have the Concepts of truthy and falsy?"
date: 2025-08-29
tags: ["javascript"]
thumbnail: "/uploads/2025/08/truthy-falsy.png"
draft: false
description: "JavaScript lets non-boolean values act like true/false in conditions. What truthy and falsy actually are, how the engine evaluates them, and the six falsy values."
---

# Why Does JS Have the Concepts of truthy and falsy?

* * *

## Background

The boolean data type in JS has the logical values true and false,

so what exactly are truthy and falsy?

Aren't they just about the same as true and false? That vague idea was all I had while using them.

  

## Definition

A feature of JS that lets every non-boolean value be used flexibly, like true/false, inside a condition

  

## How It Works

In conditions and logical operators ( `||` , `&&` , `!` ), the JS engine implicitly converts the value to a Boolean and evaluates whether it is truthy or falsy.

  

## Comparison

```javascript
Say we want to count the fruits in an array and store the counts in an Object. This works.

const arr = ["apple", "banana", "apple", "orange", "banana", "apple"]
const result = {};
arr.forEach((val)=>{
    if(!result[val]){	 // no fruit key inside result yet, so !undefined is true
        result[val] = 0;
    };
    result[val] += 1; // from then on, +1 each time the key comes up
});
```

  

```javascript
Applying the concepts of truthy and falsy, this works too.

const arr = ["apple", "banana", "apple", "orange", "banana", "apple"]
const result = {};
arr.forEach((val)=>{
    result1[val] = ( result1[val] || 0 ) + 1;
});
```

  

## The falsy values ( six of them, worth memorizing )

-   false
-   0
-   ""
-   Null
-   Undefined
-   NaN  
      
      
    

## So why does JS have the concepts of truthy and falsy?🤔

Because it makes code shorter (and more intuitive) and more flexible. It's useful when you want to check quickly whether a value exists and is valid.  
  

## References

-   [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Boolean?utm\_source=chatgpt.com](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean?utm_source=chatgpt.com)  
    
-   [https://ko.javascript.info/logical-operators](https://ko.javascript.info/logical-operators)
