---
slug: next-og-satori
title: "next/og는 왜 Grid를 못 쓰나"
date: 2026-11-09
tags: ["nextjs", "react"]
thumbnail: "/uploads/2026/11/next-og-satori.png"
---

# next/og는 왜 Grid를 못 쓰나

---

블로그 썸네일을 어떻게 만들지 고민하다가 `next/og`의 Satori를 알게 됐다.
JSX로 작성한 UI를 PNG 이미지로 생성할 수 있게 해준다.

## next/og가 실제로 하는 일

Next.js에서 OG 이미지를 만들 때 쓰는 건 `next/og`의 `ImageResponse`다. JSX를
넣으면 PNG가 나온다. 안에서는 두 개의 라이브러리를 사용한다.

```text
React JSX
   ↓
Satori        JSX를 읽어 레이아웃을 계산하고 SVG를 만든다
   ↓
resvg         SVG를 래스터화해서 PNG로 굽는다
   ↓
PNG 응답
```

말로만 그런 게 아니라 패키지 안에 그대로 들어 있다. 설치된 Next.js를 열어
보면 이렇다.

```text
node_modules/next/dist/compiled/@vercel/og/
├── index.node.js
├── satori/
├── yoga.wasm        ← 레이아웃 엔진
├── resvg.wasm       ← SVG → PNG 변환기
├── Geist-Regular.ttf
└── ...
```

`next/og`는 `@vercel/og`를 번들해둔 것이다. 재미있는 건 이 안에 세 가지
출신이 섞여 있다는 점이다.

|        | 무엇                  | 언어                    |
| ------ | --------------------- | ----------------------- |
| Satori | JSX를 읽고 SVG를 조립 | **TypeScript**          |
| Yoga   | 레이아웃 계산         | **C++** → `yoga.wasm`   |
| resvg  | SVG를 PNG로 래스터화  | **Rust** → `resvg.wasm` |

Satori 자체는 TypeScript다. 무거운 계산 두 가지만 각각 C++과 Rust에서 가져와
WASM으로 싣는다. 그래서 브라우저도, 플랫폼별 네이티브 바이너리도 필요 없다.

### 왜 SVG에서 멈추지 않고 PNG까지 가나

Satori의 결과물은 SVG다. 그대로 써도 될 것 같지만 PNG로 한 번 더 굽는다.
이유는 셋이다.

- **플랫폼 호환성** — 카카오톡·페이스북·X 같은 SNS 크롤러는 미리보기
  이미지로 SVG를 신뢰하지 않거나 아예 받지 않는다. PNG는 어디서나 뜬다.
- **렌더링 일관성** — SVG는 그리는 쪽의 렌더러와 폰트 환경에 따라 결과가
  달라질 수 있다. PNG는 픽셀이 이미 확정돼 있어서 어디서 열든 같다.
- **처리 단순화** — 받는 쪽이 도형과 텍스트를 다시 해석할 필요가 없다.

정리하면 **SVG는 이미지를 조립하기 좋은 중간 표현이고, PNG는 밖으로 내보내기
좋은 최종 결과물**이다. 두 단계로 나뉘어 있는 건 그래서다.

## 일반 React와 무엇이 다른가

브라우저에서 React를 쓸 때는 이렇게 흐른다.

```text
React JSX
   ↓
HTML DOM 생성
   ↓
브라우저 CSS 엔진        Flexbox · Grid · Position · 그 외 전부
   ↓
화면 렌더링
```

`next/og`에서는 이렇게 흐른다.

```text
React JSX
   ↓
Satori
   ├── 아는 HTML 요소만 해석
   ├── 레이아웃 계산
   ├── 지원하는 CSS 속성만 처리
   └── SVG 생성
   ↓
resvg → PNG
```

차이의 핵심은 **브라우저가 없다**는 것이다. 브라우저가 없으니 그 안에 들어
있던 CSS 엔진도 없다. Satori는 Chrome이나 Safari가 수십 년에 걸쳐 쌓아올린
CSS 구현을 대신할 수 없고, 애초에 그걸 목표로 하지도 않는다. 자기가 아는
속성만 처리하고 나머지는 조용히 버린다.

