---
slug: tsc-incremental-type-check
title: "TypeScript 증분 검사 deep dive"
date: 2026-11-06
tags: ["typescript"]
thumbnail: "/uploads/2026/11/tsc-incremental-type-check.png"
---

# TypeScript 증분 검사 deep dive

---

React + Vite로 만든 프로젝트를 로컬에서 수동으로 빌드하며 작업하던 중이었다.
빌드할 때마다 **약 48초**가 걸렸다. 한두 번이면 그냥 기다렸을 텐데 작업하는
내내 반복되니 그러기 어려웠다. 그래서 이 48초를 뜯어보기로 했다.

먼저 눈에 띈 건 느리다는 것보다 **늘 똑같다**는 점이었다.

```text
고친 줄  1줄     →  빌드 48초
고친 줄  400줄   →  빌드 48초
고친 줄  0줄     →  빌드 48초
```

고친 양과 걸리는 시간이 아무 상관이 없었다. **매번 처음부터 전부 다시 하고
있다**는 뜻이다.

그래서 빌드를 단계별로 갈라 봤다. 번들링은 Vite가 맡는데 4초 남짓이었다.
**나머지를 거의 다 먹고 있는 건 타입 검사였다.** 타입 검사만 떼어
`--extendedDiagnostics`로 다시 재봤다. 재볼 때마다 38~50초 사이로 흔들렸는데,
아래는 그중 한 번이다.

```text
Files:                        3052
Lines of TypeScript:        334852
Types:                      427994
Instantiations:            3368076
Memory used:              1711344K

Program time:                4.65s
Bind time:                   0.77s
Check time:                 29.42s
Emit time:                   0.00s
Total time:                 34.84s
```

`Emit time: 0.00s`다. 번들은 Vite가 만드니 tsc는 한 글자도 내보내지 않는다.
그런데도 **34.84초 중 29.42초**를 쓴다. **타입 검사 하나가 전체의 84%다.**

줄일 곳을 찾았으니 이제 이쪽을 파볼 차례였다. 결론을 미리 적으면 증분 검사를
켜고 캐시를 붙여 48초를 8초로 줄였다. 다만 거기로 바로 가지는 않았다.
29.42초를 줄이려면 **그 29.42초가 어디서 나는지** 먼저 알아야 했다.

## 1. 저 네 줄이 무엇인가 — 컴파일러의 네 단계

위 출력의 `Program` / `Bind` / `Check` / `Emit`은 임의로 나눈 구간이 아니다.
**tsc가 소스를 처리하는 네 단계를 그대로 찍은 것**이다.

```text
┌──────────────────────────────────────────────────────────────┐
│  TypeScript 컴파일러 처리 흐름                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Scanner / Parser    소스 코드를 분석해 AST 생성            │
│         ↓                                   → Program time    │
│  2. Binder              선언을 심벌과 스코프에 연결            │
│         ↓                                   → Bind time       │
│  3. Type Checker        타입 추론, 할당 가능성, 제네릭 검사    │
│         ↓                                   → Check time  ★   │
│  4. Emitter             JS·선언 파일 출력 (noEmit이면 생략)    │
│                                             → Emit time       │
└──────────────────────────────────────────────────────────────┘
```

단계마다 하는 일이 다르고, **비용도 다르다.**

- **1. Scanner / Parser** — 파일을 읽어 토큰으로 쪼개고 AST로 만든다. 그
  앞에 전처리(preprocessor)가 붙어서, `import`와 참조를 따라가며 **어떤
  파일을 컴파일에 넣을지부터 정한다.** TypeScript 공식 문서는 `Program time`을
  "파일 시스템에서 읽고, 스캔하고, 파싱하는 데 걸린 시간을 합친 것"이라고
  설명한다. 실제로 이 프로젝트의 출력에도 `I/O Read 1.13s`, `Parse 1.51s`,
  `ResolveModule 1.60s`가 따로 찍혀 있고, 합치면 `Program time 4.65s`에 가깝다.
  비용은 **파일 수와 줄 수에 비례**한다.
- **2. Binder** — AST를 훑으며 심벌을 만들고 스코프에 앉힌다. 어떤 이름이
  어떤 선언을 가리키는지 연결하는 일이다. 공식 문서의 표현으로는
  "파일 하나 안에서 끝나는(local to a single file) 의미 정보"를 세우는
  단계다. **파일 경계를 넘지 않으니 싸다.** 0.77초.
- **3. Type Checker** — 타입을 추론하고, 할당이 되는지 따지고, 제네릭을
  풀어낸다. 2단계와 달리 **파일 경계를 넘어선다.** A 파일의 타입이 맞는지
  보려면 B가 내보낸 타입을 알아야 하기 때문이다. 그래서 비용이 파일 수가
  아니라 타입의 복잡도를 따른다. 타입 42만 개와 인스턴스화 336만 건이 여기서
  나왔다. 29.42초.
- **4. Emitter** — JS나 `.d.ts`를 쓴다. `noEmit: true`면 통째로 건너뛴다.
  0.00초.

이렇게 놓고 보면 처음 출력이 다르게 읽힌다.

```text
Program time    4.65s   ← 1단계. 파일을 읽고 파싱하는 값
Bind time       0.77s   ← 2단계. 파일 안에서 끝나는 일
Check time     29.42s   ← 3단계. 파일 경계를 넘는 일. 여기가 84%
Emit time       0.00s   ← 4단계. Vite가 하므로 0
```

타입 검사가 느린 게 아니라 **3단계만 유독 비싼 구조**다. 1·2단계는 파일을
늘려도 선형으로 늘지만, 3단계는 타입을 복잡하게 쓸수록 비선형으로 뛴다.

