---
slug: Object-Map
title: "Why Should You Use Map Instead of Object?"
date: 2025-09-16
tags: ["javascript"]
thumbnail: "/uploads/2025/09/Object-Map.png"
draft: false
description: "Integer keys on an Object get sorted ascending whether you want it or not. Key ordering, iteration, and speed compared between Object and Map."
---

# Why Should You Use Map Instead of Object?

* * *

## Background

Object and Map are both data structures for storing key-value pairs, and some parts confused me, so I'm sorting it out here.

  

## Differences in key order

1\. When using integer keys

integer keys -> sorted in ascending order

```javascript
1-1. Object
    const obj = {};
    obj[100] = 'a';
    obj[2] = 'b';
    obj[7] = 'c';
    
    console.log(Object.keys(obj)); // ['2', '7', '100'] ← order flipped
```

```javascript
 1-2. Map
    const map = new Map();
    map.set(100, 'a');
    map.set(2, 'b');
    map.set(7, 'c');
    
    console.log([...map.keys()]); // [100, 2, 7] ← kept as is
```

  

📌 Note

But why does it get sorted in ascending order?

When a key is an integer, it's given special treatment so it can be used 'like an array.'

-   In js an array is ultimately an object too, so array access like arr\[0\] works internally as obj\['0'\]
-   Integer keys were deliberately designed to be sorted ascending so they behave like an array

```javascript
const obj = {2: 'two', 1: 'one'};
console.log(Object.keys(obj)); // ['1', '2']
```

  

  

2\. When using string keys

string keys (not integers) -> insertion order is preserved  

```javascript
   2-1. Object
    const obj2 = {};
    obj2['banana'] = 1;
    obj2['apple'] = 2;
    obj2['cherry'] = 3;
    
    console.log(Object.keys(obj2)); // ['banana', 'apple', 'cherry'] ← order preserved, apparently?
```

```javascript
 2-2. Map
    const map2 = new Map();
    map2.set('banana', 1);
    map2.set('apple', 2);
    map2.set('cherry', 3);
    
    console.log([...map2.keys()]); // ['banana', 'apple', 'cherry']
```

  

3\. When using a mix of numeric and string keys

```javascript
3-1. Object
    const obj3 = {};
    obj3['3'] = 'three';
    obj3['b'] = 'bee';
    obj3['1'] = 'one';
    obj3['a'] = 'ay';

 console.log(Object.keys(obj3)); // ['1', '3', 'b', 'a'] ← integers sorted first
```

```javascript
 3-2. Map
    const map3 = new Map();
    map3.set('3', 'three');
    map3.set('b', 'bee');
    map3.set('1', 'one');
    map3.set('a', 'ay');
    
    console.log([...map3.keys()]); // ['3', 'b', '1', 'a'] ← insertion order intact
```

  

  

## Differences in iteration

1\. Object ( not iterable )

```javascript
  const obj = {};
    obj[100] = 'a';
    obj[2] = 'b';
    obj[7] = 'c';
   
    // enumerating the object's keys with for...in (not iteration)
    for (const key in obj) {
      console.log(key); // 2,7,100 
    }
        
    // looping over key-value pairs
    Object.entries(obj) // [['2','b'],['7','c'],['100','a']]
    // looping over keys only
    Object.keys(obj);   // ['2','7','100']    
    // looping over values only
    Object.values(obj); // ['a','b','c']
```

  

2\. Map ( iterable )

```javascript
const map = new Map();
    map.set(100, 'a');
    map.set(2, 'b');
    map.set(7, 'c');

    for (const [key, value] of map) {
      console.log(key, value);
    }    
    // 100 'a'
    //  2  'b'
    //  7  'c'
        
    map.forEach((value,key,array)=>{
        console.log(value,key,array);
    });
    // a 100 Map(3) {100 => 'a', 2 => 'b', 7 => 'c'}
    // b 2   Map(3) {100 => 'a', 2 => 'b', 7 => 'c'}
    // c 7   Map(3) {100 => 'a', 2 => 'b', 7 => 'c'}
```

  

📌 Note

When iterating an array with forEach, Array.prototype.forEach() has the shape arr.forEach((element,index,array)=>{}),  

whereas Map is different — Map.prototype.forEach() has the shape map.forEach((value,key,map)=>{}).  

  

## Differences in speed

```javascript
const N = 100,000;
const keys = Array.from({ length: N }, (_, i) => `key${i}`);

const obj = {};
keys.forEach((key, i) => {
  obj[key] = i;
});
keys.forEach((key) => {
  const val = obj[key];
});

const map = new Map();
keys.forEach((key, i) => {
  map.set(key, i);
});
keys.forEach((key) => {
  const val = map.get(key);
});
```

  

<table style="border-collapse: collapse; width: 100.012%; height: 73.6458px;"><colgroup><col style="width: 25.044%;"><col style="width: 25.044%;"><col style="width: 25.044%;"><col style="width: 24.9312%;"></colgroup><tbody><tr style="height: 24.5486px;"><td style="text-align: center;">Test</td><td style="text-align: center;">Throughput (ops/s)</td><td style="text-align: center;">Margin of error</td><td style="text-align: center;">Result</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">Map</td><td style="text-align: center;">67 ops/s</td><td style="text-align: center;">±5.72%</td><td style="text-align: center;">✅ Fastest (baseline)</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">Object</td><td style="text-align: center;">61 ops/s</td><td style="text-align: center;">±6.4%</td><td style="text-align: center;">🔻 about 10.25% slower</td></tr></tbody></table>

  

<table style="border-collapse: collapse; width: 99.7442%; height: 122.743px;"><colgroup><col style="width: 50.13%;"><col style="width: 49.8194%;"></colgroup><tbody><tr style="height: 24.5486px;"><td style="text-align: center;">Item</td><td style="text-align: center;">Meaning</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">ops/s</td><td style="text-align: center;">operations per second; the bigger the number, the faster</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">± percent</td><td style="text-align: center;">statistical margin of error</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">X% slower</td><td style="text-align: center;">how many % slower than the fastest test</td></tr><tr style="height: 24.5486px;"><td style="text-align: center;">Fastest</td><td style="text-align: center;">means this test recorded the fastest performance</td></tr></tbody></table>

  

📌 Note

Running the same code several times on JSBench.me gives slightly different numbers each time, but the conclusion is the same: Map comes out a little faster.

  

## References

[https://tc39.es/ecma262/#sec-array.prototype.foreach](https://tc39.es/ecma262/#sec-array.prototype.foreach)

[https://tc39.es/ecma262/#sec-map.prototype.foreach](https://tc39.es/ecma262/#sec-map.prototype.foreach)

[https://jsbench.me/](https://jsbench.me/)