JSX를 쓰고 React 컴포넌트를 쓰니까 평소 쓰던 CSS가 다 될 것 같지만, 실제로는
**React처럼 생긴 별개의 렌더러**에 글을 쓰는 것에 가깝다.

## 잠깐, Flexbox와 Grid는 뭐가 다른가

"Flexbox만 된다"가 왜 제약인지 보려면 둘이 무엇을 하는 물건인지부터 봐야
한다. 흔히 "Grid가 상위 호환"이라고들 하는데 그렇지 않다. **푸는 문제가
다르다.**

### 한 축이냐, 두 축이냐

**Flexbox는 1차원이다.** 주축(main axis)을 하나 정하고, 그 축을 따라 아이템을
늘어놓고 남는 공간을 나눈다. `flex-direction`으로 축이 가로인지 세로인지
고른다. 한 번에 다루는 건 언제나 **한 줄**이다.

**Grid는 2차원이다.** 행과 열의 트랙을 먼저 선언하고, 아이템을 그 격자의
칸에 앉힌다. 가로와 세로를 동시에 다룬다.

### 누가 크기를 정하는가

이게 더 본질적인 차이다.

|           | Flexbox                                                           | Grid                                    |
| --------- | ----------------------------------------------------------------- | --------------------------------------- |
| 출발점    | **아이템의 내용**                                                 | **컨테이너의 트랙**                     |
| 흐름      | 내용 크기에서 시작해 남는 공간을 `flex-grow`/`flex-shrink`로 분배 | 트랙을 먼저 확정하고 아이템을 끼워 넣음 |
| 한 마디로 | 내용이 레이아웃을 정한다                                          | 레이아웃이 내용을 담는다                |

그래서 Flexbox는 **아이템 개수나 내용 길이를 모를 때** 강하다. 버튼이 3개가
오든 7개가 오든, 글자가 길든 짧든 알아서 늘어선다. Grid는 **구조를 내가 알고
있을 때** 강하다. "왼쪽 240px 사이드바, 나머지 본문" 같은 건 내용과 상관없이
정해진 골격이다.

### 줄바꿈이 결정적이다

Flexbox에도 `flex-wrap`이 있어서 줄은 바뀐다. 그런데 **바뀐 줄끼리는 서로를
모른다.** 각 줄이 독립적으로 계산되기 때문에, 폭이 제각각인 아이템을 흘리면
이렇게 된다.

```text
flex-wrap                        grid
┌────┬────────┬─────┐            ┌─────┬─────┬─────┐
│ 1  │   2    │  3  │            │  1  │  2  │  3  │
└────┴────────┴─────┘            ├─────┼─────┼─────┤
┌──────┬───┬──────┐              │  4  │  5  │  6  │
│  4   │ 5 │  6   │              └─────┴─────┴─────┘
└──────┴───┴──────┘
  ↑ 열이 어긋난다                   ↑ 열이 맞는다
```

줄바꿈한 Flexbox는 벽돌 쌓기가 된다. 두 번째 줄의 4번은 첫 줄의 1번과 세로
줄을 맞출 이유가 없다. 각자 자기 줄에서만 공간을 나눠 가졌기 때문이다.
**격자가 필요하면 Grid여야 하는 진짜 이유가 이거다.**

### 그래서 언제 무엇을 쓰나

| 상황                                                       | 고를 것 |
| ---------------------------------------------------------- | ------- |
| 한 줄(또는 한 열)에 늘어놓기 — 내비게이션, 툴바, 버튼 묶음 | Flexbox |
| 아이콘 + 텍스트처럼 내용 크기에 맞춰 붙이기                | Flexbox |
| 가운데 정렬 하나만 하면 될 때                              | Flexbox |
| 아이템 개수가 런타임에 바뀌는 목록                         | Flexbox |
| 페이지 골격 — 헤더·사이드바·본문·푸터                      | Grid    |
| 카드 목록처럼 가로세로가 다 맞아야 하는 격자               | Grid    |
| 표처럼 행과 열에 의미가 있는 배치                          | Grid    |
| 요소를 겹치기 (같은 칸에 두 개를 올리기)                   | Grid    |