그리고 **파일 경계를 넘는 단계가 3단계뿐**이라는 점이 뒤에서 그대로 쓰인다.
"이 파일을 고치면 어디까지 다시 봐야 하나"가 문제가 되는 곳도 3단계뿐이다.

이 그림이 앞으로 나올 이야기의 지도다. 미리 짚어두면,

- 증분 검사가 건너뛰는 것은 **3단계뿐**이다. 1·2단계는 매번 처음부터 다시
  한다 — 뒤에서 측정으로 확인한다.
- `.tsbuildinfo`가 "이 파일을 다시 검사해야 하나"를 판단할 때, 뜻밖에도
  **4단계(Emitter)를 빌려 쓴다.** 왜 그런지가 이 글의 중심이다.

## 2. 29.42초가 어디서 나오는지 먼저 본다 — `--generateTrace`

위 로그로 알 수 있는 건 "타입 검사가 느리다"까지다. **어느 파일이**,
**어떤 타입 계산이** 오래 걸리는지는 알 수 없다. 합계만 있고 내역이 없다.

그 내역을 뽑는 옵션이 `--generateTrace`다.

```bash
pnpm exec tsc -p tsconfig.app.json --generateTrace ./trace
```

실행하면 파일 두 개가 생긴다.

```text
frontend/
└─ trace/
   ├─ trace.json
   └─ types.json
```

- **`trace.json`** — 컴파일러가 한 작업의 **시간 흐름**. Chrome Trace Event
  포맷이라 타임라인 도구에 그대로 올라간다.
- **`types.json`** — 그 과정에서 만들어진 **타입들의 정보**. `trace.json`이
  "타입 #41273 때문에 오래 걸렸다"고 하면, 그 번호의 정체를 여기서 찾는다.

### `trace.json`에 뭐가 들어 있나

안에 쌓이는 이벤트는 이런 이름들이다.

```text
createSourceFile        파일을 읽어 AST로 만든다
bindSourceFile          스코프와 심벌을 연결한다
checkSourceFile         ← 타입 검사. 파일 하나당 하나
structuredTypeRelatedTo ← 두 타입이 서로 호환되는지 따진다
checkExpression         식 하나의 타입을 구한다
getVariancesWorker      제네릭 타입 인자의 변성을 계산한다
```

각 이벤트에 시작 시각(`ts`)과 걸린 시간(`dur`), 그리고 대상 파일 경로가
붙는다. 그래서 **이벤트별로 시간을 합치면 어디에 시간이 쏠렸는지** 나온다.

### 보는 방법 두 가지

**① 타임라인 뷰어에 올린다.** TypeScript 공식 문서가 안내하는 방법은 Edge나
Chrome에서 `about://tracing`에 들어가 `Load`로 `trace.json`을 여는
것이다. 플레임 차트가 그려지고, 가로로 긴 막대가 오래 걸린 작업이다.
클릭하면 어느 파일인지 나온다. 전체 모양을 한눈에 보기에 좋다.

