---
slug: dependabot-alerts
title: "How Many of 84 Dependabot Alerts Actually Put Me at Risk?"
date: 2026-10-29
tags: ["npm"]
thumbnail: "/uploads/2026/10/dependabot-alerts.png"
draft: false
description: "42 of them were High. I read the CVE numbers, traced where the packages came from, then searched the deployed output. Not one of the 15 packages was in it."
---

# How Many of 84 Dependabot Alerts Actually Put Me at Risk?

---

One day the Security tab on my repository showed **84**. Dependabot alerts alone came to 91.

```text
Prototype Pollution via parse() in NodeJS flatted          High  Transitive
minimatch has a ReDoS via repeated wildcards               High  Transitive
source-map-js allows event-loop denial of service          High  Transitive
SVGO: removeScripts allows executable links                High  Transitive
nanoid: custom generators can loop indefinitely            High  Transitive
```

42 of them `High`. It feels like something needs doing right now.

But every one says **`Transitive`**. Not a single package I installed myself.

So I asked — **how many of these reach the people visiting my site?**
Answering that meant working through what the alerts **mean**, **where they came
from**, and whether they **survive into my site**, in that order.

## 1. Start by reading the numbers on the alert

Open an alert and there's a number like `CVE-2026-33228` attached. Being able to
read that is what makes "42 High" mean anything.

**CVE (Common Vulnerabilities and Exposures) is a unique number assigned to a
publicly disclosed security flaw.** If one tool calls something "the flatted bug"
and another calls it "prototype pollution," you can't line them up — so the whole
point is **one agreed-upon label**. MITRE runs it and the US CISA funds it. Since
2016 the CVE Board has set its direction.

MITRE isn't the only one handing out numbers. Organizations approved as a
**CNA (CVE Numbering Authority)** issue them directly within their own scope.
GitHub is a CNA.

### Why there are several numbers

Here's what the `flatted` alert in my repository actually looks like.

```text
Prototype Pollution via parse() in NodeJS flatted
  CVE-2026-33228          ← the label everyone shares
  GHSA-rf6f-7fwh-wjgh     ← the GitHub Advisory Database's own label
  CWE-915, CWE-1321       ← "what kind of flaw is this" classification
  affected: <=3.4.1  →  patched: >=3.4.2
```

**Three numbers, one flaw.** They do different jobs.

| | What it is | Example |
|---|---|---|
| CVE | A unique label for one individual flaw | `CVE-2026-33228` |
| GHSA | GitHub's label, fitted to package ecosystems. Records affected and patched versions alongside | `GHSA-rf6f-7fwh-wjgh` |
| CWE | Classifies the flaw's **type**. Same number means the same kind of mistake | `CWE-1321` = prototype pollution |
| CVSS | A severity **score** (0–10) | `7.5` |

A GHSA sometimes appears before a CVE does, and sometimes a GHSA exists with no
CVE at all.

### How High gets decided

This is the important part. Look at a different `flatted` alert.

```text
flatted vulnerable to unbounded recursion DoS in parse() revive phase
  CVE-2026-32141
  CVSS 7.5   CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H
```

The 7.5 is computed from the **vector** that follows it. Spelled out:

| Symbol | Meaning | Value |
|---|---|---|
| `AV:N` | Attack vector | **Network** — reachable remotely |
| `AC:L` | Complexity | Low |
| `PR:N` | Privileges required | None |
| `UI:N` | User interaction | Not needed |
| `C:N` `I:N` `A:H` | Impact | No confidentiality or integrity impact, **availability only**, high |

So it reads "anyone can remotely bring the service down without much effort," and
most of that 7.5 comes from **`AV:N` — that it's reachable over a network**.

**But in my case flatted is not exposed to any network.** It runs only when
eslint writes `.eslintcache` on my laptop. The situation the vector assumes
simply doesn't exist here.

A CVSS score is assigned by assuming **the worst environment the flaw could be
used in**. It isn't a score fitted to mine.

### Sometimes there's no score at all

The prototype pollution alert from earlier comes out like this.