실무에서는 둘 중 하나를 고르는 게 아니라 **겹쳐 쓴다.** 바깥 골격은 Grid로
짜고, 각 칸 안의 아이콘과 글자는 Flexbox로 붙이는 식이다. `gap`은 양쪽 다
되니 간격 때문에 고민할 필요는 없다.

그래서 "Flexbox만 된다"는 건 "조금 불편하다"가 아니다. **바깥 골격을 짜는
도구가 통째로 빠진다**는 뜻이다. Grid로 한 줄이면 될 격자를 좌표 계산으로
만들어야 한다.

## Grid가 막히는 지점

그럼 Satori는 왜 Grid를 모르나. 앞에서 "자기가 아는 속성만 처리한다"고 했는데,
**그 범위를 정하는 게 레이아웃 엔진**이다.

Satori가 쓰는 건 **Yoga**다. Meta가 만들었고, React Native가 브라우저 없이
iOS·Android의 네이티브 UI를 배치할 때 쓰는 바로 그 엔진이다.

Yoga는 Flexbox를 계산하기 위해 만들어졌다. Grid는 들어 있지 않다. Grid를
얹으려면 행·열 트랙 계산, 자동 배치, 암묵적 트랙 생성, 크기 결정 알고리즘을
전부 따로 구현해야 하는데 이건 Flexbox와 맞먹는 분량의 별도 작업이다.

문서만 믿지 말고 실제로 어떻게 막히는지 보기로 했다. 3×2 격자를 `display: grid`로
짜서 렌더해봤다.

```text
Invalid value for CSS property "display".
Allowed values: "flex" | "block" | "contents" | "none" | "-webkit-box".
Received: "grid".
```

받아주는 값을 친절하게 알려준다. `flex`만 되는 게 아니라 `block`, `contents`,
`none`도 목록에 있다. 그런데 이 중 레이아웃을 진짜로 계산해주는 건 사실상
`flex` 하나다. `display: block` 컨테이너에 자식을 둘 넣어봤더니 이렇게 나온다.

```text
Expected <div> to have explicit "display: flex", "display: contents",
or "display: none" if it has more than one child node.
```

자식이 둘 이상이면 `display`를 명시하라고 요구하는데, **그 허용 목록에
`block`은 없다.** 적을 수는 있지만 배치해주지는 않는다는 뜻이다. 문서가
"flexbox and a subset"이라고 쓴 게 과장이 아니었다.

**즉 Grid가 안 되는 건 Next.js의 제약이 아니다.** Satori가 고른 레이아웃
엔진의 범위 문제고, Next.js는 그 Satori를 번들해 쓰고 있을 뿐이다.

## 그런데 이게 지난달에 바뀌었다

여기까지 쓰고 Satori 저장소를 확인하다가 알았다. 2026년 10월 8일에 머지된
PR #841의 제목은 이렇다.

> feat!: Replace Yoga with Taffy and support `display: block` and `display: grid`

Yoga를 떼고 **Taffy**로 갈아끼웠다. Taffy는 Rust로 작성된 레이아웃
라이브러리고, Yoga와 달리 Flexbox·Grid·Block을 모두 계산한다. 같이 들어온
변화는 이렇다.

- `display: grid` 지원 — `repeat()`, `minmax()`, `fit-content()`, 라인 이름,
  `grid-template-areas`, 암묵적 트랙, `grid-auto-flow`, 자동 배치까지
- `display: block` 지원 — 자식을 세로로 쌓고 마진을 병합한다
- 번들에서 `yoga.wasm`이 빠지고 `layout.wasm`이 들어왔다
- 제목의 `!`가 말하듯 **breaking change**다. 레이아웃이 CSS 명세에 더
  가까워졌다는 건, 기존 결과물이 달라질 수 있다는 뜻이기도 하다. 예를 들어
  `flex-shrink` 기본값이 1로 바뀌었다.

이 변경은 Satori **0.37.0**에 들어갔다.