> 다만 이 안내는 조금 오래됐다. `chrome://tracing`은 2022년 7월에
> deprecated로 선언됐고, **기본적으로 [Perfetto UI](https://ui.perfetto.dev/)로
> 리다이렉트된다.** Catapult 쪽 문서는 옛 UI를 계속 쓸 수는 있지만 앞으로도
> 동작하리라는 보장은 없다고 적어 두었다. 그러니 실질적으로는 Perfetto에
> `trace.json`을 끌어다 놓으면 된다 — 같은 Chrome Trace Event 포맷이다.
>
> 그리고 DevTools의 **Performance 탭과는 다른 화면**이다. 헷갈리기 쉬운데,
> 거기에 넣는 게 아니다.

**② `@typescript/analyze-trace`로 글로 뽑는다.** TypeScript 팀이 내놓은
분석 도구로, 플레임 차트를 눈으로 훑는 대신 **오래 걸린 순서대로 정리된
목록**을 터미널에 출력해 준다. 공식 README가 안내하는 실행 방법은 이렇다.

```bash
npm install --no-save @typescript/analyze-trace
npx analyze-trace ./trace
```

실행 파일 이름이 패키지 이름과 다르다. 설치는 `@typescript/analyze-trace`로
하고, **실행은 `analyze-trace`로 한다.** 인자로는 파일이 아니라 `trace.json`과
`types.json`이 **같이 들어 있는 디렉터리**를 넘긴다.

쓸 만한 옵션 몇 가지.

```text
--skipMillis   <ms>   이보다 짧은 작업은 감춘다 (기본 100)
--forceMillis  <ms>   이보다 긴 작업은 무조건 보여준다 (기본 500)
--expandTypes  <bool> 타입 이름을 펼쳐서 출력한다 (기본 true)
--color        <bool> 파일로 리다이렉트할 땐 false로 둔다
```

핫스팟을 파일과 타입까지 짚어 주고, **같은 npm 패키지가 여러 버전 올라와
중복으로 검사되고 있는 경우**도 따로 알려준다. 처음 원인을 찾을 때는 이쪽이
빠르다.

> 공식 문서는 "성능 트레이스 파일의 포맷은 안정적이지 않으며 버전마다 바뀔
> 수 있다"고 못박아 둔다. 이벤트 이름이나 구조에 기대는 스크립트를 짜 둘
> 생각이라면 TypeScript를 올릴 때 같이 확인해야 한다.

### 무엇을 찾는가

출력에서 눈여겨볼 패턴은 셋이다.

- **`checkSourceFile`이 유독 긴 파일** — 그 파일 하나가 전체를 끌고 있다.
  보통 거대한 유니온 타입, 깊게 재귀하는 conditional type, 혹은 추론에
  맡겨둔 복잡한 제네릭이 들어 있다.
- **`structuredTypeRelatedTo`가 깊게 중첩된 구간** — 타입 호환성 비교가
  폭발한 것이다. 큰 유니온끼리 비교하면 경우의 수가 곱해진다. 명시적
  타입 주석 하나로 비교를 끊어줄 수 있는 자리가 여기다.
- **`node_modules`의 `.d.ts`가 올라오는 경우** — 내 코드가 아니라 라이브러리
  타입이 비싼 것이다. 이건 내가 고칠 수 없으니 `skipLibCheck`나 import 방식을
  보게 된다. 다만 공식 문서는 `skipLibCheck`에 대해 "`.d.ts` 파일의 설정
  오류나 충돌을 가려버릴 수 있으므로 빌드를 빠르게 하려는 목적으로만
  쓰기를 권한다"고 덧붙인다.

여기서 **한두 파일이 시간을 독차지하고 있으면 그 타입을 고치는 게 답**이다.
반대로 3,000개 파일에 시간이 고르게 퍼져 있으면 고칠 "범인"이 없다. 그때는
검사를 빠르게 만드는 게 아니라 **검사를 건너뛰게 만드는 쪽**, 곧 증분 검사로
간다. 내 경우가 뒤쪽이었다.

## 3. 증분 검사란 무엇인가

### 정의

보통의 타입 검사는 **매 실행마다 전체 프로그램을 처음부터 검사한다.** 지난
번에 무엇을 검사했는지 기억하지 않는다. 프로세스가 끝나면 다 잊는다. 도입부의
"무엇을 고치든 48초"가 그 모습이다.

**증분 타입 검사(incremental type checking)는 지난 실행의 정보를 디스크에
남겨두고, 이번에는 달라진 것과 그 영향이 미치는 범위만 다시 검사한다.**
TypeScript 공식 문서의 표현으로는 `--incremental` 플래그가 "지난 컴파일의
상태를 `.tsbuildinfo` 파일에 저장"하고, 저장하는 것은 "지난 컴파일에서의
프로젝트 그래프에 대한 정보"다.

켜는 건 설정 두 줄이다.

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/.cache/tsconfig.app.tsbuildinfo"
  }
}
```

용어를 하나 구분해 두면 좋다. 흔히 말하는 **증분 컴파일**은 "안 바뀐 파일은
JS를 다시 뽑지 않는다"까지 포함하는 말이다. 그런데 Vite를 쓰면 JS는 Vite가
만들고 tsc는 `noEmit`이라 애초에 뽑을 게 없다. **그래서 남는 이득은 검사
쪽뿐**이고, 이 글이 다루는 것도 그것이다.

### 장점

- **반복 실행이 싸진다.** 안 고치고 다시 돌리면 검사할 파일이 0개다. 뒤에서
  측정으로 확인한다.
- **걸리는 시간이 고친 범위에 비례하게 된다.** 이게 체감상 가장 크다. 한 줄을
  고쳤는데 3,000개를 검사하는 일이 없어진다. 작은 수정의 피드백이 빨라지니
  "빌드 돌려놓고 딴짓" 하는 흐름이 사라진다.
- **에러가 있어도 캐시가 유지된다.** 타입 에러를 고치는 루프가 특히 빨라진다.
  10절에서 다룬다.
- **코드를 안 건드려도 된다.** 타입을 리팩터링해 검사를 가볍게 만드는 길도
  있지만, 그건 코드를 바꾸는 일이라 리뷰와 리스크가 따른다. 증분은 설정
  두 줄이고 **결과물이 달라지지 않는다.**
- **에디터가 빠른 것과 같은 원리다.** `tsc --watch`도 내부적으로 같은 빌더
  (`createEmitAndSemanticDiagnosticsBuilderProgram`)를 쓴다. VS Code에서
  파일을 저장할 때 전체가 다시 검사되지 않는 그 경험을, CLI 빌드에도
  적용하는 셈이다.

한 가지는 분명히 해 두고 싶다. **증분 검사는 검사를 "덜" 하는 게 아니다.**
다시 할 필요가 없는 것을 건너뛸 뿐이고, 나오는 에러는 전체 검사와 같아야
한다. 빠른 대신 느슨해지는 거래가 아니다 — 그래서 켜도 되는 것이다.

물론 공짜는 아니다. 최초 실행에는 효과가 없고, 캐시 파일을 보존해야 하고,
건드리면 전체가 다시 도는 파일이 따로 있다. 각각 7·9·12절에서 숫자와 함께
본다.

### "달라진 것"을 어떻게 알아내는가

정의를 다시 보면 한 군데가 비어 있다. "달라진 것과 그 영향이 미치는 범위"를
tsc가 **어떻게 알아내느냐**다. 증분 검사는 사실상 이 한 가지 문제다.

캐싱이 성립하는 근거부터 보면, 타입 검사는 **같은 입력에 같은 결과**를 낸다.
`util.ts`의 내용이 그대로고 그 파일이 의존하는 것들도 그대로라면, 이번에
검사해도 지난번과 똑같은 결과가 나온다. 다시 할 이유가 없다.

그러니 풀어야 할 문제는 "결과를 어떻게 저장할까"가 아니다. **무엇이
그대로인지 어떻게 아는가**다.

지난 실행의 검사 결과를 통째로 저장해 두는 걸까? 그렇다면 파일 하나만 고쳐도
그 결과는 전부 무효가 되어야 한다. 그런데 그렇지 않다.

그래서 `.tsbuildinfo`를 열어봤다.

## 4. `.tsbuildinfo`에는 타입이 없다

`incremental: true`를 켜면 tsc가 `.tsbuildinfo` 한 장을 남긴다. 먼저 작은
프로젝트로 실물을 만들어 봤다. 파일 셋이 전부다.

```ts
// src/types.ts
export type User = { id: number; name: string };