```json
{ "severity": "high", "cvss": { "score": 0, "vectorString": null } }
```

**No CVSS score, yet the severity is `high`.** Either it hasn't been scored yet,
or not enough information has been gathered to score it. GitHub still assigns a
grade on its own judgment. The `High` label is sometimes a calculation and
sometimes a call someone made.

Once you've read this far, "42 High" stops being **"42 dangers"** and becomes
**"42 things worth checking."** So let's check. Starting with where they came from.

## 2. Trace where they came from

I used `pnpm why` to find the parents.

| Alerted package | What this package does | How it got pulled in |
|---|---|---|
| `flatted` | Serializes and deserializes objects containing circular references as JSON | `eslint` → `file-entry-cache` → `flat-cache` |
| `minimatch` | Glob pattern matching | `@eslint/eslintrc` |
| `source-map-js` | Generates and reads source maps | `tailwindcss` → `postcss` |
| `svgo` | SVG optimization | `@svgr/webpack` → `@svgr/plugin-svgo` |
| `nanoid` | Generates short, URL-safe unique IDs | `tailwindcss` → `postcss` |

There's a reason I split those two columns. At first I wrote "`flatted` — lint
cache" in a single column, but that is **not what flatted does; it's what eslint
uses flatted for**. flatted itself is a JSON parser that handles circular
references, and it got dragged in by way of `flat-cache` because eslint needs
that capability when writing `.eslintcache` to disk.

That distinction matters when reading alerts. **"Do I use that capability"** and
**"is that package in my tree"** are different questions, and Dependabot only
knows the second one.

Either way, everything doing the pulling is a **build tool**. None of it was
installed directly.

Up to here it's inference. It needs checking.

## 3. Search the output yourself

This blog builds with `output: "export"`. When it finishes, `out/` holds nothing
but HTML, CSS, and JS — the tools are gone. **So count whether any of them
survived.**

```js
const files = walk("out");          // 97 files, 608KB of JS
const blob = files.map(f => fs.readFileSync(f, "utf8")).join("\n");

for (const pkg of probes) {
  const n = blob.split(pkg).length - 1;
  console.log(pkg, n > 0 ? `⚠ ${n} hits` : "none");
}
```

The result.

```text
flatted           none
minimatch         none
source-map-js     none
svgo              none
nanoid            none
brace-expansion   none
js-yaml           none
picomatch         none
browserslist      none
@babel/           none
tailwindcss       none
postcss           none
undici            none
cheerio           none
eslint            ⚠ 40 hits
```

Fourteen of fifteen leave no trace at all. But `eslint` turned up 40 hits.

### What those 40 hits were

```text
003cstrong>Oxlint + eslint-plugin-react-hooks 규...
03ca href="#2.-oxlint-(-eslint-호환-린터-)"...
3eA case where Oxlint + eslint-plugin-react-hooks rules...
```

It was **the word "eslint" written in my own posts.** I have a post about Oxc.

Not one line of package code. **Fifteen of fifteen are absent from the output.**

## 4. So is Dependabot wrong?

No. **It's answering a different question.**

Dependabot counts "packages named in your lock file that have a CVE." What I want
to know is "does any risk reach someone opening my site." Those are two different
questions.

```text
What Dependabot looks at   pnpm-lock.yaml   ← everything used to build
What I wanted to know      out/             ← what visitors receive
```

On a static site that gap is especially wide. There's no server, so the only code
running at runtime is browser JS, and build tools run only on my laptop and in
CI. Even if `svgo` is vulnerable to ReDoS, svgo only runs **while I'm building,
processing my own SVGs.**

> To exploit svgo an attacker would need to get a malicious SVG into my build.
> If that's possible, the svgo version stopped being the problem a while ago.

It's no surprise Dependabot can't make this distinction. It doesn't know how I
deploy.

## 5. So do nothing, then?

Bumping versions to clear the alerts mostly isn't possible. They're transitive
dependencies, so **you can't touch them until the parent bumps them.** If
`eslint` requires an old `flatted`, there's nothing I can do.