그럼 내 프로젝트는 왜 아직 막히나. 설치된 버전을 확인해봤다.

```text
next                16.4.1
└── @vercel/og       1.0.1   (2026-08-08)
    └── satori       0.29.0  (2026-07-23)
```

Satori 0.29.0은 Taffy 교체(10월 8일)보다 두 달 반 앞선 버전이다. 번들 안에
`yoga.wasm`이 그대로 있는 이유다. `@vercel/og`의 최신 버전인 1.0.3도
2026년 9월 22일 공개라 아직 그 이전이다.

**그래서 "Satori는 Grid를 지원하나?"의 답은 버전에 따라 갈린다.** 지금
인터넷에 올라와 있는 "Satori는 Flexbox만 된다"는 글들은 대부분 10월 8일
이전에 쓰인 것이고, 반대로 Satori 문서를 보고 "Grid 된다는데요"라고 하면
`next/og`로는 아직 안 된다. 확인하는 방법은 하나다. 직접 렌더해보는 것.

## 그럼 Takumi를 쓰면 되지 않나

Satori가 고쳐지길 기다리거나 `@vercel/og`가 올라오길 기다리는 것 말고,
아예 다른 렌더러를 쓰는 방법이 있다. **Takumi**는 같은 일(JSX → 이미지)을
하는 Rust 라이브러리고, Satori에서 영감을 받았다고 직접 밝히고 있다.

구조가 한 단계 짧다.

```text
Satori  :  JSX → 레이아웃 → SVG → resvg → PNG
Takumi  :  JSX → 레이아웃 → PNG          (SVG를 거치지 않는다)
```

레이아웃 엔진도 Yoga나 Taffy가 아니라 자체 구현이다. 문서는 **텍스트와 인라인
레이아웃을 Chromium의 Blink에서 이식했다**고 밝히고 있고, 지원 범위를
Flexbox·Grid·block·float·table·inline으로 적어뒀다. (Flexbox와 Grid까지 Blink
출신인지는 문서가 분명히 말하지 않는다.)

API는 `next/og`와 거의 같다. 타입 정의에 "compatible with `next/og`'s
`ImageResponse`"라고 적혀 있고, 실제로 import 경로만 바꾸면 돌아간다.

```diff
- import { ImageResponse } from "next/og";
+ import { ImageResponse } from "takumi-js/response";
```

앞에서 `next/og`로 돌렸던 것과 **똑같은 코드**를 Takumi로 돌려봤다.

| 테스트                        | `next/og` (satori 0.29)                       | `takumi-js` 2.20              |
| ----------------------------- | --------------------------------------------- | ----------------------------- |
| `display: grid`               | throw                                         | **OK**                        |
| `display` 없는 div + 자식 2개 | throw                                         | **OK**                        |
| `display: block` + 자식 2개   | throw                                         | **OK**                        |
| WOFF2 폰트                    | throw — `Unsupported OpenType signature wOF2` | **OK**                        |
| 한글 (폰트 미지정)            | OK (시스템 폰트로 대체)                       | **두부** — 폰트를 넘겨야 한다 |

마지막 줄은 함정이다. `@vercel/og`의 Node 빌드는 시스템 폰트를 찾아 쓰지만
Takumi는 넘겨준 폰트만 쓴다. 한글 블로그에서 글자를 넣을 거라면 반드시
폰트를 실어야 한다. 대신 **WOFF2를 받는다.** 이 블로그가 본문용으로 이미
가지고 있는 Pretendard 서브셋을 그대로 넘겼더니 바로 찍혔다.
`next/og`는
같은 파일을 거부한다 — ttf·otf·woff만 받는다.

속도도 재봤다. 1200×630 카드(자식 24개) 20장을 연속으로 뽑고, 워밍업 3장은
버렸다.

```text
next/og    788ms / 20장  →  39.4ms
next/og    757ms / 20장  →  37.9ms
takumi     164ms / 20장  →   8.2ms
takumi     147ms / 20장  →   7.3ms
```