// src/util.ts  — types.ts를 쓴다
import type { User } from "./types";
export function label(u: User): string {
  return u.name;
}

// src/app.ts   — util.ts와 types.ts를 쓴다
import { label } from "./util";
import type { User } from "./types";
const u: User = { id: 1, name: "a" };
console.log(label(u));
```

돌리고 나온 `.tsbuildinfo`의 최상위 키는 이렇다.

```text
fileNames, fileIdsList, fileInfos, root,
options, referencedMap, affectedFilesPendingEmit, version
```

`Types`도 `Symbols`도 없다. 아까 그 프로젝트가 만들어낸 타입 42만 개,
인스턴스화 336만 건 — **단 하나도 저장되지 않는다.** 1.7GB를 먹던 체커 상태는
프로세스가 끝나면서 그대로 사라진다.

그럼 뭐가 들었나. 하나씩 보면,

```text
fileNames : ["...lib.es5.d.ts", ..., "./src/types.ts", "./src/util.ts", "./src/app.ts"]
             (54개. 인덱스는 1부터 센다 — types.ts=52, util.ts=53, app.ts=54)

fileInfos : ["8abb6039...", "90ed9150...", "accad909..."]   ← 파일당 해시 하나

root      : [[52, 54]]            ← 내 소스는 52~54번

fileIdsList  : [[52,53], [52]]
referencedMap: [[54,1], [53,2]]
```

마지막 두 줄이 핵심이다. `referencedMap`의 `[54, 1]`은 "54번(app.ts)은
`fileIdsList`의 1번 목록 `[52,53]`을 참조한다"는 뜻이다. `[53, 2]`는 *"53번
(util.ts)은 2번 목록 `[52]`를 참조한다"*.

곧 아래 그래프를 숫자로 적어둔 것이다.

```text
types.ts(52) ──→ util.ts(53) ──→ app.ts(54)
      └──────────────────────────────┘
```

**`.tsbuildinfo`는 타입 검사 결과가 아니라 "누가 누구를 쓰는가"와 "각 파일이
그때 어떤 내용이었나"를 적어둔 장부다.** 다음 실행에서 tsc가 하는 일은
정해진다. 파일을 다시 읽어 해시를 내고, 장부의 해시와 다른 파일을 찾고,
그래프를 타고 **영향받는 파일만** 검사한다.

캐시하는 것은 답이 아니라 **질문의 범위**다.

## 5. 해시가 하나가 아니다 — `version`과 `signature`

여기서 바로 의문이 생긴다. 파일 내용이 바뀌면 그 파일을 쓰는 쪽도 전부 다시
봐야 하나?

함수 몸통만 고친 경우를 생각해 보자.

```ts
// 고치기 전
export function fullName(u: User): string {
  return u.name;
}

