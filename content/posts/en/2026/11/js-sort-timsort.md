---
slug: js-sort-timsort
title: "How Does JavaScript sort() Actually Sort?"
description: "How Array.prototype.sort works: the spec's rules, the runs, minrun, and merges of V8's TimSort, and the recent switch to PowerSort, explained with playing cards."
date: 2026-11-20
tags: ["javascript"]
thumbnail: "/uploads/2026/11/js-sort-timsort.png"
draft: true
---

# How Does JavaScript sort() Actually Sort?

---

I got curious about what actually happens inside JavaScript's `sort`, so I dug in.

Run `[10, 9, 1].sort()` and you get `[1, 10, 9]`. It sorted the values as strings,
not as numbers.

This blog's code has a comment about sorting, too. It sits above
`byDateDescThenSlugThenLang`, the compare function that orders posts by date.

```ts
/**
 * Newest date first; if equal, by slug; if still equal, by language.
 * ...
 * Without checking lang, compare(a,b) and compare(b,a) would both be 1,
 * breaking the comparator contract, and the result would depend on the
 * algorithm's internals.
 */
```

If I publish the Korean and English versions of the same slug on the same day, the
date and slug are both equal. Without comparing the language too, the result
**"depends on the algorithm's internals."** I wrote that comment without knowing
what those internals actually were.

This post follows them. It starts from the rules `sort` must obey (the spec), looks
at insertion sort and merge sort through a card analogy, and walks through the
TimSort that V8 used for years, one step at a time. At the end, it covers PowerSort,
which V8 switched to recently.

## 1. What the Spec Defines and What It Doesn't

The ECMAScript spec **does not say which algorithm `sort` must use.** It only says
sorting is done through "a sequence of calls to the comparator in an
implementation-defined order." Instead, it defines rules the result must follow.

Condensed, the spec's steps look like this.

```text
arr.sort(compare)
  1. If compare is neither undefined nor a function, throw TypeError
  2. Collect values from 0 to length-1. Skip holes
  3. Sort the collected values (the order and number of comparisons is up to the implementation)
  4. Write them back from the start, then delete the rest so the number of holes stays the same
```

The spec also defines how two values are compared.

- If both are `undefined`, they are equal. If only one is, it goes to the end.
  This check happens before the compare function is called. So **the compare
  function never receives `undefined`.**
- If there is a compare function, it is called and the result is converted to a
  number. `NaN` counts as 0 (equal).
- If there is no compare function, both values are converted to strings and
  compared. According to MDN, this compares UTF-16 code unit order.

There are three more rules.

- **The sort must be stable.** Values that compare equal keep their original order.
  MDN says this has been required since ES2019, and V8's docs say Chrome 70 supports it.
- `undefined` goes to the end, and holes go after that.
- If the compare function is inconsistent, the sort order is
  **implementation-defined**. Engines are allowed to differ.

Here is what I got when I ran these locally.

| Code                                                   | Result                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| `[10, 9, 1].sort()`                                    | `[1, 10, 9]`                                                |
| `["b", "a", "B"].sort()`                               | `["B", "a", "b"]` (uppercase before lowercase)              |
| `[3, undefined, , 1].sort()`                           | `[1, 3, undefined, <1 empty item>]`                         |
| `[1, 2].sort("x")`                                     | TypeError                                                   |
| `["a2", "b1", "c2", "d1"].sort((x, y) => x[1] - y[1])` | `["b1", "d1", "a2", "c2"]` (equal digits keep their order)  |
| `const a = [2, 1]; a.sort() === a`                     | `true` (it sorts `a` itself and returns it, not a new array) |

`toSorted` is the counterpart that leaves the original alone. The spec gives it the
same sorting rules. The differences are what it returns and how it treats holes.

|                        | `sort`                              | `toSorted`                                        |
| ---------------------- | ----------------------------------- | ------------------------------------------------- |
| Original array         | Modified                            | Left unchanged                                    |
| Return value           | The original array itself           | A new array                                       |
| `[3, 1, 2]`            | The original becomes `[1, 2, 3]`    | Original stays `[3, 1, 2]`, new array `[1, 2, 3]` |
| `[3, undefined, , 1]`  | `[1, 3, undefined, <1 empty item>]` | `[1, 3, undefined, undefined]`                    |
| Non-function argument  | TypeError                           | TypeError                                         |