약 **5배**다. SVG 문자열을 만들고 그걸 다시 파싱해서 래스터화하는 왕복이
없으니 당연하기도 하다. 다만 이건 내 윈도우 노트북에서 이 도형 구성으로 잰
한 번의 숫자다. Takumi 문서는 배수를 내걸지 않는다 — 비교는 각자 자기 그림으로
재보는 수밖에 없다.

그럼 갈아타야 하나. 공짜는 아니다.

- Takumi는 **네이티브 바인딩**이다 (Cloudflare Workers·브라우저용 WASM 빌드도
  따로 있다). 플랫폼별 프리빌드를 받으므로 `node_modules`가 15MB쯤 늘어난다.
  반면 `next/og`는 Next.js에 이미 들어 있어서 추가 의존성이 0이다.
- 아직 어린 프로젝트다. `@takumi-rs/core`의 첫 배포가 2025년 6월이고,
  1년 반 만에 397개 버전이 나왔다. 빠르게 움직이고 있다는 뜻이기도 하고,
  표면이 아직 흔들린다는 뜻이기도 하다.

이 블로그처럼 **썸네일을 빌드 때 스크립트로 몇 장 뽑고 PNG를 커밋하는**
경우라면 5배는 체감되지 않는다. 20장에 0.8초냐 0.15초냐는 차이는 없는 것과
같다. 반대로 요청마다 이미지를 만드는 서비스이거나, Grid가 꼭 필요하거나,
WOFF2밖에 없다면 갈아탈 이유가 분명하다.

## 그럼 브라우저를 쓰면 되지 않나

Satori든 Takumi든 결국 브라우저의 CSS 엔진을 흉내 낸 것이다. 그럼 흉내 내지
말고 진짜를 쓰면 되지 않나. Puppeteer나 Playwright를 쓰면 Chromium에서 HTML과
CSS를 온전히 렌더링한 뒤 스크린샷을 찍을 수 있다. CSS 제약이 아예 사라진다.
그런데도 이런 라이브러리들이 따로 만들어진 이유가 있다.

| 항목               | Satori · Takumi           | Puppeteer / Playwright  |
| ------------------ | ------------------------- | ----------------------- |
| 브라우저 실행      | 불필요                    | 필요                    |
| CSS 지원           | 일부만 (Takumi가 더 넓다) | 브라우저 수준 전부      |
| JavaScript 실행    | 불가                      | 가능                    |
| React 렌더링       | 제한된 JSX                | 실제 웹페이지           |
| 실행 비용          | 낮음                      | 높음                    |
| 메모리             | 적음                      | 브라우저 프로세스만큼   |
| 기존 페이지 재사용 | 어려움                    | 유리                    |
| 서버 환경          | WASM 또는 네이티브 바인딩 | 브라우저 설치·관리 필요 |

기능만 보면 브라우저 쪽이 압도적이다. 갈리는 건 **언제 이미지를 만드느냐**다.

동적 OG 이미지는 SNS 크롤러가 URL을 요청하는 바로 그 순간, 서버에서
만들어야 한다. 서로 다른 글 100개의 OG 이미지 요청이 동시에 들어온다고 하면,
Satori나 Takumi는 렌더 함수를 100번 부르면 되지만 Puppeteer는 브라우저 인스턴스와
페이지를 100개분 감당해야 한다. 브라우저 재사용, 페이지 풀링, 이미지 캐싱으로
최적화할 수는 있지만 그만큼 운영할 게 늘어난다. Edge 런타임처럼 브라우저를
띄울 수 없는 환경이면 선택지 자체가 없다.

다만 이 블로그는 정적 export라 사정이 좀 다르다. 썸네일은 요청마다 만드는 게
아니라 빌드 때 스크립트로 한 번 뽑아서 PNG로 커밋해둔다. 동시 요청 같은 건
애초에 없다. 이 경우엔 Puppeteer를 써도 비용 논리는 잘 성립하지 않는다.
그래도 Satori를 쓰는 건, 썸네일 몇 장 만들자고 의존성에 Chromium을 들이는
쪽이 더 부담스러워서다. **단순한 이미지 한 장을 위해 브라우저 전체를 켜는 건
필요 이상으로 무겁다.**