I could force it with `pnpm overrides`. But what that buys is **a number that
never represented real exposure**, and what it costs is the risk of breaking the
tooling. That's not a good trade.

So I asked something else instead. **Do I actually need this tool?**

### @svgr/webpack — 117 packages for 4 icons

`@svgr/webpack` lets you import SVGs as React components. It carries babel and
svgo along with it, whole.

```bash
$ ls node_modules/.pnpm | grep -cE "^@svgr|^@babel|^svgo|^css-tree|^csso"
117
```

Then I counted where it was actually used.

```bash
$ grep -rn "\.svg\"" app components --include=*.tsx
components/Button/MenuToggleButton.tsx:5:   import MenuToggle from ".../MenuToggle.svg";
components/Button/Theme.tsx:5:              import DarkMode from ".../darkMode.svg";
components/Button/Theme.tsx:6:              import LightMode from ".../lightMode.svg";
components/Search/components/Search.tsx:9:  import SearchIcon from ".../search.svg";
```

**Four places.** A hamburger menu, a magnifier, and two theme toggles.

Opening the files, every one was a path or two.

```html
<svg viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
  <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
</svg>
```

That's little enough to write by hand.

### Why `<img>` doesn't work

My first move was to switch to `<img src="/search.svg">`. It doesn't work.

The reason is the `stroke="currentColor"` in the code above. These icons have to
**follow the text color** — black in light mode, white in dark. Put them in an
`<img>` and the outer CSS can't reach inside, so the color is frozen.

So I moved them to JSX.

```tsx
export default function MenuToggleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}
```

It passes `React.SVGProps` straight through, so the call sites don't change.

```tsx
<MenuToggleIcon className="w-6 h-6" />
```

## 6. The result

```bash
$ pnpm remove @svgr/webpack
```

I deleted the loader configuration in `next.config.ts` along with it. The config
file went from 22 lines to 4.

| | Before | After |
|---|---:|---:|
| Installed packages | 592 | **429** |
| `@svgr`/`@babel`/`svgo` family | 117 | **0** |
| Vulnerabilities (`pnpm audit`) | 92 | **83** |
| Output JS | 608KB | 609KB |

**163 packages gone.** Installs get faster, the lock file shrinks, and the supply
chain surface I have to think about shrinks with it.

Output JS grew by 1KB. svgr was inlining the same SVGs anyway, so almost nothing
changed. **I did by hand what the tool was doing; the result is the same.**

## An honest conclusion

**The alerts only dropped by 9.** From 92 to 83.

The remaining 83 are the `eslint` and `tailwindcss`/`postcss` chains, and they
can't be removed without dropping those tools. And there's no reason to drop
them — I actually use them.

So calling this work "fixed a security problem" would be an overstatement. More
precisely:

- **There was never any exposure.** Confirming that took a 20-line script
- **What I reduced wasn't alerts, it was 163 dependencies.** That's the real gain
- **The remaining alerts stay.** Driving the number to zero isn't the goal

Dependabot's number is **a signal to read**, not **a list to clear**. Rather than
piling up `overrides` to turn 84 into 0, it's better to trace once where the 84
came from. Tracing it turned up, in my case, **a place where I could drop a tool
entirely.**

## References

- [CVE Program](https://www.cve.org/) — the numbering scheme and the CNA system
- [CWE — flaw type classification](https://cwe.mitre.org/)
- [CVSS v3.1 specification — FIRST](https://www.first.org/cvss/v3.1/specification-document) — what the vector symbols mean
- [About the GitHub Advisory Database](https://docs.github.com/en/code-security/security-advisories/working-with-global-security-advisories-from-the-github-advisory-database/about-the-github-advisory-database) — how GHSA differs from CVE
- [Dependabot alerts — GitHub Docs](https://docs.github.com/en/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)
- [pnpm why](https://pnpm.io/cli/why) — tracing why a package is installed
- [pnpm overrides](https://pnpm.io/settings#overrides) — for forcing transitive dependency versions
- [@svgr/webpack](https://react-svgr.com/docs/webpack/)
- [Static Exports — Next.js](https://nextjs.org/docs/app/guides/static-exports)