Holes are where they part ways. `sort` leaves holes empty at the end, while
`toSorted` reads them as `undefined` and fills them in.

So there are rules, but no method. The engine picks the method. Before looking at
it, let's look at the two basic tools of sorting.

## 2. Two Sorts, Explained with Cards

### Insertion Sort — Cards in Your Hand

This is how you arrange a hand in a card game. The cards in your hand are always in
order. When you get a new card, you scan from the right end toward the left to find
where it goes.

```text
Hand: 3 7 9     New card: 5

3 7 9 ← 5     smaller than 9 → move one left
3 7 ← 5 9     smaller than 7 → move one left
3 ← 5 7 9     larger than 3  → here
3 5 7 9
```

That is insertion sort. You take cards one at a time and repeat this.

It has one important property. **If the new card is already in order, you look
once and you're done.** If it is larger than the rightmost card, it just stays there.

And when it meets an equal number, it goes to the right of it. The card you got
first stays on the left. So insertion sort is stable.

### Merge Sort — Combining Two Sorted Piles

Now you have two piles that are already sorted. Compare only the top card of each
pile and take the smaller one. Repeat, and you end up with one sorted pile.

```text
Pile A: 1 4 6      Pile B: 2 3 8

1 vs 2 → take 1    Result: 1
4 vs 2 → take 2    Result: 1 2
4 vs 3 → take 3    Result: 1 2 3
4 vs 8 → take 4    Result: 1 2 3 4
6 vs 8 → take 6    Result: 1 2 3 4 6
A is empty         Result: 1 2 3 4 6 8   (append the rest of B as is)
```

Merging two piles takes fewer comparisons than there are cards. Each comparison
sends one card to the result.

Merge sort builds on this. It splits the cards in half, then in half again, until
every pile has one card. A one-card pile is already sorted. Then it merges them two
at a time.

```text
Split    5 1 4 8 2 7 3 6
         5 1 4 8 | 2 7 3 6
         5 1 | 4 8 | 2 7 | 3 6
         5|1|4|8|2|7|3|6          ← one card each. Merging starts here

Merge    1 5 | 4 8 | 2 7 | 3 6
         1 4 5 8 | 2 3 6 7
         1 2 3 4 5 6 7 8
```

When the two top cards are equal, take the one from the left pile (the one that
came first). That keeps equal values in their original order. Merge sort can be
made stable, too.

## 3. The Time Complexity of Sorting

Explanations of sorting algorithms always mention `n log n`. You can count it
straight from the pictures above.

**Merge sort.** Splitting 8 cards in half until each pile has one card takes 3
splits: 8 → 4 → 2 → 1. That "how many halvings until you reach 1" is `log2 n`. For
1,000 cards, it is about 10.

At each level, the cards being merged add up to n. Each level compares roughly n
cards once. So the total number of comparisons is about this.

```text
log2 n levels  ×  about n per level  =  about n log2 n
```

Whether the input is already sorted or shuffled, the comparison count stays on the
order of n log2 n. A sorted input does not bring it down to n.

**Insertion sort.** The worst case is when the cards arrive in reverse. Every new
card has to travel all the way to the left. The second card takes 1 comparison, the
third takes 2, … the nth takes n-1.

```text
1 + 2 + … + (n-1)  =  n(n-1)/2   → proportional to n²
```

A random input goes about halfway on average, so it is still proportional to n².
On the other hand, an already sorted input takes one comparison per card, n-1 in
total.

The difference is clear in numbers. These are calculated from the formulas.

| n         | Merge sort ~n log2 n  | Insertion worst n(n-1)/2 | Insertion best n-1 |
| --------- | --------------------- | ------------------------ | ------------------ |
| 10        | 33                    | 45                       | 9                  |
| 100       | 664                   | 4,950                    | 99                 |
| 1,000     | 9,966                 | 499,500                  | 999                |
| 1,000,000 | about 20 million         | about 500 billion           | 999,999            |

Two things stand out.

- **For large n, merge sort wins by a landslide.** At a million items, it is 20
  million versus 500 billion.
