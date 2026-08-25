---
slug: Oxc
title: "새로운 프론트엔드 린팅 환경 Oxc "
date: 2026-07-09
tags: ["react", "javascript"]
draft: false
---

# 새로운 프론트엔드 린팅 환경 Oxc

* * *

  

## 1.Oxc란?

Oxidation Compiler는 Rust로 작성된 Javascript 및 Typescript용 고성능 도구 모음

  

## 2\. Oxlint ( ESLint 호환 린터 )

-   Oxc 스택을 기반으로 구축된 Javascript 및 Typescript용 고성능 린터
-   ESLint 보다 50 ~ 100배 빠름
-   별도의 설정 없이 바로 사용 가능
-   중요도가 높은 정확성 검사를 우선적으로 수행
-   ESLint와의 호환을 위해 835개 이상의 규칙을 포함
-   Oxlint를 활성화하면 프로젝트 전체 모듈 그래프를 구축하고 규칙 전반에 걸쳐 구문 분석 및 해석을 공유. 이를 통해 파일 간 가져오기에 의존하는 검사 기능이 향상, 성능 저하 현상 방지

  

## 3\. Oxfmt ( Prettier 호환 포맷터 )

-   Javascript 생태계를 위한 고성능 포맷터
-   Prettier과 호환 가능
    -   Oxfmt에서 아직 지원하지 않는 특정 플러그인은 Prettier 사용 권고
    -   Oxfmt는 Prettier의 Javascript 서식을 따름
    -   Prettier의 Javascript 및 Typescript 적합성 테스트 100% 통과
-   지원되는 언어
    -   JavaScript, JSX, TypeScript, TSX, JSON, JSONC, JSON5, YAML,
    -   TOML, HTML, Angular, Vue, Svelte, CSS, SCSS, Less, Markdown
    -   MDX, GraphQL, Ember, Handlebars 등을 지원
-   Prettier 보다 약 30배, Biome보다 약 2배 빠름

  

## 4\. ESLint & Oxlint 와 Prettier & Oxfmt 비교

-   속도를 비교하기 위해 프로젝트를 하나 생성 후 컴포넌트를 임의로 500개 생성하여 내부에 사용하지 않는 변수를 작성하여 테스트
-   Pnpm time:eslint -> 2.470초
    
-   Pnpm time:oxlint  ->  0.551초
    
-   Pnpm time:pitter -> 0.969초
    
-   Pnpm time:oxfmt -> 0.398초  
    

ESLint

![](/uploads/2026/07/eslint.webp)  

Oxlint

![](/uploads/2026/07/oxlint.webp)

  

### 4-1. 사용 사례

#### 4-1-1. **Oxlint + eslint-plugin-react-hooks 규칙이 실제 런타임 에러를 사전에 잡아주는 사례 ( 강제 무한 렌더링 )**

React Compliter가 나오면서 **eslint-plugin-react-hooks에 새로운 규칙들이 추가됨**

**대표적으로**

```javascript
set-state-in-render
set-state-in-effect
immutability
purity
static-components
refs
```

이 새로 생김

<table style="border-collapse: collapse; width: 99.9582%; height: 210.694px;"><colgroup><col style="width: 50%;"><col style="width: 50%;"></colgroup><tbody><tr style="height: 42.1354px;"><td style="text-align: center;"><p>규칙</p></td><td style="text-align: center;"><p>설명</p></td></tr><tr style="height: 42.1354px;"><td><p>react-hooks-js/set-state-in-render</p></td><td><p>렌더링 중 setState 호출 금지</p></td></tr><tr style="height: 42.1354px;"><td><p>react-hooks-js/set-state-in-effect</p></td><td><p>불필요한 setState를 useEffect에서 호출하는 패턴 검사</p></td></tr><tr style="height: 42.1354px;"><td><p>react-hooks-js/immutability</p></td><td><p>Props, State 등의 불변성 검사</p></td></tr><tr style="height: 42.1528px;"><td><p>react-hooks-js/purity</p></td><td><p>렌더. 함수의 순수성 검사</p></td></tr></tbody></table>

  

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

에러 나는 코드 예시

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

  

Oxlint는 Javscript 플러그인과 내장 규칙을 구분하기 위해 jsPlugins로 등록한 플러그인에 별칭을 붙임

Oxlint -> npm -> eslint-plugin-react-hooks를 가져오는 방식

  

add-react-hooks-js : 개발자가 마음대로 정할 수 있는 별칭 ( 변경 가능 )

set-state-in-render : 플러그인에서 제공하는 규칙 이름 ( 변경 불가 )

  

  

📍 **javascript Plugin을 지원 하는 이유?**

-   •**ESlint 생태계에는 수천 개의 플러그인이 존재한다. 이 플러그인들을 Rust로 다시 만드는 건 시간이 많이 걸린다.**
    
-   **그래서 Oxlint는 내장규칙 ( ex: react ) + ESLint Plugin(Javascript)를 함께 사용할 수 있게 만든 것**

> **Plugins는 Oxlint안에 이미 구현되어 있는 규칙 집합을 사용할 수 있게 켜는 것,**
> 
> **jsPlugins는 Npm으로 설치한 ESLint Plugin을 연결하면서 충돌을 피하기 위해 별칭을 부여**

**4-1-2.**  성능상 위험한 패턴을 미리 잡아주는 사례 (  oxc/no-accumulating-spread )

reduce나 반복문 안에서 누적값에 spread를 계속 쓰는 패턴을 잡아줌.

이런 코드는 매 반복마다 새 객체/배열을 복사해서 최악의 경우 성능이 O(n²)까지 나빠질 수 있음

  

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

  

에러 나는 코드 예시

```javascript
type User = {
  id: string;
  name: string;
};

const users: User[] = [
  { id: "1", name: "홍길동" },
  { id: "2", name: "김영수" },
  { id: "3", name: "이지수" },
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
      <h1>Oxlint 테스트</h1>
      <pre>{JSON.stringify(userMap, null, 2)}</pre>
    </div>
  );
}
```

  

여기서 Oxlint가 잡는 부분은 아래와 같다.

```javascript
return {
  ...acc,
  [user.id]: user,
};
```

이 코드는 매번 `acc` 전체를 복사해서 새 객체를 만들기 때문에 데이터가 많아질수록 성능이 나빠짐.

애러 코드

```javascript
oxc/no-accumulating-spread: Avoid spreading accumulator in reduce
```

  

수정 코드

```javascript
  const userMap = users.reduce<Record<string, User>>((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
```

  

이는 브라우저에서 바로 에러가 터지는 코드는 아니지만, Oxlint가 성능상 위험한 패턴을 미리 잡아주는 사례.

  

## 5\. 참고

-   [https://oxc.rs/](https://oxc.rs/)
