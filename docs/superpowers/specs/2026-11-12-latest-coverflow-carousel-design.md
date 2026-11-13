# 메인 최신 글 5개를 코버플로우 캐러셀로

- 작성일: 2026-11-12
- 상태: 설계 승인됨
- 구현: 2026-11-13 (자동 넘김 제외)

> **읽기 전에.** 이 문서는 구현 전에 쓴 설계다. 손을 놓을 때의 스냅 수식
> (`velocity * 1.8`)과 파일 구조는 만들면서 뒤집혔다. 코드와 대조할 때는
> [구현 계획서의 "실제 구현과 달라진 점"](../plans/2026-11-12-latest-coverflow-carousel.md#실제-구현과-달라진-점)을
> 함께 본다. 자동 넘김은 아직 구현하지 않았다.

## 배경

메인(`/`, `/en`)은 최신 글 5개를 가로 카드 세로 스택으로 보여 준다.
[2026-10-14 메인 화면 재구성](2026-10-14-main-page-redesign-design.md)에서 3단 그리드를
걷어내고 고른 배치다. 읽기에는 지금이 낫다 — 제목 5개가 스크롤 한 번에 다 들어온다.

이번 작업은 그 결정을 **의도적으로 되돌린다.** 읽기 효율이 아니라 **메인에 움직임을
주는 것**이 목적이다. 손으로 카드를 끌면 옆 카드가 3D로 돌아가며 따라오는 화면을
만든다. 읽기 효율은 떨어지고, 그 손해는 받아들인다.

> 설계 과정에서 평면 셸프 / 코버플로우 / 덱 세 가지를 실제로 드래그해 보고
> 코버플로우를 골랐다. 보조 장치는 "화살표 + 점 + 번호", 자동 넘김은 켜는 것으로
> 정했다.

## 목표

- 최신 글 5개를 **가로 코버플로우 캐러셀**로 보여 준다. 세로 목록은 없앤다.
- 마우스·터치 **드래그**로 넘긴다. 손을 놓으면 가장 가까운 카드에 붙는다.
- 드래그를 못 하거나 모르는 방문자도 **전부 볼 수 있다** — 화살표·점·키보드.
- 지금 HTML이 갖고 있는 **제목 5개와 링크 5개를 잃지 않는다.**
- 외부 캐러셀 라이브러리를 쓰지 않는다.

### 범위에서 제외 (YAGNI)

- `Posts` 목록(`/post/...`)과 검색 모달 — 이번 작업과 무관하다.
- 무한 순환 드래그 — 5개뿐이라 양끝에서 멈추는 편이 지금 몇 번째인지 알기 쉽다.
  자동 넘김만 마지막에서 처음으로 돌아간다.
- 카드 발췌문 — 세로 카드에는 자리가 없다. 제목·날짜·태그까지만 싣는다.
- 썸네일 지연 로딩 최적화 — 5장뿐이고 이미 `loading="lazy"`가 붙어 있다.
- 메인에 보여 줄 글 개수 변경 — `LATEST_COUNT = 5` 그대로 둔다.

## 확정된 결정

### 결정 1: 세로 목록을 캐러셀로 완전히 교체

`MainArticleList`와 `MainArticleItem`은 `HomePage`에서만 쓰인다. 교체하면 둘 다
죽으므로 **삭제한다.** 남겨 두면 어느 쪽이 메인인지 읽는 사람이 헷갈린다.

`HomePage`는 서버 컴포넌트로 그대로 둔다. 빌드 시점에 글 5개를 골라 넘기는
일만 하고, 상호작용은 전부 클라이언트 경계 안쪽에서 일어난다.

```
┌──────────────────────────────────────────────┐
│              The Latest Article              │
│ ──────────────────────────────────────────── │
│                                              │
│    ╱│        ┌────────────┐        │╲        │
│  ‹ │ │       │  썸네일     │       │ │ ›      │
│    │ │       │   40:21    │       │ │        │
│    ╲│       ├────────────┤        │╱         │
│             │ 2026-11-09 │                   │
│             │ #nextjs    │            2 / 5  │
│             │ next/og는   │                  │
│             │ 왜 Grid를…  │                  │
│             └────────────┘                   │
│                                              │
│              ● ● ● ● ●                       │
│                                              │
│                모든 글 보기 →                  │
└──────────────────────────────────────────────┘
```

### 결정 2: 변환 수식은 `app/lib/`에 순수 함수로 둔다

이 기능에서 틀리기 쉬운 곳은 3D 변환 수식 하나다. 그런데 `package.json`의
테스트는 `tsx --test "app/**/*.test.ts"`라 **`components/` 아래는 영영 돌지
않는다.** 수식을 `app/lib/carousel/geometry.ts`에 순수 함수로 떼어 두고 테스트를
붙인다. DOM도 React도 필요 없는 산수라 떼어내기 쉽다.

```ts
export interface SlideTransform {
  x: number;        // px
  z: number;        // px
  rotateY: number;  // deg
  scale: number;
  opacity: number;
  zIndex: number;
}

/** 중심에서 몇 장 떨어졌는지(offset)를 받아 그 카드의 변환을 준다. */
export function slideTransform(offset: number, cardWidth: number): SlideTransform;

/** 인라인 style에 넣을 transform 문자열. */
export function transformCss(t: SlideTransform): string;
```

수식은 다음과 같다. `o`는 offset, `c = clamp(o, -3, 3)`.

| 값 | 식 |
|---|---|
| `x` | `c * cardWidth * 0.60` |
| `z` | `-abs(c) * 90` |
| `rotateY` | `-c * 36` |
| `scale` | `1 - min(abs(c), 2.4) * 0.13` |
| `opacity` | `max(0, 1 - abs(o) * 0.28)` |
| `zIndex` | `100 - round(abs(o) * 10)` |

`c`를 ±3으로 자르는 이유: 자르지 않으면 멀리 있는 카드가 화면 밖으로 끝없이
밀려나 `translateZ`가 과해지고, 브라우저가 쓸데없이 큰 레이어를 만든다.
`opacity`만 자르지 않은 `o`를 쓰는데, 잘린 위치에 멈춰 있는 카드도 계속 흐려져야
완전히 사라지기 때문이다.

### 결정 3: 초기 변환을 렌더 시점에 인라인으로 박는다

`output: "export"`라 메인 HTML은 빌드 때 만들어진다. 변환을 `useEffect`에서만
적용하면 JS가 붙기 전 첫 페인트에 **카드 5장이 가운데 겹쳐 보였다가 튄다.**

그래서 첫 렌더에서 `slideTransform(i - 0, cardWidth)`를 계산해 `style` 속성에
직접 넣는다. 서버가 만든 HTML이 이미 코버플로우 모양이고, JS는 그 값을 이어받아
갱신만 한다. 첫 렌더 값이 서버와 클라이언트에서 같으므로 hydration 경고도 없다.

`cardWidth`는 이 계산에 필요한데 CSS `clamp()` 값은 서버가 모른다. 그래서
**레이아웃 기준폭 320을 상수로 쓰고**, 실제 폭은 마운트 후 측정해 다시 계산한다.
좁은 화면에서는 첫 페인트의 간격이 조금 넓었다가 즉시 맞춰진다 — 카드가 사라지거나
자리를 잃지는 않는다.

### 결정 4: 자동 넘김은 멈출 조건을 넉넉히 둔다

저절로 움직이는 콘텐츠는 멈출 방법이 없으면 WCAG 2.2.2(Pause, Stop, Hide) 위반이다.
일시정지 버튼을 따로 만드는 대신 멈추는 조건을 넓게 잡는다.

- 주기 **4,000ms**. 마지막(5번째) 다음은 처음(1번째)으로 돌아간다.
- 다음 중 하나라도 참이면 **쉰다**: 포인터가 캐러셀 위에 있음 / 캐러셀 안에 포커스가
  있음 / 드래그 중 / `document.hidden`(다른 탭).
- 방문자가 **직접 한 번이라도 넘기면 영구 정지**한다. 드래그·화살표·점·방향키 중
  무엇이든 해당한다. 읽기 시작한 사람의 화면을 더는 건드리지 않는다.
- `prefers-reduced-motion: reduce`면 **아예 시작하지 않는다.**

### 결정 5: 동작 하나하나

| 상황 | 동작 |
|---|---|
| 드래그 | `pointermove`마다 위치를 실수로 갱신. 카드당 `cardWidth * 0.72` px |
| 양끝 | `-0.45` ~ `n-1+0.45`까지만 끌린다. 더 끌어도 안 간다 |
| 손을 놓음 | `round(pos - velocity * 1.8)`로 스냅. 빠르게 튕기면 한 장 더 간다 |
| 전환 | `transform .44s cubic-bezier(.22,.61,.36,1), opacity .44s ease` |
| 가운데 카드 클릭 | 글로 이동 |
| 옆 카드 클릭 | **글로 가지 않고** 그 카드를 가운데로 끌어온다 |
| 5px 넘게 끌고 놓음 | 클릭으로 치지 않는다 (드래그 끝에 글이 열리는 사고 방지) |
| 화살표 / 점 | 해당 카드로 이동 |
| 캐러셀에 포커스 + ← → | 이전 / 다음 |
| 카드 링크로 Tab | 그 카드가 가운데로 따라온다 |
| `prefers-reduced-motion` | 전환 시간 0. 회전은 남기되 미끄러지지 않는다 |

드래그 중에는 `transition`을 꺼야 손을 따라온다. 놓는 순간 다시 켠다.

### 결정 6: 접근성과 SEO

카드 5장은 **항상 DOM에 있다.** 가리는 수단은 `opacity`와 `transform`뿐이라
크롤러는 제목 5개와 링크 5개를 그대로 읽는다. `display:none`·`inert`·가상
스크롤은 쓰지 않는다.

- 바깥 `<section>`에 `aria-roledescription="carousel"`, `aria-label`은 사전에서
- 카드 `<article>`마다 `aria-roledescription="slide"`, `aria-label="5개 중 2번째"`
- 현재 위치를 알리는 `aria-live="polite"` 영역 하나 (`sr-only`)
- 화살표·점에 `aria-label`, 현재 점에 `aria-current="true"`
- 스테이지에 `touch-action: pan-y` — **세로 페이지 스크롤을 막지 않는다**

### 결정 7: 새 문구는 사전에 넣는다

`messages.test.ts`가 두 언어의 키가 같은지 검사하므로 양쪽에 함께 넣는다.

| 키 | ko | en |
|---|---|---|
| `carouselLabel` | `최신 글` | `Latest articles` |
| `prevSlide` | `이전 글` | `Previous article` |
| `nextSlide` | `다음 글` | `Next article` |
| `slidePosition` | `(n, total) => ${total}개 중 ${n}번째` | `(n, total) => ${n} of ${total}` |
| `goToSlide` | `(n) => ${n}번째 글로 이동` | `(n) => Go to article ${n}` |

## 구조

```
components/pages/HomePage.tsx        서버 컴포넌트 유지. MainArticleList → LatestCarousel
components/Carousel/
  LatestCarousel.tsx     "use client". 유일한 클라이언트 진입점. 상태·이벤트·자동 넘김
  CarouselCard.tsx       세로 카드 한 장. 썸네일 위 + 날짜·태그·제목 아래
  CarouselControls.tsx   화살표 2개 + 점 5개 + "n / 5"
app/lib/carousel/
  geometry.ts            slideTransform / transformCss — 순수 함수
  geometry.test.ts
app/lib/i18n/messages.ts 문구 5개 추가

삭제: components/MainArticleList.tsx, components/MainArticleItem.tsx
```

`CardImageArea` · `CardDateArea` · `CardTagsArea` · `CardTitleArea`는 **그대로
재사용한다.** 새로 만드는 것은 배치뿐이다.

### 치수

```css
--card-w: clamp(240px, 72vw, 320px);
--card-h: calc(var(--card-w) * 0.525 + 132px);  /* 썸네일 40:21 + 메타 고정 */
```

스테이지 높이는 `calc(var(--card-h) + 56px)`, `perspective: 1300px`,
`overflow: hidden`. 본문 컨테이너가 `max-w-3xl`(안쪽 720px)이라 양끝에서 카드가
잘린다. 잘린 선이 드러나지 않게 좌우에 페이드 마스크를 건다.

```css
mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
```

제목은 `line-clamp-2`로 두 줄에서 자른다. 그래야 카드 다섯 장의 높이가 같다.

## 테스트

`geometry.ts`만 자동 테스트 대상이다. 나머지는 브라우저에서 눈으로 확인한다.

**`geometry.test.ts`가 지킬 것**

1. 중심 카드(`offset = 0`)는 돌지도 줄지도 않는다 — `rotateY = 0`, `scale = 1`, `x = 0`, `opacity = 1`
2. 좌우가 대칭이다 — `offset = -1`과 `+1`의 `x`·`rotateY`는 부호만 다르고 `scale`·`opacity`는 같다
3. 멀어질수록 단조롭게 작아지고 흐려진다 — `offset` 0→1→2→3에서 `scale`과 `opacity`가 계속 줄어든다
4. `c`가 ±3에서 잘린다 — `offset = 5`와 `offset = 3`의 `x`·`rotateY`·`scale`이 같다
5. 잘린 뒤에도 `opacity`는 계속 준다 — `offset = 5`의 `opacity`가 `offset = 3`보다 작다
6. `opacity`는 0 밑으로 내려가지 않는다 — `offset = 10`에서 `0`
7. `zIndex`는 중심이 가장 크고 정수다
8. 소수 `offset`(드래그 중간 값)에서도 수식이 끊기지 않는다 — `offset = 0.5`가 0과 1 사이 값

**손으로 확인할 것** (`pnpm dev`)

- 마우스 드래그 → 놓으면 스냅
- 옆 카드 클릭 → 글로 가지 않고 가운데로 옴
- 가운데 카드 클릭 → 글이 열림
- 드래그 후 놓는 순간 글이 열리지 않음
- Tab으로 카드 링크를 훑으면 그 카드가 가운데로 옴
- 방향키 ← →
- 4초 자동 넘김, 마우스를 올리면 멈춤, 한 번 드래그하면 영구 정지
- OS "동작 줄이기"를 켜면 자동 넘김 없음·전환 없음
- 모바일 폭에서 세로 스크롤이 막히지 않음
- `pnpm build` 후 `out/index.html`에 제목 5개가 들어 있음
- JS를 끄고 메인을 열었을 때 카드가 겹쳐 보이지 않음

## 위험

**읽기 효율이 떨어진다.** 지금은 제목 5개가 한눈에 들어오는데, 캐러셀은 가운데
한 장만 제대로 읽힌다. 이건 이 작업이 감수하기로 한 손해다. "모든 글 보기" 링크는
캐러셀 아래에 그대로 둬서 전체 목록으로 가는 길을 남긴다.

**자동 넘김이 성가실 수 있다.** 결정 4의 정지 조건들이 그 대비다. 특히 "한 번이라도
직접 넘기면 영구 정지"가 핵심이다.