- **For small n or nearly sorted input, insertion sort is as good or better.** At
  10 items the gap is just 33 versus 45, and on sorted input insertion sort makes
  the fewest comparisons of all.

So what if you combined the two? That is TimSort.

## 4. V8 Used TimSort

According to the V8 blog post "Getting things sorted in V8," before V8 7.0
(Chrome 70) `Array.prototype.sort` was based on Quicksort, and short arrays or
subarrays under length 10 were handled with insertion sort. V8's stable sort page
says stable sorting has been supported since Chrome 70.

Starting with 7.0, V8 switched to TimSort. The new implementation was written in
Torque, a language specific to V8. The V8 blog describes Torque as "a
domain-specific language with TypeScript-like syntax."

Here is the big picture. According to the V8 blog, it collects the values that are
not `undefined` into a temporary list, sorts it, and writes the result back to the
array.

```text
arr.sort(cmp)
  ├─ collect the non-undefined values into a temporary list
  ├─ sort the temporary list with TimSort
  └─ write back to the array (sorted values → undefined → holes)
```

TimSort is an algorithm Tim Peters designed for CPython. His design notes,
`listsort.txt`, live in the CPython repository. The core idea fits in one line:
**real-world data often has sorted stretches already, so find them and reuse them
when merging.**

This is where the two sorts each take the job they are good at. Insertion sort
sorts short stretches, and merge sort combines sorted stretches. From here we go
through the process in order: find sorted stretches (section 5), lengthen the short
ones (section 6), decide when to merge (section 7), and actually merge (section 8).

V8 used TimSort from 7.0 and recently switched to PowerSort. Sections 4–9 describe
TimSort. The local Node 24 (V8 13.6) also uses TimSort. PowerSort comes in
section 10.

## 5. Finding Runs (Already Sorted Stretches)

The merge sort in section 2 split the cards down to single cards before merging,
because a one-card pile is already sorted. But if the input already contains
several cards in a row that are in order, there is no need to split them. That
chunk can be used as one pile as is.

TimSort calls these already sorted stretches **runs**. It finds them by comparing
values two at a time from the front.

