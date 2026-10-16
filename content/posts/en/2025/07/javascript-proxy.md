---
slug: javascript-proxy
title: "Getting to Know Proxy"
date: 2025-07-01
tags: ["javascript"]
thumbnail: "/uploads/2025/07/javascript-proxy.png"
draft: false
description: "JS objects are easy to add to, delete from, and modify. Proxy is how you intercept and redefine those basic operations, with trap methods and the rules they must follow."
---

# Getting to Know Proxy

* * *

## Background

Because JS is a flexible (dynamic) language, you can add, delete, and modify the properties inside an object with ease. But when building a complex application, that flexibility is something you need to keep in check.

  

## Definition

Proxy… I feel like I've heard that in an infrastructure context….? 

Searching around,

the dictionary sense is "acting on behalf of,"

and from a computer networking perspective,

it refers to a server or piece of software that relays communication between a client and a server.

So in the end it acts on behalf of something. Let's take a look.

MDN defines it as

The Proxy object enables you to create a proxy for another object, which can intercept and redefine fundamental operations for that object.

  

## Checking it out

```javascript
type Obj = {
  name: string;
  age: number;
  job: string;
  NumberArr: number[];
  _private: string;
};

const obj = {
    name: "kim",
    age: 20,
    job: "developer",
    NumberArr: [1, 2, 3, 4, 5],
    _private: "private",
  };

const proxyObj = new Proxy(obj, {
    get(target, prop: keyof Obj) {
      if (prop in target) {
        return target[prop];
      }
      return "not found property";
    },
    set(target, prop: keyof Obj, value: any) {
      if (prop === "age" && typeof value === "number") {
        target[prop] = value;
      } else {
        console.log("The age is not an integer");
      }
      return true;
    },
    ownKeys(target) {
      return Object.keys(target).filter((key) => !key.startsWith("_"));
    },
  });


  console.log(proxyObj.name);   //kim
  console.log(proxyObj.weight);  // not found property

  proxyObj.age = 22;
  console.log(proxyObj.age);  //22

  proxyObj.age = "age";
  console.log(proxyObj.age);  // The age is not an integer

  console.log(Object.keys(proxyObj));     // ['name', 'age', 'job', 'NumberArr'] -> _private excluded
  console.log(Object.values(proxyObj));  // ['kim', 22, 'developer', Array(5)]  ->  "private" excluded
 
```

  

## Trap methods

-   *Get :* reading a property
-   *Set :* modifying a property
-   *Has :* called when the *in* operator is used
    -   checking membership in a given range
-   *deleteProperty :* called when the *delete* operator is used
-   *Apply :* when a function is called
-   *Construct :* when the *new* operator is called  
    

  

## Rules you must follow

-   When modifying a property value <em>(set)</em>, you must return *true*; otherwise return *false*
-   When deleting a property value <em>(delete)</em>, you must return *true*; otherwise return *false*  
    

  

## Thinking about where to use it

-   Validating that an object's property values meet a condition, and imposing specific rules
-   Caching an object's property values to avoid duplicate computation
-    Logging and controlling access *or* changes to an object's properties

  

## References

-   [*https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Proxy*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
-   [*https://ko.javascript.info/proxy*](https://ko.javascript.info/proxy)
