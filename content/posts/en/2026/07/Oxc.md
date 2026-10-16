---
slug: Oxc
title: "Oxc, a New Front-End Linting Setup"
date: 2026-07-09
tags: ["react", "javascript"]
thumbnail: "/uploads/2026/07/Oxc.png"
draft: false
description: "Oxlint and Oxfmt, the Rust-based replacements for ESLint and Prettier. Measured speed on 500 components, plus two rules that caught real problems."
---

# Oxc, a New Front-End Linting Setup

* * *

  

## 1. What is Oxc?

Oxidation Compiler is a collection of high-performance tools for Javascript and Typescript, written in Rust

  

## 2\. Oxlint ( an ESLint-compatible linter )

-   A high-performance linter for Javascript and Typescript built on the Oxc stack
-   50 to 100 times faster than ESLint
-   Usable right away with no separate configuration
-   Runs the high-importance correctness checks first
-   Includes over 835 rules for compatibility with ESLint
-   Turning Oxlint on builds a module graph for the whole project and shares parsing and resolution across rules. This improves checks that depend on cross-file imports while avoiding a performance hit

  

## 3\. Oxfmt ( a Prettier-compatible formatter )

-   A high-performance formatter for the Javascript ecosystem
-   Compatible with Prettier
    -   For specific plugins Oxfmt doesn't support yet, using Prettier is recommended
    -   Oxfmt follows Prettier's Javascript formatting
    -   Passes 100% of Prettier's Javascript and Typescript conformance tests
-   Supported languages
    -   JavaScript, JSX, TypeScript, TSX, JSON, JSONC, JSON5, YAML,
    -   TOML, HTML, Angular, Vue, Svelte, CSS, SCSS, Less, Markdown
    -   MDX, GraphQL, Ember, Handlebars, and more
-   About 30 times faster than Prettier and about 2 times faster than Biome

  

## 4\. ESLint & Oxlint and Prettier & Oxfmt compared

-   To compare speed I created a project, generated 500 arbitrary components, and wrote unused variables inside them as the test
-   Pnpm time:eslint -> 2.470s
    
-   Pnpm time:oxlint  ->  0.551s
    
-   Pnpm time:pitter -> 0.969s
    
-   Pnpm time:oxfmt -> 0.398s  
    

ESLint

![](/uploads/2026/07/eslint.webp)  

Oxlint

![](/uploads/2026/07/oxlint.webp)

  

### 4-1. Use cases

#### 4-1-1. **A case where Oxlint + eslint-plugin-react-hooks rules caught an actual runtime error up front ( forced infinite rendering )**

With the arrival of the React Compiler, **new rules were added to eslint-plugin-react-hooks**

**Notably**

```javascript
set-state-in-render
set-state-in-effect
immutability
purity
static-components
refs
```

are new.

<table style="border-collapse: collapse; width: 99.9582%; height: 210.694px;"><colgroup><col style="width: 50%;"><col style="width: 50%;"></colgroup><tbody><tr style="height: 42.1354px;"><td style="text-align: center;"><p>Rule</p></td><td style="text-align: center;"><p>Description</p></td></tr><tr style="height: 42.1354px;"><td><p>react-hooks-js/set-state-in-render</p></td><td><p>Forbids calling setState during render</p></td></tr><tr style="height: 42.1354px;"><td><p>react-hooks-js/set-state-in-effect</p></td><td><p>Checks for the pattern of calling an unnecessary setState inside useEffect</p></td></tr><tr style="height: 42.1354px;"><td><p>react-hooks-js/immutability</p></td><td><p>Checks the immutability of Props, State, and so on</p></td></tr><tr style="height: 42.1528px;"><td><p>react-hooks-js/purity</p></td><td><p>Checks the purity of render functions</p></td></tr></tbody></table>

  

.oxlintrc.json

```javascript
 "jsPlugins": [
    {
      "name": “add-react-hooks-js“,
      "specifier": "eslint-plugin-react-hooks"
    }
  ],
  "rules": {
    "add-react-hooks-js/set-state-in-render": "error"
  }
```

An example of code that errors

```javascript
function App({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  if (count !== value) {
    setCount(value);
  }

  return <div>{count}</div>;
}
```

  

![](/uploads/2026/07/setState.webp)  

  

To distinguish Javascript plugins from built-in rules, Oxlint attaches an alias to each plugin registered under jsPlugins

Oxlint -> npm -> that's how it pulls in eslint-plugin-react-hooks

  

add-react-hooks-js : an alias the developer picks freely ( changeable )

set-state-in-render : the rule name the plugin provides ( not changeable )

  

  

📍 **Why support javascript plugins?**

-   •**There are thousands of plugins in the ESLint ecosystem. Rebuilding all of them in Rust would take a long time.**
    
-   **So Oxlint was built to let you use built-in rules ( e.g. react ) together with ESLint plugins (Javascript)**

> **Plugins switches on a set of rules already implemented inside Oxlint,**
> 
> **jsPlugins connects an ESLint plugin installed via Npm and gives it an alias to avoid collisions**

**4-1-2.**  A case where it catches performance-risky patterns up front (  oxc/no-accumulating-spread )

It catches the pattern of repeatedly spreading into an accumulator inside a reduce or a loop.

That kind of code copies a new object/array on every iteration, so in the worst case performance degrades to O(n²)

  

oxlintrc.json

```javascript
{ 
	"$schema": "./node_modules/oxlint/configuration_schema.json", 	
     "plugins": ["react", "typescript", "oxc"], 
	"rules": { 
		"oxc/no-accumulating-spread": "error" 
	} 
}
```

  

An example of code that errors

```javascript
type User = {
  id: string;
  name: string;
};

const users: User[] = [
  { id: "1", name: "Hong Gildong" },
  { id: "2", name: "Kim Youngsoo" },
  { id: "3", name: "Lee Jisoo" },
];

export default function App() {
  const userMap = users.reduce<Record<string, User>>((acc, user) => {
    return {
      ...acc,
      [user.id]: user,
    };
  }, {});

  return (
    <div>
      <h1>Oxlint test</h1>
      <pre>{JSON.stringify(userMap, null, 2)}</pre>
    </div>
  );
}
```

  

What Oxlint flags here is the following.

```javascript
return {
  ...acc,
  [user.id]: user,
};
```

This code copies the whole of `acc` every time to build a new object, so performance gets worse as the data grows.

The error

```javascript
oxc/no-accumulating-spread: Avoid spreading accumulator in reduce
```

  

The fix

```javascript
  const userMap = users.reduce<Record<string, User>>((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
```

  

This isn't code that blows up in the browser right away, but it's a case of Oxlint catching a performance-risky pattern ahead of time.

  

## 5\. References

-   [https://oxc.rs/](https://oxc.rs/)