// 고친 후 — 내용은 달라졌지만 밖에서 보이는 모양은 그대로다
export function fullName(u: User): string {
  const trimmed = u.name.trim();
  return trimmed.length > 0 ? trimmed : "anonymous";
}
```

`fullName`을 쓰는 쪽 입장에서는 **아무것도 달라지지 않았다.** 여전히
`User`를 받아 `string`을 준다. 다시 검사할 이유가 없다.

tsc도 이걸 구분한다. 그래서 파일마다 해시를 **두 개** 들고 있다.

```json
{
  "version":   "26d6ed93d74b97ea0761ffd01365ddc5091267df6ca163f99a4db8820ef8a9d0",
  "signature": "5e4456471897c953d358cb6dda495f1c4c1fce176198c35e6468fdd094819095"
}
```

- **`version`** — 파일 **원문**의 해시. 주석 한 칸만 바뀌어도 달라진다.
- **`signature`** — 그 파일의 **`.d.ts`를 뽑았을 때 나오는 내용**의 해시.
  곧 "밖에서 보이는 모양"이다.

`signature`를 만드는 코드는 그대로다 (`typescript.js`).

```js
function computeDtsSignature(programOfThisState, sourceFile, ..., onNewSignature) {
  programOfThisState.emit(
    sourceFile,
    (fileName, text, ...) => {
      Debug.assert(isDeclarationFileName(fileName), ...);  // .d.ts 여야 한다
      onNewSignature(computeSignatureWithDiagnostics(..., text, ...));
    },
    ...
  );
}
```

선언 파일을 **실제로 만들어 보고** 그 텍스트를 해시한다. 함수 몸통은 `.d.ts`에
안 담기니, 몸통만 고치면 `version`은 변해도 `signature`는 그대로다.

그리고 이 둘 중 무엇이 변했는지로 다시 검사할 범위가 갈린다.

```js
function getFilesAffectedByWithOldState(state, programOfThisState, path, ...) {
  const sourceFile = programOfThisState.getSourceFileByPath(path);
  if (!sourceFile) return emptyArray;

  if (!updateShapeSignature(state, programOfThisState, sourceFile, ...)) {
    return [sourceFile];                       // ← signature 그대로: 이 파일만
  }
  return getFilesAffectedByUpdatedShapeWhenModuleEmit(...);  // ← 바뀜: 쓰는 쪽까지
}
```

`updateShapeSignature`는 새 `signature`를 계산해서 `latestSignature !== prevSignature`를
돌려준다. 그 한 줄이 "나 혼자"와 "나를 쓰는 전부"를 가른다.

## 6. 그래서 몇 개가 다시 검사되나 — 세어봤다

읽은 것과 실제로 도는 것은 다를 수 있으니 측정했다. 600개 파일이 공통
모듈 하나를 쓰는 구조를 만들었다.

```text
types.ts ──→ core.ts ──→ mod0.ts … mod599.ts   (총 602개 + lib 51개)
```

세는 데는 2절의 `--generateTrace`를 그대로 쓴다. 이번에는 시간을 보려는
게 아니라 **`checkSourceFile` 이벤트의 개수**를 센다. 파일 하나당 하나씩
찍히니, 그 수가 곧 실제로 검사된 파일 수다. 시간과 달리 머신 상태에
흔들리지 않는 값이라 비교하기에 좋다.

```bash
tsc -p tsconfig.json --generateTrace trace_dir
```

Vite 앱의 흔한 설정 그대로, `noEmit: true`로 두고 쟀다.

| 수정한 것 | 다시 검사된 파일 |
|---|---|
| (최초 실행, 캐시 없음) | 653 |
| 아무것도 안 고침 | **0** |
| `core.ts` 몸통만 | 601 |
| `core.ts` 반환 타입 `string` → `string \| null` | 601 |
| `types.ts` | 602 |

아무것도 안 고치면 **0개**다. `Check time` 줄이 출력에서 통째로 사라진다.

개수가 시간으로 어떻게 옮겨지는지도 같이 쟀다. 같은 프로젝트를 3회 반복,
`--extendedDiagnostics`의 값이다 (회차별 편차는 ±0.03초였다).

| 수정한 것 | 검사된 파일 | `Program time` | `Check time` | `Total time` |
|---|---|---|---|---|
| **최초 실행** (캐시 없음) | 653 | 0.47s | **0.77s** | **1.33s** |
| 아무것도 안 고침 | 0 | 0.47s | **(줄 자체가 없음)** | **0.57s** |
| `core.ts` 몸통만 (첫 수정) | 601 | 0.46s | 0.35s | 1.10s |
| `core.ts` 몸통만 (그 다음) | 1 | 0.46s | **0.02s** | 0.60s |

`Check time`이 개수를 그대로 따라간다. 653개에 0.77초, 601개에 0.35초,
1개에 0.02초. 검사된 파일 수가 곧 시간이다.

그런데 **`Program time`은 꿈쩍도 안 한다.** 어느 줄이든 0.46~0.47초다.
증분이 건너뛰는 것은 *검사*지 *읽기·파싱·모듈 해석*이 아니다. 603개 파일을
디스크에서 읽고 AST로 만들고 `import` 경로를 푸는 일은 **매번 처음부터 다시
한다.**

그래서 증분의 바닥이 정해진다. 최초 1.33초가 0.57초까지는 내려가지만 0초가
되지는 않는다. 처음 그 프로젝트에 대입하면,

```text
Program time   4.65s  ┐
Bind time      0.77s  ┘ → 증분으로 못 지운다 (매번 낸다)
Check time    29.42s    → 증분이 지우는 부분
───────────────────────
Total time    34.84s    → 아무리 좋아져도 5.42초가 바닥
```

**증분으로 지울 수 있는 최대치가 29.42초고, 5.42초는 남는다.** 48초가 8초가
된 것도 0초로 간 게 아니라 이 바닥 위에 Vite 번들링이 얹힌 숫자다.

그리고 하나 더 — **최초 실행에는 증분이 아무 도움도 안 된다.** 위 표의 첫
줄이 그거다. `.tsbuildinfo`가 없으면 653개 전부, 29.42초 전부를 낸다.
CI에서 캐시를 복원하지 못하면 `incremental: true`를 켜둔 것과 끈 것이 같다.
설정을 켜는 것과 캐시를 보존하는 것은 별개의 일이다.

이제 표로 돌아가면, `core.ts` 몸통만 고친 줄이 이상하다. **몸통만 고쳤는데
601개가 다시 검사됐다.** 시그니처를 바꾼 것과 똑같다. 방금 본 `signature`
비교는 어디로 갔나.

## 7. 첫 번째 수정만 비싸다

한 번 더, 이번엔 몸통만 연달아 세 번 고쳐봤다.

| 순서 | 다시 검사된 파일 |
|---|---|
| 최초 실행 | 653 |
| 몸통 수정 #1 | **601** |
| 몸통 수정 #2 | **1** |
| 몸통 수정 #3 | **1** |

두 번째부터는 1개다. 첫 번째만 비싸다.

`.tsbuildinfo`에 `signature`가 언제 들어가는지 세어 보면 답이 나온다.

```text
최초 실행 직후     src 파일 중 signature 가진 것: 0 / 602
첫 수정 직후       src 파일 중 signature 가진 것: 601 / 602
```

**최초 실행은 `signature`를 하나도 만들지 않는다.** 이유는 상태를 세우는
한 줄에 있다.

```js
useFileVersionAsSignature: !disableUseFileVersionAsSignature && !useOldState
```

`useOldState`는 "이전 `.tsbuildinfo`를 물려받았는가"다. 최초 실행에는 물려받을
게 없으니 `useOldState`가 거짓, 따라서 `useFileVersionAsSignature`가 **참**이
된다. 그러면 `updateShapeSignature`는 `.d.ts`를 뽑는 대신 원문 해시를 그대로
`signature`로 쓴다.

```js
if (!sourceFile.isDeclarationFile && !useFileVersionAsSignature) {
  computeDtsSignature(...);        // ← 최초 실행에는 여기 안 들어온다
}
if (latestSignature === void 0) {
  latestSignature = sourceFile.version;   // ← 원문 해시를 그대로 쓴다
}
```

`signature === version`이 되고, 직렬화할 때는 둘이 같으면 문자열 하나로만
적힌다. 그래서 `0 / 602`로 보인 것이다.

이제 첫 수정이 왜 비쌌는지가 맞아떨어진다.

```text
최초 실행    signature = bbf56589…  (원문 해시)
몸통 수정    원문이 달라짐 → 재계산. 이번엔 .d.ts를 뽑는다 → 6a1cdf84…
             6a1cdf84… ≠ bbf56589…  →  "모양이 바뀌었다"고 판단 → 601개