- If ascending order (left <= right) continues, it is an ascending run. Equal values count as ascending.
- If **[strictly descending order (left > right)](#why-strictly-descending-only)** continues, it is a descending run. It gets reversed once found.
- The run ends where the direction breaks.

An already sorted stretch becomes a single run no matter how long it is. If all
1,000 items are sorted, there is only one run.

### Why Strictly Descending Only

A descending stretch is ascending when read backward. So when TimSort finds one, it
reverses it and uses it as an ascending run.

But reversing has a catch. If equal values are mixed in, their order gets reversed
too. Let's label two 2s by the order they arrived: 2a and 2b.

```text
3 2a 2b 1   reverse the whole thing → 1 2b 2a 3   (2a and 2b swap places)
```

As we saw, `sort` must keep equal values in their original order (stable sort). So
V8 continues a descending run only while the left value is strictly greater than
the right, and cuts the run as soon as an equal value appears.

```text
3 2a 2b 1   → cut at [3 2a] → reversing it moves only one 2, so the order is safe
```

**It only reverses stretches with no equal values, so reversing is safe.**

### Sorted Input Takes n-1 Comparisons

I counted how many times the compare function was called locally. These are from a
single run.

| n = 1,000 | Comparisons | Note                                        |
| --------- | ----------- | ------------------------------------------- |
| Sorted    | 999         | One run. Same as insertion sort's best case |
| Reversed  | 999         | One strictly descending run, reversed       |
| Random    | 8,656       | n log2 n is about 9,966                     |

The reversed array was detected as one strictly descending run, so it was reversed
and that was it. Both sorted and reversed input took n-1 comparisons.

A plain merge sort can't do that. When I wrote a merge sort that splits in half and
merges, and counted with the same n=1,000, it took 4,932 comparisons on sorted
input, 5,044 on reversed input, and 8,697 on random input. It always splits and
merges the same way, even when the input is already sorted, so the count barely
drops. It is still on the order of n log n.

TimSort does less work the more sorted the input already is. A sort whose amount of
work changes with the state of its input like this is called an **adaptive sort**.

## 6. Lengthening Short Runs: minrun

On sorted input, runs are long. But on shuffled input, runs can be cut short. Short
runs mean more runs, and more runs mean more merge calls.

So TimSort sets a minimum run length. That value is **minrun**. If a run is shorter
than minrun, TimSort uses insertion sort to pull in the following values until the
run reaches minrun. If a sorted stretch is longer than minrun, it is not cut, as we
saw earlier. So a run is **at least** minrun long.

### Why Insertion Sort?

Why use insertion sort to lengthen short runs? Starting from the table in section
3, it comes down to this.

- **For small n, the gap is small.** At 10 items, it is 33 versus 45. Insertion
  sort works in place without extra memory, and has no split-and-merge step.
- **It is strong on nearly sorted data.** If the job is appending a few values to an
  already sorted run, insertion sort barely compares anything.
- **It is stable.** When it meets an equal value, it just inserts after it.

TimSort uses binary insertion here. It is the insertion sort from section 2, but it
finds the insertion point with binary search instead of scanning one slot at a
time. That cuts the number of comparisons. Shifting values one slot over to make
room still costs the same.

This trade-off pays off especially well in JavaScript. Under the spec, one
comparison means one call to the user's compare function. A move is a memory copy
inside the engine. **It cuts the expensive part, comparisons, and keeps the cheap
part, moves.**

### How Big Is minrun? — The Experiment

According to `listsort.txt`, Tim Peters measured random data while varying minrun.

| minrun          | Result                                                |
| --------------- | ----------------------------------------------------- |
| Around 8        | Bad. Function calls increase                          |
| 16, 32, 64, 128 | About equally good                                    |
| Around 256      | Bad. Data movement in binary insertion grows too much |

If minrun is too small, there are more runs and more merge calls. If it is too
large, insertion sort's movement cost (the n² from section 3) grows. What the
experiment shows is that **anything between 16 and 128 works about the same**. At
first, 32 was picked from that range as a fixed value.

### How Big Is minrun? — The Formula

Later, instead of a fixed value, TimSort started computing minrun from the array
length n.

```text
Shift n right one bit at a time (= divide by 2) until it is below 64
If any of the bits shifted out was 1, add 1
```

The result is the **top 6 bits** of n, plus 1 if any of the remaining bits is 1.
That is how the old `listsort.txt` (CPython 3.9) describes it, and
`ComputeMinRunLength` in V8's TimSort-era source does the same thing. Inside
`while (n >= 64)`, it collects the shifted-out bits with `r = r | (n & 1)` and
returns `n + r`.

Here is the calculation for a few values of n.

```text
n = 1000   1000 → 500 → 250 → 125 → 62     125 is odd, so a 1 was dropped → 62 + 1 = 63
n = 2048   2048 → … → 64 → 32               all dropped bits were 0         → 32
n = 2112   2112 → … → 66 → 33               all dropped bits were 0         → 33
```

| n     | minrun        | Number of runs (if every run is minrun long) |
| ----- | ------------- | -------------------------------------------- |
| 1,000 | 63            | 16 (15 of length 63 + 1 of length 55)        |
| 2,048 | 32            | 64                                           |
| 2,112 | 33            | 64                                           |
| 63    | 63 (n itself) | 1 (insertion sort only)                      |

When n is 64 or more, minrun always lands between 32 and 64. And **the number of
runs comes out as a power of two or slightly below one**: 16, 64, 64.

Why a power of two? `listsort.txt` explains that when the number of runs is a power
of two, the merges are perfectly balanced. Runs of equal length are paired and
merged, then those results are merged again, and so on.

A fixed minrun can break that balance. `listsort.txt` uses n=2112 as an example.
Working it out: with minrun fixed at 32, there are 66 runs. After 64 of them merge
into 2,048, merging with the leftover runs means merging pieces of very different
sizes. Using 33 from the formula gives exactly 64 runs, which stay balanced all the
way through.

That is where the 32–64 range comes from. The formula uses the top 6 bits of n to
bring the number of runs to a power of two. Six bits with the top bit set give
32–63, and adding 1 makes it 32–64. **The experiment says "anywhere around here is
fine," and the formula picks the exact value within it.**

### Short Arrays Use Only Insertion Sort

As in the last row of the table above, when n is below 64, minrun is n itself. In
the original TimSort (CPython), an array shorter than 64 is not split into runs.
The whole array is handled by a single binary insertion sort. As the table in
section 3 shows, insertion sort is enough for small n.

V8's TimSort-era source does the same. `ComputeMinRunLength` returns n as is when
n is below 64. Since minrun equals the array length, the whole array becomes one
run and is finished with insertion sort.

Today's V8 uses a different threshold. The current main branch has
`kMaxInlineSortLength = 16` in `src/objects/js-array.h`, and `array-sort.tq` handles
only arrays shorter than that with a single binary insertion sort. This constant
did not exist in the TimSort-era commit.

| Array length                                 | What happens                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Short (TimSort: under 64 / current V8: under 16) | One binary insertion sort and done                                        |
| Long                                         | Find runs, extend short runs to minrun (32–64) with insertion, then merge     |

## 7. When to Merge Runs: The Stack Rules

Once runs are found and extended, it is time to merge. TimSort does not merge each
run as soon as it finds it. It pushes the runs onto a stack, like placing card piles
on top of each other. When the lengths on the stack break a rule, it merges. When it
reaches the end of the array, it merges everything left on the stack.

Call the top three runs on the stack A, B, and C from the bottom up. The TimSort-era
`listsort.txt` (CPython 3.9) gives two rules.

```text
|A| > |B| + |C|
|B| > |C|
```

When these hold, run lengths grow quickly toward the bottom of the stack. That keeps
the stack short and makes runs of similar length merge together. It is the same
"balanced merging" from section 6, enforced through the order of stacking. In V8's
TimSort-era source, the comment on `RunInvariantEstablished` also says it checks
`run_length(n - 2) > run_length(n - 1) + run_length(n)`.

### The 2015 Bug

In 2015, de Gouw et al. found a bug in these rules. Their paper was titled
"OpenJDK's java.utils.Collection.sort() is broken." According to an ERCIM News
article, the problem was this.

- The implementation assumed that checking **only the top three runs** would keep
  the whole stack in line with the rules.
- That assumption was wrong. With an input crafted to produce many short runs, the
  rules break further down the stack, and the stack grows larger than expected.
- In Java, it overflowed the preallocated stack and threw
  `ArrayIndexOutOfBoundsException`. Python, Java, and Android were affected.
- The fix was to check the top four runs instead of three.

V8 appears to have used the fixed version from the start. In the TimSort-era commit
I checked (`ae348e30`), `MergeCollapse` checks the rules on **up to four runs**, not
just the top three. I could not confirm, though, that this commit matches the code
released in 7.0 exactly. And today's V8 no longer uses these rules at all.

## 8. How Runs Are Merged

This is where it gets deeper. TimSort trims the "compare the top cards and take the
smaller one" from section 2 in a few ways. The principles are in `listsort.txt`,
and V8's implementation follows the same structure.

### Trimming in Advance

Say we are merging two runs, A = `1 5 6 7` and B = `2 3 8 9`.

```text
A = 1 5 6 7      B = 2 3 8 9

Where does B's first value 2 go in A?  → after 1.   A's 1 is already in place
Where does A's last value 7 go in B?   → before 8.  B's 8 9 are already in place

Actually merge:  [5 6 7] + [2 3]
```

Before merging, binary search trims the parts at both ends that are "already in
place." Merging 8 values shrinks to merging 5. The less the two runs overlap, the
more gets trimmed.

### Temporary Space Only for the Shorter Run

To merge two runs, some values have to be moved aside temporarily. `listsort.txt`
explains that **temporary space the size of the shorter run** is enough.

- If A is shorter, move A aside and fill from the left (`merge_lo`).
- If B is shorter, move B aside and fill from the right (`merge_hi`).

In the example above, the trimmed B (`[2 3]`) is shorter. B goes into temporary
space, and the larger values are placed from the right end.

```text
           Array                     Temp
Start      1 [5 6 7 · ·] 8 9        [2 3]     · = open slot
7 > 3      1 [5 6 · · 7] 8 9        [2 3]
6 > 3      1 [5 · · 6 7] 8 9        [2 3]
5 > 3      1 [· · 5 6 7] 8 9        [2 3]
A empty    1 [2 3 5 6 7] 8 9                  copy temp over as is
```

Two slots of temporary space were enough. That uses less memory than a plain merge
sort, which allocates extra space as large as the whole array.

### On Ties, Left Goes First

When values from the two runs are equal, the value from the earlier run (A) ends up
first in the result. When filling from the left, it takes A's value first; when
filling from the right, it places B's value at the back first. The direction differs,
but the result is the same: **the value that came first stays first.** It is the
same stability principle from section 2.

The left-to-right merge in V8's TimSort-era source (`MergeLow`) is written that way.
It emits B's value first **only when the comparison is negative**. If it is 0
(equal), A's value goes out.

### Galloping — Skip Ahead When One Side Keeps Winning

Sometimes values from one run keep winning in a row. Here is an extreme example. The
two runs have to overlap; if they didn't, "trimming in advance" would cut everything
and leave nothing to merge.

```text
A: 1 50 51 … 89          B: 2 3 4 … 41

Trim        only A's 1 is in place. Left: [50 … 89] + [2 … 41]
Normal      2<50, 3<50, 4<50 …       one comparison per value. 40 in total
Galloping   once B wins 7 times in a row, switch modes
            find where 50 goes in B
            by jumping 1, 3, 7, 15 … slots to bracket a range
            then binary search within it   → copy the rest of B in one go
```

According to `listsort.txt`, it switches to this mode once one side wins
`MIN_GALLOP` times in a row. That value is 7. V8's source also has
`const kMinGallopWins: constexpr int31 = 7;`.

The 7 is not fixed. During a sort, a value called `min_gallop` starts from it and
moves up and down. On data where galloping works well, the threshold drops so it
kicks in sooner; where it doesn't, the threshold rises so it is used less.

## 9. Ten Cards from Start to Finish

Now we have seen all the terms. Let's follow ten cards, `[5 6 7 1 2 9 8 3 4 0]`, from
start to finish.

Real TimSort finishes an array this short with a single binary insertion sort
(section 6). To show the flow, we will **assume minrun is 4**.

```text
Input   5 6 7 1 2 9 8 3 4 0          (assume minrun = 4)

① Find run   [5 6 7] 1 …            5<=6<=7, breaks at 7>1. Length 3
   Extend     [1 5 6 7]              binary-insert the next value 1 to reach 4
   Stack      [4]

② Find run   … [2 9] 8 …            2<=9, breaks at 9>8. Length 2
   Extend     [2 8 9] → [2 3 8 9]    binary-insert 8, then 3
   Stack      [4, 4]                 4 > 4 is false → rule broken
   Merge      [1 5 6 7] + [2 3 8 9] → [1 2 3 5 6 7 8 9]
   Stack      [8]

③ Find run   … [4 0]                4>0, strictly descending. Length 2
   Reverse    [0 4]
   Extend     no values left, so leave it
   Stack      [8, 2]                 8 > 2 → rule holds

④ End        merge everything left on the stack
   Merge      [1 2 3 5 6 7 8 9] + [0 4] → [0 1 2 3 4 5 6 7 8 9]
```

Each step uses something we covered earlier.

- In ① and ②, the runs were cut short at 3 and 2. Both fell short of minrun 4, so
  they were extended with binary insertion.
- In ②, the moment the stack became `[4, 4]`, `|B| > |C|` (4 > 4) broke and the runs
  were merged. In ③, `[8, 2]` follows the rule, so it was stacked as is.
- The merge in ② is the example from section 8. Trimming leaves only
  `[5 6 7] + [2 3]`, and the shorter B goes to temporary space and is filled from the
  right (`merge_hi`).
- In ③, `[4 0]` was strictly descending, so it was reversed.

## 10. And Then PowerSort

That was the TimSort V8 used starting with 7.0. It changed recently.

According to the Node.js blog post "Notable V8 changes from Node.js 26 to 27
(Alpha)," V8 now uses PowerSort instead of TimSort for `Array.prototype.sort()` on
large arrays. The post compares V8 14.6 in Node 26 with V8 15.6 in the Node 27
alpha. The top of `array-sort.tq` on V8's current main branch also now says it
"implements a stable, adaptive merge sort variant called PowerSort."

The change (CL 7742184) landed on V8 main in April 2026. I could not confirm which
V8 version first shipped it. "Large arrays" appears to mean arrays longer than
`kMaxInlineSortLength` (16) from section 6, since shorter arrays are still finished
with a single binary insertion sort.

Here is what stayed the same and what changed, based on the current V8 source and
the Node blog.

|                                   | TimSort (V8 7.0+)                           | PowerSort (current V8)                                 |
| --------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| Finding runs                      | Ascending, strictly descending              | Same                                                   |
| Extending short runs              | Binary insertion sort                       | Same                                                   |
| Array length for insertion only   | Under 64                                    | Under 16 (`kMaxInlineSortLength`)                      |
| Reverse only strictly descending  | Yes                                         | Same                                                   |
| Galloping threshold               | 7                                           | Same (`kMinGallopWins = 7`)                            |
| minrun range                      | 32–64                                       | Same (a `dcheck` asserts 32–64)                        |
| Stable sort                       | Yes                                         | Same                                                   |
| Merge order rule                  | Compare lengths of top runs (section 7)     | Compute a power value per run and compare              |
| minrun                            | Computed once from array length             | Computed per run (port of CPython's `minrun_next()`)   |
| Compare function call order/count | Baseline                                    | May differ                                             |

In the current source, `MergeCollapse`, `RunInvariantEstablished`, and
`ComputeMinRunLength` are gone. In their place is a loop that computes a power value
with `NodePower` and merges when the run lower on the stack has a larger power. The
stack rules from section 7, the very spot where the 2015 bug lived, were replaced
wholesale. This post does not cover how the power value is computed.

minrun changed too. A comment in the current source says it ports CPython's
`minrun_next()`. According to the latest `listsort.txt`, CPython now also picks a
different minrun per run (Stefan Pochmann's approach) and uses the powersort merge
strategy. It is a more precise way to reach the goal from section 6: bringing the
number of runs to a power of two.

The results stay the same. The Node blog also says sorting is still stable and gives
the same result with a consistent compare function. What changes is **the order and
number of compare function calls**. In the post's example, for an array of length
2,000, the call count went from 19,220 in Node 26 to 19,249 in Node 27. So it warns
that tests that record compare calls, or compare functions with side effects, may
behave differently.

The same post claims PowerSort is faster on adversarial inputs. It also says sorting
small arrays got faster, but links that separately to a different change that
inlines `sort` into the optimizing compilers (Maglev, Turbofan), not to PowerSort.
Neither claim comes with published numbers, and neither is an independent benchmark.

## 11. What to Remember in Practice

### `(a, b) => a > b` Is Not a Compare Function

This function returns `true` or `false`. Converted to a number as the spec says,
that is 1 or 0. **It never returns a negative number.** Even when a is smaller than
b, it answers "equal" (0).

```text
compare(1, 2) → false → 0   "equal"
compare(2, 1) → true  → 1   "2 goes after"
```

`compare(a, b)` and `compare(b, a)` do not agree. This is the "inconsistent compare
function" from section 1, and the result is implementation-defined.

Locally, I passed this function to
`[0, 7, 14, 1, 8, 15, 2, 9, 16, 3, 10, 17, 4, 11, 18, 5, 12, 19, 6, 13]`. **The input
came back unchanged.** Nothing was sorted at all. Passing `(a, b) => a - b` sorts it
from 0 to 19.

MDN gives a similar example (`(a, b) => (a > b ? 1 : 0)`). According to MDN, V8 and
JavaScriptCore return the array without sorting it, while SpiderMonkey sorts it in
ascending order. **It depends on the engine.** Code that happens to sort correctly in
one environment is not correct code.

### A Compare Function Must Return Three Kinds of Values

- Negative if the first goes first, positive if the second goes first, 0 if equal
- For numbers, `(a, b) => a - b`
- With multiple criteria, **keep breaking ties down to the last one.** That is why
  `byDateDescThenSlugThenLang` from the intro goes from date to slug to language. If
  the last criterion is equal, the two posts should truly be the same.

### Don't Rely on Call Order or Count

As section 10 showed, when V8 switched algorithms, the order and number of compare
calls changed, even though the results stayed the same. Code that logs or mutates
state inside a compare function, and tests that count calls, can break when you
upgrade the engine.

### Use `toSorted` When the Original Must Stay

`sort` changes the array in place and returns the same array. When the original has
to stay as is, such as sorting an array held in state to display it, use `toSorted`.

## Summary

After following `sort` inside, the comment from the intro reads differently. "The
result would depend on the algorithm's internals" was no exaggeration. With an
inconsistent compare function, which value gets compared with which, and in what
order, decides the result. That order depends on where runs are cut and which runs
are merged first. And those rules have changed across V8 versions.

On the other hand, with a consistent compare function, you don't need to know the
internals. The spec guarantees stability and the result, and the result stays the
same even after the move from TimSort to PowerSort.

Here is what to check when you use `sort`.

| Check                                      | Why                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Did you pass a compare function?           | Without one, values are compared as strings. `[10, 9, 1]` becomes `[1, 10, 9]` |
| Does it return negative, 0, and positive?  | Returning true/false like `(a, b) => a > b` may leave the array unsorted     |
| Is there a next criterion for ties?        | 0 should mean "these two values are truly equal"                             |
| Is it OK to modify the original array?     | If not, use `toSorted`                                                       |
| Does the compare function avoid side effects? | Call order and count change when the engine changes                       |

Of these, one matters most. When your compare function returns 0, **are those two
values really equal?** If they aren't and it still returns 0, you have left the
result up to the engine.

## References

- [Getting things sorted in V8](https://v8.dev/blog/array-sort) — TimSort in V8 7.0 (Chrome 70), the previous Quicksort + insertion sort (length 10) implementation, Torque
- [Stable Array.prototype.sort](https://v8.dev/features/stable-sort) — the stable sort requirement (ES2019) and Chrome 70 support
- [ECMAScript spec — Indexed Collections](https://tc39.es/ecma262/multipage/indexed-collections.html) — `sort`, `toSorted`, `SortIndexedProperties`, `CompareArrayElements`
- [MDN — Array.prototype.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) — stability, `undefined` and holes, UTF-16 comparison, engine-specific results with inconsistent compare functions
- [Node.js — Notable V8 changes from Node.js 26 to 27 (Alpha)](https://nodejs.org/en/blog/announcements/notable-v8-changes-from-node-js-26-to-27-alpha) — V8's switch to PowerSort and the compare call count example
- [V8 `array-sort.tq` (main, PowerSort)](https://chromium.googlesource.com/v8/v8/+/refs/heads/main/third_party/v8/builtins/array-sort.tq) — the current implementation. `NodePower`, `kMinGallopWins`, minrun calculation
- [V8 `array-sort.tq` (TimSort era, ae348e30)](https://chromium.googlesource.com/v8/v8/+/ae348e30ed6a88382b31645515a959509ede6462/third_party/v8/builtins/array-sort.tq) — `ComputeMinRunLength`, `RunInvariantEstablished`, `MergeCollapse`
- [CPython `listsort.txt` (main)](https://github.com/python/cpython/blob/main/Objects/listsort.txt) — Tim Peters's TimSort design notes. minrun experiments, galloping, merge memory, the switch to powersort
- [CPython `listsort.txt` (3.9)](https://github.com/python/cpython/blob/v3.9.0/Objects/listsort.txt) — the TimSort-era version. The two stack rules, top-6-bit minrun calculation
- [V8 `js-array.h` (main)](https://chromium.googlesource.com/v8/v8/+/refs/heads/main/src/objects/js-array.h) — `kMaxInlineSortLength = 16`
- [de Gouw et al., "OpenJDK's java.utils.Collection.sort() is broken" (CAV 2015)](https://rd.springer.com/chapter/10.1007/978-3-319-21690-4_16) — the paper on the stack rule bug
- [ERCIM News — Fixing the sorting algorithm for Android, Java and Python](https://ercim-news.ercim.eu/en102/r-i/fixing-the-sorting-algorithm-for-android-java-and-python) — a summary of the bug's cause and fix