## 정리

- `next/og`의 `ImageResponse`는 **Satori(JSX → SVG) + resvg(SVG → PNG)** 두
  단계다. Satori 자체는 TypeScript고, 레이아웃(Yoga, C++)과 래스터화(resvg,
  Rust)만 WASM으로 실려 있다.
- PNG까지 굽는 건 SNS 호환성, 렌더링 일관성, 처리 단순화 때문이다.
- 브라우저가 없으니 브라우저 CSS 엔진도 없다. 쓸 수 있는 CSS는 Satori가 아는
  것까지다.
- **Flexbox는 1차원, Grid는 2차원**이고 Grid가 상위 호환이 아니다. Flexbox는
  내용에서 크기가 나오고 Grid는 트랙에서 나온다. `flex-wrap`으로 줄을 바꿔도
  줄끼리 열을 맞추지는 않으므로, 가로세로가 다 맞아야 하면 Grid여야 한다.
- Grid가 안 되는 건 Next.js가 아니라 Satori가 쓰던 레이아웃 엔진 **Yoga**의
  범위 때문이다.
- 2026년 10월 8일 Satori 0.37.0이 Yoga를 **Taffy**로 바꾸면서 Grid와 Block이
  들어왔다. 다만 Next.js 16.4.1이 번들한 Satori는 0.29.0이라 아직 막힌다.
- 기다리기 싫으면 **Takumi**가 있다. SVG를 거치지 않고 바로 래스터화하며
  Grid와 WOFF2가 된다. 같은 카드를 뽑는 데 5배 빨랐다. 대신 네이티브 바인딩이
  붙고 폰트를 직접 실어야 한다.
- 결론은 하나로 안 떨어진다. 빌드 때 몇 장 뽑는 정적 블로그면 `next/og`로
  충분하고, 요청마다 만들거나 Grid·WOFF2가 필요하면 Takumi가 낫다.
- 어느 쪽이든 **쓰는 버전에서 실제로 되는지는 한 번 렌더해보고 확인하는 게
  빠르다.** 이 글의 표도 전부 그렇게 만들었다.

## 참고

- [ImageResponse — Next.js 공식 문서](https://nextjs.org/docs/app/api-reference/functions/image-response) — `display: grid`는 동작하지 않는다는 문장이 여기 있다
- [Metadata and OG images — Next.js](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [CSS Flexible Box Layout (CSS Flexbox) — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout) · [CSS Grid Layout — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [Relationship of grid layout to other layout methods — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Relationship_of_grid_layout_with_other_layout_methods) — 둘을 언제 갈라 쓰는지
- [Satori 저장소](https://github.com/vercel/satori) — [CSS 지원 범위](https://github.com/vercel/satori#css)는 늘 최신 버전 기준이라 쓰는 버전과 대조해야 한다
- [PR #841 — Replace Yoga with Taffy and support `display: block` and `display: grid`](https://github.com/vercel/satori/pull/841) — 2026-10-08 머지, Satori 0.37.0
- [Yoga](https://www.yogalayout.dev/) — Meta의 레이아웃 엔진, React Native가 쓴다
- [Taffy](https://github.com/DioxusLabs/taffy) — Satori가 갈아탄 Rust 레이아웃 라이브러리
- [resvg-js](https://github.com/yisibl/resvg-js) — `@resvg/resvg-wasm`의 저장소
- [Vercel OG Playground](https://og-playground.vercel.app/) — 브라우저에서 바로 렌더해볼 수 있다
- [Takumi 문서](https://takumi.kane.tw/docs/) — [Satori와의 비교표](https://takumi.kane.tw/docs/comparison-to-satori)가 `next/og`·satori 0.63·Takumi를 나란히 놓는다
- 버전 확인: [satori](https://www.npmjs.com/package/satori) · [@vercel/og](https://www.npmjs.com/package/@vercel/og) · [takumi-js](https://www.npmjs.com/package/takumi-js)
- 본문의 에러 메시지·속도·표는 이 저장소의 `next@16.4.1`과 `takumi-js@2.20.0`으로
  직접 렌더해 확인했다