두 번째 수정 prevSignature = 6a1cdf84… (진짜 .d.ts 해시)
             새로 뽑아도 6a1cdf84…  →  같다 → 1개
```

**원문 해시와 `.d.ts` 해시를 비교한 것이다.** 둘은 애초에 같을 수가 없다.
모양이 바뀐 게 아니라, 비교 대상의 종류가 달랐다.

## 8. `composite`를 켜면 첫 수정도 싸진다

`.d.ts`를 실제로 내보내게 하면 어떨까. 최초 실행부터 진짜 `signature`가 남을
테니 말이다. 같은 600개 프로젝트에 설정만 바꿔 쟀다.

```json
{
  "composite": true,
  "emitDeclarationOnly": true,
  "outDir": "./dist"
}
```

`composite`만 켜면 `declaration`과 `incremental`은 따로 적지 않아도 된다.
공식 문서상 **둘 다 `composite`가 켜져 있으면 기본값이 `true`로 바뀐다.**
여기에 `emitDeclarationOnly`를 더해 JS는 빼고 `.d.ts`만 뽑게 했다. JS는
어차피 Vite가 만든다.

다만 `composite`는 켜는 순간 조건이 붙는다. 공식 문서가 "이 설정이 켜지면"
이라며 드는 항목은 셋이다.

- **모든 구현 파일이 `include`나 `files`에 잡혀 있어야 한다.** 빠진 게 있으면
  `tsc`가 어느 파일인지 알려주며 거부한다.
- **`rootDir`의 기본값이 바뀐다.** 원래는 입력 파일들의 최장 공통 경로인데,
  `composite`에서는 `tsconfig.json`이 있는 디렉터리가 된다.
- **`declaration`의 기본값이 `true`가 된다.**

실제로 위 설정만으로 돌려 보면 `.d.ts` 602개가 나오고 `.js`는 0개다.
`declaration`을 안 적었는데도 선언 파일이 나왔으니 기본값이 바뀐 게 맞고,
`incremental`을 안 적었는데도 `.tsbuildinfo`가 생겼으니 그쪽도 맞다. 출력이
`dist/`가 아니라 `dist/src/`에 떨어지는 것도 `rootDir` 기본값이 바뀐 결과다.

여기에 문서에 적혀 있지는 않지만 따라오는 결과가 하나 더 있다. `declaration`이
켜진다는 건 **`.d.ts`를 실제로 뽑아야 한다**는 뜻이고, 뽑을 수 없는 코드가
있으면 거기서 에러가 난다. 추론에 맡겨둔 반환 타입이 바깥에서 이름 붙일 수
없는 타입인 경우가 대표적이다. 그래서 기존 프로젝트에 `composite`를 켜면
처음엔 에러가 쏟아질 수 있다. 켜는 값이 공짜는 아니다.

| 수정한 것 | `noEmit: true` | `composite: true` |
|---|---|---|
| 최초 실행 | 653 | 653 |
| `core.ts` 몸통만 | **601** | **1** |
| `core.ts` 시그니처 | 601 | 601 |

예상대로다. 몸통만 고쳤을 때 601개가 1개가 된다. 시그니처를 진짜로 바꾸면
둘 다 601개 — 그래야 맞다.

`.tsbuildinfo`를 열어 보면 차이가 그대로 보인다.

```text
noEmit    최초 실행 후  core.ts →  version=bbf56589…  signature=(없음)
composite 최초 실행 후  core.ts →  version=bbf56589…  signature=6a1cdf84…
```

정리하면 이렇다.

- **`noEmit: true`** — 캐시가 식은 뒤 **첫 수정 한 번**은 의존하는 파일을 전부
  다시 검사한다. 그 다음부터는 제대로 좁혀진다.
- **`composite: true`** — 최초 실행에서 `.d.ts`를 뽑아두므로 첫 수정부터
  좁혀진다. 대신 최초 실행이 선언 파일을 만드는 값을 치른다.

로컬에서 하루 종일 켜두고 고치는 상황이라면 `noEmit`으로도 충분하다. 첫 수정
한 번만 손해다. 반면 **CI처럼 캐시를 내려받아 한 번 돌리고 버리는 환경**에서는
매 실행이 늘 "첫 수정"이다. 이쪽은 `composite`가 의미가 있다.

## 9. 그래프를 통째로 무시하는 파일이 있다

여기까지는 `referencedMap`을 타고 번져나가는 이야기였다. 그런데 그 그래프를
아예 건너뛰는 파일이 있다.

```js
function getAllDependencies(state, programOfThisState, sourceFile) {
  const compilerOptions = programOfThisState.getCompilerOptions();
  if (compilerOptions.outFile) {
    return getAllFileNames(state, programOfThisState);
  }
  if (!state.referencedMap || isFileAffectingGlobalScope(sourceFile)) {
    return getAllFileNames(state, programOfThisState);   // ← 전부
  }
  ...
}
```

`isFileAffectingGlobalScope`면 그래프를 보지 않고 **모든 파일**을 돌려준다.
그 판정은 이렇다.

```js
function isFileAffectingGlobalScope(sourceFile) {
  return containsGlobalScopeAugmentation(sourceFile)
    || (!isExternalOrCommonJsModule(sourceFile)
        && !isJsonSourceFile(sourceFile)
        && !containsOnlyAmbientModules(sourceFile));
}
```

**최상위 `import`/`export`가 하나도 없는 파일**은 모듈이 아니라 전역 스크립트다.
그 안의 선언은 모든 파일에서 보이므로, 바뀌면 전부 다시 봐야 한다.

Vite 프로젝트라면 익숙한 파일이 정확히 여기 해당한다.

```ts
// src/env.d.ts  — import도 export도 없다
declare const __APP_VERSION__: string;
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
```

같은 600개 프로젝트에 이 파일을 넣고 한 줄 추가해 봤다.

| 수정한 것 | 다시 검사된 파일 |
|---|---|
| 아무것도 안 고침 | 0 |
| `env.d.ts`에 한 줄 추가 | **654 (전부)** |

`.tsbuildinfo`에도 표시가 따로 붙어 있다.

```text
env.d.ts → {"version":"8a63a94f…", "affectsGlobalScope": true}
referencedMap에서 env.d.ts를 참조하는 항목: []
```

참조 목록이 비어 있는데도 전부 다시 검사됐다. 그래프에 없으니 **그래프로 막을
수 없다**. `lib.es5.d.ts` 같은 표준 라이브러리 선언에도 같은 표시가 붙어 있다.

실무에서 걸리는 부분은 전역 타입 파일 자체가 아니다. 그 파일은 거의 안 고친다.
문제는 **모듈인 줄 알았는데 아닌 파일**이다. `export`가 없는 상수 파일,
`declare global`을 품은 유틸, 정리하다 `export`가 날아간 파일 — 이런 게 하나
섞여 있으면 고칠 때마다 전체 검사가 돈다. 증분을 켰는데도 안 빨라진다면
먼저 볼 곳이 여기다.

## 10. 에러도 캐시된다

하나 더. 타입 에러를 남겨둔 채로 두 번 돌려보면,

```text
$ tsc -p tsconfig.json
src/app.ts(4,7): error TS2322: Type 'string' is not assignable to type 'number'.

$ tsc -p tsconfig.json       # 아무것도 안 고치고 다시
src/app.ts(4,7): error TS2322: Type 'string' is not assignable to type 'number'.
```

두 번째 실행은 그 파일을 **검사하지 않았다.** 메시지를 `.tsbuildinfo`에서 꺼내
다시 출력했을 뿐이다.

```json
"semanticDiagnosticsPerFile": [
  [54, [{ "start": 113, "length": 1, "code": 2322, "category": 1,
          "messageText": "Type 'string' is not assignable to type 'number'." }]]
]
```

위치, 코드, 문장이 통째로 들어 있다. 파일 번호 54번은 앞에서 본 `app.ts`다.

그래서 **에러가 있는 상태에서도 증분이 유지된다.** 검사가 실패했다고 캐시를
버리지 않는다. CI가 빨간불로 끝나도 다음 실행은 여전히 빠르다.

## 11. 실제 프로젝트에서는

여기까지가 600개짜리 모형에서 본 것이다. 처음의 3,052개 프로젝트로 돌아가
같은 일을 하면 이렇게 된다.

**바꾸기 전**은 단순했다.

```text
빌드 1회           약 48초
  타입 검사        약 38~50초   ← 전체의 90%
  번들링(Vite)     약 4초
```

**무엇을 고치든 항상 48초였다.** 주석 한 줄을 고쳐도, 파일 하나를 고쳐도
같았다. 당연하다 — 캐시가 없으면 매번 3,052개를 처음부터 검사한다. 고친
범위와 검사하는 범위가 아무 상관이 없었다.

증분 검사를 켜고 `.tsbuildinfo`를 보존하게 하자, **하나였던 숫자가 셋으로
갈라졌다.**

| 상황 | 빌드 시간 | 일어나는 일 |
|---|---|---|
| **최초 빌드** (캐시 없음) | 약 48초 | 전체 타입 검사. 증분이 할 수 있는 게 없다 |
| **수정 없이 빌드** | **약 8초** | 빌드 정보 재사용, 검사 대부분 생략 |
| **공용 파일 수정 후** | 약 27초 | 변경 파일 + 그걸 쓰는 파일까지 재검사 |

가운데 줄이 "48초 → 8초"다. 남은 8초는 앞에서 본 바닥 — 1·2단계(읽기·파싱·
바인딩)와 Vite 번들링이다. 이건 증분으로 못 지운다.

흥미로운 쪽은 **세 번째 줄**이다. 공용 파일을 고치면 그걸 쓰는 곳이 전부
재검사 대상이 되니 범위가 넓어진다. 6절에서 모형으로 본 바로 그 장면이다.

```text
모형:   core.ts 수정 → 601 / 653개 재검사  (92%)
실제:   공용 파일 수정 → 약 27초 / 48초     (56%)
```

같은 현상이다. 8초로 안 떨어지고 27초가 나온 이유가 "왜 안 되지"가 아니라
**`referencedMap`을 타고 번진 결과**라는 걸 알고 보면 받아들일 수 있는
숫자다. 그래도 48초보다는 절반 가까이 빠르다.

그리고 7절을 떠올리면 여기엔 한 겹이 더 있다. `noEmit`에서는 **공용 파일을
고친 첫 번째 빌드**가 몸통만 고쳤든 시그니처를 고쳤든 똑같이 넓게 검사한다.
27초 중 일부는 그 값일 수 있다. 같은 파일을 연달아 고치면 두 번째부터
줄어든다.

정리하면 **증분 검사는 빌드를 일정하게 빠르게 만드는 게 아니라, 고친
범위에 비례하게 만든다.** 48초 하나였던 것이 8초·27초·48초로 갈라진 게
그 이야기다.

## 12. 정리

처음 질문으로 돌아가면 — tsc는 29초짜리 검사 **결과**를 저장하지 않는다.
타입 42만 개, 인스턴스화 336만 건은 매번 새로 만들어지고 매번 버려진다.

대신 세 가지를 적어둔다.

1. **누가 누구를 쓰는가** — `referencedMap`
2. **각 파일이 그때 어땠는가** — `version`(원문)과 `signature`(`.d.ts` 모양)
3. **그때 무슨 에러가 났는가** — `semanticDiagnosticsPerFile`

다음 실행에서는 1·2번으로 **다시 검사할 파일 목록을 좁히고**, 좁혀진 게 없으면
3번을 그대로 다시 출력한다. 검사 자체는 캐시되지 않는다. 캐시되는 것은
**검사를 건너뛰어도 되는 이유**다.

그래서 증분 검사는 빌드를 "항상 빠르게" 만들지 않는다. 1절의 네 단계 중
3단계만, 그것도 고친 범위만큼만 건너뛴다. 하나였던 48초가 8초·27초·48초로
**갈라지는** 것이 전부이고, 그게 맞는 동작이다.

그래서 실전에서는 이렇게 된다.

- **`.tsbuildinfo`를 보존해야 효과가 있다.** 이 파일이 없으면 최초 실행이고,
  최초 실행에는 증분이 **아무 도움도 안 된다** — 29.42초를 그대로 낸다.
  설정을 켜는 것과 캐시를 보존하는 것은 별개의 일이다.
- **그 파일이 어디 생기는지부터 확인한다.** 공식 문서가 적어둔 기본 위치는
  이렇다. `outDir`이 있으면 `<outDir>/<설정파일 이름>.tsbuildinfo`, 없으면
  설정 파일 옆에 `<설정파일 이름>.tsbuildinfo`. 그러니까 `tsconfig.app.json`을
  쓰면 `tsconfig.app.tsbuildinfo`다. **`outDir` 안에 떨어지는 경우가
  함정이다** — 빌드 전에 출력 폴더를 지우는 스크립트가 캐시까지 같이 지운다.
  `tsBuildInfoFile`로 출력 폴더 바깥을 지정해 두고, CI라면 그 경로를 캐시
  키에 넣는다.
- **지울 수 있는 건 `Check time`뿐이다.** `Program time`과 `Bind time`은 매번
  낸다. 34.84초짜리 검사의 바닥은 5.42초지 0초가 아니다. 그보다 더 내리려면
  증분이 아니라 파일 수나 `include` 범위를 건드려야 한다.
- **에러가 나도 캐시는 남는다.** 실패했다고 캐시를 지울 이유가 없다.
- **전역 스코프 파일을 고치면 전부 다시 검사된다.** 증분을 켰는데 안 빨라지면
  `import`/`export` 없는 파일부터 찾아본다.
- **CI에서 `.d.ts` 모양까지 캐시하고 싶으면 `composite`를 고려한다.** 매 실행이
  "첫 수정"인 환경에서는 `noEmit`이 한 번 더 넓게 검사한다.

그리고 어느 쪽이든, 재는 게 먼저다. 순서는 이렇다.

1. **`--extendedDiagnostics`** — `Check time`이 전체에서 얼마인지 본다.
   여기가 작으면 타입 검사는 범인이 아니다. 다른 데를 봐야 한다.
2. **`--generateTrace` + `@typescript/analyze-trace`** — 그 시간이 한두 파일에
   몰려 있는지, 전체에 퍼져 있는지 본다. **몰려 있으면 타입을 고치고, 퍼져
   있으면 증분으로 건너뛴다.** 고를 수 있는 길이 여기서 갈린다.
3. **`--generateTrace`의 `checkSourceFile` 개수** — 증분을 켠 뒤, 정말로
   줄었는지 센다. 시간은 머신 상태에 흔들리지만 개수는 안 흔들린다.

48초가 8초가 된 것도 추측이 아니라 이 순서로 숫자를 보고 한 일이었다.

---

### 참고

- [TypeScript Handbook — Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TSConfig Reference — `incremental`](https://www.typescriptlang.org/tsconfig/#incremental)
- [TSConfig Reference — `composite`](https://www.typescriptlang.org/tsconfig/#composite)
- [TSConfig Reference — `tsBuildInfoFile`](https://www.typescriptlang.org/tsconfig/#tsBuildInfoFile)
- [TypeScript Wiki — Performance](https://github.com/microsoft/TypeScript/wiki/Performance) (단계별 시간의 정의, 트레이싱, `skipLibCheck`)
- [TypeScript Compiler Notes — 컴파일 과정 개요](https://github.com/microsoft/TypeScript-Compiler-Notes)
- [`@typescript/analyze-trace`](https://github.com/microsoft/typescript-analyze-trace)
- [Perfetto UI — 트레이스 뷰어](https://ui.perfetto.dev/)
- [Catapult — `chrome://tracing`의 Perfetto 이전 안내](https://chromium.googlesource.com/external/github.com/catapult-project/catapult.git/+/master/tracing/docs/perfetto.md)
- 본문의 컴파일러 코드는 TypeScript 5.8.3의 `node_modules/typescript/lib/typescript.js`에서 가져왔다
