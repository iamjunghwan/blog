# 메인 최신 글 코버플로우 캐러셀 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인(`/`, `/en`)의 최신 글 5개를 세로 목록에서 드래그 가능한 3D 코버플로우 캐러셀로 바꾼다.

**Architecture:** `HomePage`는 서버 컴포넌트로 남아 빌드 시점에 글을 고르고, 본문(`body`)을 뺀 최소 정보만 클라이언트 컴포넌트 `LatestCarousel`에 넘긴다. 3D 변환 수식은 DOM과 무관한 순수 함수로 `app/lib/carousel/geometry.ts`에 떼어 내 단위 테스트를 붙인다. 드래그 중에는 React state를 갱신하지 않고 `ref`에 담은 위치값으로 DOM style을 직접 쓴다 — 포인터 이벤트마다 카드 5장을 다시 렌더하지 않기 위해서다.

**Tech Stack:** Next.js 16.4.1 (`output: "export"`), React 19, TypeScript 5, Tailwind CSS 3.4, `node:test` + `tsx`

**설계 문서:** [2026-11-12-latest-coverflow-carousel-design.md](../specs/2026-11-12-latest-coverflow-carousel-design.md)

## Global Constraints

- **커밋은 사용자 승인 후에만 한다.** 각 Task의 커밋 단계는 작성해 두되, 사용자가 "커밋해"라고 할 때까지 실행하지 않는다.
- 커밋 메시지는 앞에 이모지를 붙이고, 마지막 줄에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` 를 넣는다.
- **외부 캐러셀·애니메이션 라이브러리를 추가하지 않는다.** `package.json` 의존성은 변하지 않는다.
- 테스트 러너는 `tsx --test "app/**/*.test.ts"` 다. **`app/` 밖이나 `.tsx` 파일에 둔 테스트는 영원히 실행되지 않는다.**
- 주석과 테스트 이름은 한국어로 쓴다. 기존 파일들의 `/**** ... ****/` 헤더 주석 형식을 따른다.
- 모든 화면 문구는 `app/lib/i18n/messages.ts` 사전을 거친다. 컴포넌트에 한국어/영어를 직접 적지 않는다.
- 다크 모드는 `html.dark` 선택자를 쓴다 (globals.css 기존 방식).
- `output: "export"` 정적 사이트다. 서버 전용 API(`cookies`, `headers`, 동적 라우트 핸들러)를 쓸 수 없다.
- 변환 수식의 정확한 값 (`offset` = 중심에서 떨어진 거리, `W` = 카드 폭):

  | 값 | 식 |
  |---|---|
  | `x` | `clamp(offset, -3, 3) * W * 0.6` |
  | `z` | `-abs(clamp(offset, -3, 3)) * 90` |
  | `rotateY` | `-clamp(offset, -3, 3) * 36` |
  | `scale` | `1 - min(abs(clamp(offset, -3, 3)), 2.4) * 0.13` |
  | `opacity` | `max(0, 1 - abs(offset) * 0.28)` |
  | `zIndex` | `100 - round(abs(offset) * 10)` |

- 상수: 서버 렌더 기준 카드 폭 `320`, 드래그 비율 `0.72`, 튕김 가중치 `1.8`, 클릭 판정 `5`px, 양끝 여유 `0.45`, 자동 넘김 `4000`ms, 전환 `0.44s cubic-bezier(0.22, 0.61, 0.36, 1)`.

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `app/lib/carousel/geometry.ts` | offset → 변환값. 순수 함수. DOM·React 없음 |
| `app/lib/carousel/geometry.test.ts` | 위 함수의 단위 테스트 |
| `app/lib/posts/types.ts` | `CarouselSlide` 타입 추가 (본문 제외 최소 정보) |
| `app/lib/i18n/messages.ts` | 캐러셀 문구 5개 추가 |
| `app/globals.css` | `.carousel-*` 규칙. Tailwind 3에 없는 perspective·mask |
| `components/Carousel/CarouselCard.tsx` | 세로 카드 한 장의 내용. 위치·회전은 모름 |
| `components/Carousel/CarouselControls.tsx` | 화살표 2개 + 점 5개 + "n / 5" |
| `components/Carousel/LatestCarousel.tsx` | `"use client"`. 위치 상태·드래그·자동 넘김 |
| `components/pages/HomePage.tsx` | 글을 골라 최소 정보로 줄여 넘긴다 |
| ~~`components/MainArticleList.tsx`~~ | 삭제 |
| ~~`components/MainArticleItem.tsx`~~ | 삭제 |

### 설계 문서에 없던 결정: 본문을 클라이언트로 넘기지 않는다

`MainArticleList`는 서버 컴포넌트라 `Post` 전체를 받아도 아무 비용이 없었다.
`LatestCarousel`은 클라이언트 컴포넌트라 **props가 전부 직렬화되어 HTML에 실린다.**
`Post`에는 마크다운 본문 `body`가 통째로 들어 있어, 그대로 넘기면 글 5편 분량의
마크다운(수십 KB)이 메인 HTML에 복사된다.

그래서 `CarouselSlide`라는 최소 타입을 만들고 `HomePage`에서 줄여 넘긴다.
썸네일 경로를 정하는 `thumbnailOf()`는 `body`를 읽어야 하므로 **서버에서 미리
실행해 결과 문자열만** 넘긴다. 같은 이유로 만들어진 선례가 이미 있다 —
검색 모달에 넘기는 `SearchEntry`가 그것이다.

---

## Task 1: 변환 수식

**Files:**
- Create: `app/lib/carousel/geometry.ts`
- Test: `app/lib/carousel/geometry.test.ts`

**Interfaces:**
- Consumes: 없음 (이 프로젝트의 첫 순수 모듈)
- Produces:
  - `interface SlideTransform { x: number; z: number; rotateY: number; scale: number; opacity: number; zIndex: number }`
  - `function slideTransform(offset: number, cardWidth: number): SlideTransform`
  - `function transformCss(t: SlideTransform): string`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/lib/carousel/geometry.test.ts` 를 새로 만든다.

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { slideTransform, transformCss } from "@/app/lib/carousel/geometry";

/** 서버 렌더 기준 카드 폭. 테스트 전체가 이 값을 쓴다. */
const W = 320;

test("가운데 카드는 돌지도 줄지도 흐려지지도 않는다", () => {
  const t = slideTransform(0, W);
  assert.equal(t.x, 0);
  assert.equal(t.z, 0);
  assert.equal(t.rotateY, 0);
  assert.equal(t.scale, 1);
  assert.equal(t.opacity, 1);
});

test("좌우가 대칭이다", () => {
  const left = slideTransform(-1, W);
  const right = slideTransform(1, W);
  assert.equal(left.x, -right.x);
  assert.equal(left.rotateY, -right.rotateY);
  assert.equal(left.z, right.z);
  assert.equal(left.scale, right.scale);
  assert.equal(left.opacity, right.opacity);
  assert.equal(left.zIndex, right.zIndex);
});

test("멀어질수록 작아지고 흐려진다", () => {
  const steps = [0, 1, 2, 3].map((offset) => slideTransform(offset, W));
  for (let i = 1; i < steps.length; i++) {
    assert.ok(steps[i].scale < steps[i - 1].scale, `scale가 ${i}에서 줄지 않았다`);
    assert.ok(steps[i].opacity < steps[i - 1].opacity, `opacity가 ${i}에서 줄지 않았다`);
  }
});

test("3장 너머는 같은 자리에 겹쳐 둔다", () => {
  // 자르지 않으면 멀리 있는 카드가 화면 밖으로 끝없이 밀려나고
  // translateZ가 과해져 브라우저가 쓸데없이 큰 레이어를 만든다.
  const edge = slideTransform(3, W);
  const far = slideTransform(5, W);
  assert.equal(far.x, edge.x);
  assert.equal(far.z, edge.z);
  assert.equal(far.rotateY, edge.rotateY);
  assert.equal(far.scale, edge.scale);
});

test("겹친 뒤에도 투명도는 계속 떨어진다", () => {
  // 자리는 멈춰도 사라지기는 해야 한다. 안 그러면 멀리 있는 카드가
  // 가장자리에 흐릿하게 박힌 채 영영 남는다.
  assert.ok(slideTransform(5, W).opacity < slideTransform(3, W).opacity);
});

test("투명도는 0 밑으로 내려가지 않는다", () => {
  assert.equal(slideTransform(10, W).opacity, 0);
  assert.equal(slideTransform(-10, W).opacity, 0);
});

test("zIndex는 가운데가 가장 크고 항상 정수다", () => {
  assert.equal(slideTransform(0, W).zIndex, 100);
  assert.ok(slideTransform(1, W).zIndex < slideTransform(0, W).zIndex);
  // 드래그 중에는 offset이 소수로 들어온다. CSS z-index는 정수만 받는다.
  assert.ok(Number.isInteger(slideTransform(1.5, W).zIndex));
});

test("드래그 중간값은 양옆 두 칸 사이에 놓인다", () => {
  const half = slideTransform(0.5, W);
  const zero = slideTransform(0, W);
  const one = slideTransform(1, W);
  assert.ok(half.x > zero.x && half.x < one.x);
  assert.ok(half.scale < zero.scale && half.scale > one.scale);
  assert.ok(half.opacity < zero.opacity && half.opacity > one.opacity);
});

test("transformCss는 네 변환을 순서대로 잇는다", () => {
  // 부동소수점 오차를 피하려고 값을 직접 넣는다.
  const css = transformCss({
    x: 192,
    z: -90,
    rotateY: -36,
    scale: 0.87,
    opacity: 0.72,
    zIndex: 90,
  });
  assert.equal(css, "translateX(192px) translateZ(-90px) rotateY(-36deg) scale(0.87)");
});

test("카드 폭이 커지면 가로 간격만 비례해서 커진다", () => {
  const narrow = slideTransform(1, 240);
  const wide = slideTransform(1, 320);
  assert.ok(wide.x > narrow.x);
  // 회전·축소는 폭과 무관하다. 좁은 화면에서도 같은 각도로 돌아야 한다.
  assert.equal(narrow.rotateY, wide.rotateY);
  assert.equal(narrow.scale, wide.scale);
  assert.equal(narrow.z, wide.z);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `pnpm test`

Expected: FAIL — `Cannot find module '@/app/lib/carousel/geometry'` 또는 그에 준하는 해석 실패.

- [ ] **Step 3: 구현한다**

`app/lib/carousel/geometry.ts` 를 새로 만든다.

```ts
/****************************************
 *
 * 코버플로우 카드 한 장의 3D 변환
 *
 * 중심에서 몇 장 떨어졌는지(offset)만 받아 그 카드가 어디에 어떻게 놓일지를 준다.
 * DOM도 React도 모른다 — 이 기능에서 유일하게 틀리기 쉬운 곳이 이 산수라서,
 * 테스트가 돌 수 있는 자리(app/lib)에 떼어 두었다.
 *
 * offset은 정수가 아니다. 드래그 중에는 1.37 같은 값이 들어오고, 그 중간값에서도
 * 수식이 매끄럽게 이어져야 카드가 손을 따라온다.
 *
 ****************************************/

/** 이만큼 떨어진 카드부터는 자리를 고정한다. 투명도만 계속 떨어진다. */
const MAX_OFFSET = 3;
/** scale이 과하게 작아지지 않도록 거리에 두는 상한. */
const MAX_SCALE_DISTANCE = 2.4;

export interface SlideTransform {
  /** 가로 이동 (px) */
  x: number;
  /** 깊이 (px). 음수가 뒤쪽이다 */
  z: number;
  /** Y축 회전 (deg) */
  rotateY: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * @param offset 중심에서 떨어진 칸 수. 오른쪽이 양수. 소수 가능
 * @param cardWidth 카드 한 장의 폭 (px)
 */
export function slideTransform(offset: number, cardWidth: number): SlideTransform {
  const capped = clamp(offset, -MAX_OFFSET, MAX_OFFSET);
  const cappedDistance = Math.abs(capped);
  // opacity만 자르지 않은 거리를 쓴다. 자리는 멈춰도 사라지기는 해야 한다.
  const distance = Math.abs(offset);

  return {
    x: capped * cardWidth * 0.6,
    z: -cappedDistance * 90,
    rotateY: -capped * 36,
    scale: 1 - Math.min(cappedDistance, MAX_SCALE_DISTANCE) * 0.13,
    opacity: Math.max(0, 1 - distance * 0.28),
    zIndex: 100 - Math.round(distance * 10),
  };
}

/** style 속성에 넣을 transform 문자열. opacity와 zIndex는 따로 넣는다. */
export function transformCss(t: SlideTransform): string {
  return `translateX(${t.x}px) translateZ(${t.z}px) rotateY(${t.rotateY}deg) scale(${t.scale})`;
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `pnpm test`

Expected: PASS. 기존 117개 + 새로 10개 = `pass 127`, `fail 0`.

- [ ] **Step 5: 커밋 (승인 후)**

```bash
git add app/lib/carousel/geometry.ts app/lib/carousel/geometry.test.ts
git commit -F- <<'EOF'
✨ feat: 코버플로우 카드의 3D 변환 수식

중심에서 떨어진 칸 수를 받아 x·z·rotateY·scale·opacity·zIndex를 준다.
DOM을 모르는 순수 함수라 app/lib에 둔다 — 테스트 러너가
app/**/*.test.ts만 글로브해서, components 아래에 두면 영영 안 돌아간다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 2: 캐러셀 문구

**Files:**
- Modify: `app/lib/i18n/messages.ts` (`Messages` 타입과 `MESSAGES` 두 언어 블록)
- Test: `app/lib/i18n/messages.test.ts` (끝에 테스트 2개 추가)

**Interfaces:**
- Consumes: 없음
- Produces: `messages(lang)` 가 돌려주는 객체에 다음 5개가 생긴다.
  - `carouselLabel: string`
  - `prevSlide: string`
  - `nextSlide: string`
  - `slidePosition: (current: number, total: number) => string`
  - `goToSlide: (n: number) => string`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/lib/i18n/messages.test.ts` 맨 아래에 붙인다.

```ts
test("캐러셀 위치 문구는 현재와 전체를 받아 만든다", () => {
  assert.equal(messages("ko").slidePosition(2, 5), "5개 중 2번째");
  assert.equal(messages("en").slidePosition(2, 5), "2 of 5");
});

test("점 버튼 문구는 번호를 받아 만든다", () => {
  assert.equal(messages("ko").goToSlide(3), "3번째 글로 이동");
  assert.equal(messages("en").goToSlide(3), "Go to article 3");
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `pnpm test`

Expected: FAIL — `messages("ko").slidePosition is not a function`.

- [ ] **Step 3: 구현한다**

`app/lib/i18n/messages.ts` 의 `Messages` 타입에서 `daysAgo` 줄 **아래**에 붙인다.

```ts
  daysAgo: (days: number) => string;
  carouselLabel: string;
  prevSlide: string;
  nextSlide: string;
  slidePosition: (current: number, total: number) => string;
  goToSlide: (n: number) => string;
};
```

`MESSAGES.ko` 의 `daysAgo` 줄 **아래**에 붙인다.

```ts
    daysAgo: (days) => `${days}일 전`,
    carouselLabel: "최신 글",
    prevSlide: "이전 글",
    nextSlide: "다음 글",
    slidePosition: (current, total) => `${total}개 중 ${current}번째`,
    goToSlide: (n) => `${n}번째 글로 이동`,
  },
```

`MESSAGES.en` 의 `daysAgo` 줄 **아래**에 붙인다.

```ts
    daysAgo: (days) => `${days} days ago`,
    carouselLabel: "Latest articles",
    prevSlide: "Previous article",
    nextSlide: "Next article",
    slidePosition: (current, total) => `${current} of ${total}`,
    goToSlide: (n) => `Go to article ${n}`,
  },
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `pnpm test`

Expected: PASS, `pass 129`, `fail 0`. 기존 "두 언어 사전의 키가 같다" 테스트도 계속 통과해야 한다 — 한쪽에만 넣었다면 여기서 걸린다.

- [ ] **Step 5: 커밋 (승인 후)**

```bash
git add app/lib/i18n/messages.ts app/lib/i18n/messages.test.ts
git commit -F- <<'EOF'
🌐 feat: 캐러셀 문구를 두 언어 사전에 넣는다

화살표·점의 aria-label과 "n / 5" 위치 안내. 스크린리더가 읽는 문구라
화면에 안 보여도 언어를 가려야 한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 3: 버튼으로 넘기는 캐러셀 (드래그 전)

이 Task가 끝나면 메인이 캐러셀로 바뀌고 화살표·점·키보드로 전부 넘길 수 있다.
드래그와 자동 넘김은 아직 없다.

**Files:**
- Modify: `app/lib/posts/types.ts` (파일 끝에 `CarouselSlide` 추가)
- Modify: `app/globals.css` (파일 끝에 `.carousel-*` 블록 추가)
- Create: `components/Carousel/CarouselCard.tsx`
- Create: `components/Carousel/CarouselControls.tsx`
- Create: `components/Carousel/LatestCarousel.tsx`
- Modify: `components/pages/HomePage.tsx` (전체 교체)
- Delete: `components/MainArticleList.tsx`, `components/MainArticleItem.tsx`

**Interfaces:**
- Consumes:
  - `slideTransform(offset: number, cardWidth: number): SlideTransform` (Task 1)
  - `transformCss(t: SlideTransform): string` (Task 1)
  - `messages(lang).carouselLabel | prevSlide | nextSlide | slidePosition | goToSlide` (Task 2)
  - 기존 그대로: `CardImageArea`, `CardDateArea`, `CardTagsArea`, `CardTitleArea`, `localePath`, `thumbnailOf`, `postsIn`, `allPosts`, `ALL_TAG`
- Produces:
  - `type CarouselSlide = Pick<PostMeta, "slug" | "title" | "date" | "tags"> & { thumbnailSrc: string }`
  - `LatestCarousel({ slides, lang }: { slides: CarouselSlide[]; lang: Lang })` — Task 4·5가 이 파일을 이어서 고친다
  - CSS 클래스 `.carousel`, `.carousel-stage`, `.carousel-slide`, `.carousel-thumb`, `.carousel-arrow`, `.carousel-arrow-prev`, `.carousel-arrow-next`, `.carousel-dot`, 그리고 Task 4가 켜고 끌 `.is-dragging`

- [ ] **Step 1: `CarouselSlide` 타입을 추가한다**

`app/lib/posts/types.ts` 맨 아래, `SearchEntry` 선언 **아래**에 붙인다.

```ts
/**
 * 메인 캐러셀에 넘기는 최소 정보.
 *
 * 캐러셀은 클라이언트 컴포넌트라 props가 전부 직렬화되어 HTML에 실린다.
 * Post를 그대로 넘기면 마크다운 본문(body) 다섯 편이 메인 HTML에 복사된다.
 * 썸네일 경로는 body를 읽어야 정해지므로 서버에서 thumbnailOf()를 미리 돌리고
 * 결과 문자열만 넘긴다. SearchEntry와 같은 이유로 만든 타입이다.
 */
export type CarouselSlide = Pick<PostMeta, "slug" | "title" | "date" | "tags"> & {
  /** thumbnailOf()가 서버에서 결정한 최종 경로 */
  thumbnailSrc: string;
};
```

- [ ] **Step 2: CSS를 추가한다**

`app/globals.css` **맨 끝**에 붙인다 (기존 `@media (prefers-reduced-motion: reduce)` 블록 아래).

```css
/**
 * 메인 최신 글 코버플로우 캐러셀.
 *
 * Tailwind 3에는 perspective·mask-image 유틸리티가 없어 여기에 직접 적는다.
 * 카드 폭 --card-w 하나에서 카드 높이와 스테이지 높이까지 끌어내, 반응형 분기를
 * 한 군데로 모았다. 0.525는 썸네일 비율 21/40이고 132px은 메타 영역 고정 높이다.
 */
.carousel {
  --card-w: clamp(240px, 72vw, 320px);
  --card-h: calc(var(--card-w) * 0.525 + 132px);
  position: relative;
}

.carousel-stage {
  position: relative;
  height: calc(var(--card-h) + 56px);
  overflow: hidden;
  perspective: 1300px;
  cursor: grab;
  /* 가로만 가져간다. 모바일에서 세로 페이지 스크롤을 막으면 안 된다. */
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  /* 본문 폭(max-w-3xl)에서 멀리 있는 카드가 잘린다. 그 직선을 감춘다. */
  -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
}

.carousel-stage.is-dragging {
  cursor: grabbing;
}

.carousel-slide {
  position: absolute;
  top: 28px;
  left: 50%;
  width: var(--card-w);
  margin-left: calc(var(--card-w) / -2);
  transition: transform 0.44s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.44s ease;
  will-change: transform, opacity;
}

/* 드래그 중에는 전환을 꺼야 카드가 손을 따라온다. */
.carousel-stage.is-dragging .carousel-slide {
  transition: none;
}

/* 썸네일을 끌면 브라우저의 이미지 드래그가 먼저 집어간다. */
.carousel-slide img {
  -webkit-user-drag: none;
}

/* CardImageArea의 img가 가진 rounded-lg를 끈다. 카드 위쪽 모서리만 둥글어야 한다. */
.carousel-thumb img {
  border-radius: 0;
}

/* 화살표는 스테이지 밖에 둔다. 안에 두면 가장자리 페이드 마스크에 함께 흐려진다. */
.carousel-arrow {
  position: absolute;
  top: calc((var(--card-h) + 56px) / 2);
  transform: translateY(-50%);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.12);
}

.carousel-arrow-prev {
  left: 0;
}

.carousel-arrow-next {
  right: 0;
}

.carousel-arrow:disabled {
  opacity: 0.35;
  cursor: default;
}

html.dark .carousel-arrow {
  border-color: #374151;
  background: #111827;
  color: #d1d5db;
}

.carousel-dot {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #d1d5db;
  transition: width 0.3s ease, background 0.3s ease;
}

.carousel-dot.is-current {
  width: 22px;
  border-radius: 4px;
  background: #2563eb;
}

html.dark .carousel-dot {
  background: #374151;
}

html.dark .carousel-dot.is-current {
  background: #60a5fa;
}

@media (prefers-reduced-motion: reduce) {
  .carousel-slide,
  .carousel-dot {
    transition: none;
  }
}
```

- [ ] **Step 3: 카드를 만든다**

`components/Carousel/CarouselCard.tsx` 를 새로 만든다.

```tsx
/****************************************
 *
 * CarouselCard : 코버플로우 카드 한 장 (세로형)
 *
 * 썸네일 위, 글 정보 아래. MainArticleItem(가로형)과 달리 폭이 좁아 발췌문을
 * 싣지 않는다. 메타 영역 높이를 132px로 못박는 이유는 다섯 장의 높이가 같아야
 * 하기 때문이다 — 높이가 제각각이면 회전축이 어긋나 카드가 들쭉날쭉 돌아간다.
 *
 * 자기가 몇 번째인지, 어디에 놓이는지는 모른다. 그건 LatestCarousel이 쥔다.
 *
 ****************************************/

import { localePath } from "@/app/lib/i18n/paths";
import CardImageArea from "@/components/Card/CardImageArea";
import CardDateArea from "@/components/Card/CardDateArea";
import CardTagsArea from "@/components/Card/CardTagsArea";
import CardTitleArea from "@/components/Card/CardTitleArea";
import type { CarouselSlide, Lang } from "@/app/lib/posts/types";

interface CarouselCardProps {
  slide: CarouselSlide;
  lang: Lang;
  /** 첫 장만 즉시 받아온다. 나머지는 lazy */
  priority: boolean;
}

const CarouselCard = ({ slide, lang, priority }: CarouselCardProps) => {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <CardImageArea
        src={slide.thumbnailSrc}
        priority={priority}
        className="carousel-thumb w-full aspect-[40/21] overflow-hidden"
      />
      <div className="h-[132px] px-4 py-3">
        <CardDateArea
          date={slide.date}
          lang={lang}
          className="flex items-center text-xs mb-1"
        />
        <CardTagsArea
          tags={slide.tags}
          lang={lang}
          className="relative z-10 flex flex-wrap gap-2 mb-1"
          linkClassName="text-xs text-blue-600 dark:text-blue-400 uppercase no-underline"
        />
        {/*
          after:absolute after:inset-0 으로 카드 전체를 제목 링크의 클릭 영역으로
          만든다. 기준이 되는 position 요소는 바깥의 .carousel-slide(absolute)다.
        */}
        <CardTitleArea
          title={slide.title}
          slug={localePath(lang, `/${slide.slug}`)}
          className="flex"
          linkClassName="after:absolute after:inset-0"
        />
      </div>
    </article>
  );
};

export default CarouselCard;
```

- [ ] **Step 4: 조작 장치를 만든다**

`components/Carousel/CarouselControls.tsx` 를 새로 만든다.

```tsx
/****************************************
 *
 * CarouselControls : 화살표 · 점 · 번호
 *
 * 드래그를 못 하거나 모르는 방문자가 글 다섯 개에 닿는 유일한 길이다.
 * 장식이 아니라 접근성 장치라서, 보기에 번잡하다고 빼면 안 된다.
 *
 * 상태를 갖지 않는다. 지금 몇 번째인지는 받아서 그리기만 한다.
 *
 ****************************************/

import { messages } from "@/app/lib/i18n/messages";
import type { Lang } from "@/app/lib/posts/types";

interface CarouselControlsProps {
  lang: Lang;
  /** 0부터 센다 */
  current: number;
  total: number;
  onSelect: (index: number) => void;
}

const CarouselControls = ({ lang, current, total, onSelect }: CarouselControlsProps) => {
  const m = messages(lang);

  return (
    <>
      <button
        type="button"
        className="carousel-arrow carousel-arrow-prev"
        aria-label={m.prevSlide}
        disabled={current === 0}
        onClick={() => onSelect(current - 1)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        className="carousel-arrow carousel-arrow-next"
        aria-label={m.nextSlide}
        disabled={current === total - 1}
        onClick={() => onSelect(current + 1)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="mt-4 flex items-center justify-center gap-4">
        <ul className="flex list-none items-center gap-2">
          {Array.from({ length: total }, (_, i) => (
            <li key={i}>
              <button
                type="button"
                className={i === current ? "carousel-dot is-current" : "carousel-dot"}
                aria-label={m.goToSlide(i + 1)}
                aria-current={i === current ? "true" : undefined}
                onClick={() => onSelect(i)}
              />
            </li>
          ))}
        </ul>
        {/*
          번호를 점 옆에 둔다. 스테이지 안(설계 스케치의 오른쪽 아래)에 두면
          가장자리 페이드 마스크에 함께 흐려져 읽히지 않는다.
        */}
        <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
          {current + 1} / {total}
        </span>
      </div>
    </>
  );
};

export default CarouselControls;
```

- [ ] **Step 5: 캐러셀 본체를 만든다 (드래그 없이)**

`components/Carousel/LatestCarousel.tsx` 를 새로 만든다.

```tsx
/****************************************
 *
 * LatestCarousel : 메인 최신 글 코버플로우
 *
 * 이 블로그의 유일한 클라이언트 경계. 바깥(HomePage)은 서버 컴포넌트로 남는다.
 *
 * 첫 렌더에서 변환값을 inline style로 박는다. output: "export" 라 메인 HTML은
 * 빌드 때 만들어지는데, useEffect에서만 적용하면 JS가 붙기 전 첫 페인트에
 * 카드 다섯 장이 가운데 겹쳐 보였다가 튄다. 서버는 CSS clamp()의 실제 값을
 * 모르므로 BASE_CARD_WIDTH로 그려 두고, 마운트 후 실제 폭을 재어 다시 칠한다.
 *
 ****************************************/
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import CarouselCard from "@/components/Carousel/CarouselCard";
import CarouselControls from "@/components/Carousel/CarouselControls";
import { slideTransform, transformCss } from "@/app/lib/carousel/geometry";
import { messages } from "@/app/lib/i18n/messages";
import type { CarouselSlide, Lang } from "@/app/lib/posts/types";

/** 서버가 첫 HTML을 그릴 때 쓰는 카드 폭. CSS --card-w의 최대값과 같다. */
const BASE_CARD_WIDTH = 320;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface LatestCarouselProps {
  slides: CarouselSlide[];
  lang: Lang;
}

const LatestCarousel = ({ slides, lang }: LatestCarouselProps) => {
  const total = slides.length;
  const m = messages(lang);

  const stageRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLLIElement | null)[]>([]);
  /** 실수 위치. 드래그 중 매 프레임 바뀌므로 state로 두지 않는다. */
  const posRef = useRef(0);
  const cardWidthRef = useRef(BASE_CARD_WIDTH);
  /** 화살표·점·aria가 보는 정수 위치. */
  const [current, setCurrent] = useState(0);

  /** posRef를 읽어 카드 다섯 장의 style을 직접 쓴다. 리렌더 없음. */
  const paint = useCallback(() => {
    const width = cardWidthRef.current;
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const t = slideTransform(i - posRef.current, width);
      el.style.transform = transformCss(t);
      el.style.opacity = String(t.opacity);
      el.style.zIndex = String(t.zIndex);
    });
  }, []);

  /**
   * 정수 위치로 자리잡는다. 전환 애니메이션이 붙는다.
   * Math.round는 방어적이다 — 드래그가 끝날 때 넘어오는 값은 이미 정수지만,
   * 여기서 한 번 더 자르지 않으면 current가 소수가 되어 점 다섯 개가 전부
   * 꺼진 상태가 될 수 있다.
   */
  const settle = useCallback(
    (next: number) => {
      posRef.current = clamp(Math.round(next), 0, total - 1);
      setCurrent(posRef.current);
      paint();
    },
    [paint, total]
  );

  // 실제 카드 폭을 재어 다시 칠한다. 창 크기가 바뀌면 다시 잰다.
  useEffect(() => {
    const measure = () => {
      const first = slideRefs.current[0];
      // offsetWidth는 레이아웃 폭이라 transform(scale)의 영향을 받지 않는다.
      if (first) cardWidthRef.current = first.offsetWidth;
      paint();
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [paint]);

  /** 첫 렌더용 style. 서버와 클라이언트가 같은 값을 내야 hydration 경고가 없다. */
  const initialStyle = (index: number): CSSProperties => {
    const t = slideTransform(index, BASE_CARD_WIDTH);
    return { transform: transformCss(t), opacity: t.opacity, zIndex: t.zIndex };
  };

  /** 카드 링크로 Tab이 들어오면 그 카드를 가운데로 데려온다. */
  const handleFocusCapture = (e: React.FocusEvent<HTMLElement>) => {
    const slide = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
    if (!slide) return;
    const index = Number(slide.dataset.index);
    if (index !== current) settle(index);
  };

  /** 옆 카드를 누르면 글로 가지 않고 가운데로 데려온다. */
  const handleClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    const slide = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
    if (!slide) return;
    const index = Number(slide.dataset.index);
    if (index !== current) {
      e.preventDefault();
      settle(index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      settle(current - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      settle(current + 1);
    }
  };

  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label={m.carouselLabel}
      onKeyDown={handleKeyDown}
      onFocusCapture={handleFocusCapture}
      onClickCapture={handleClickCapture}
    >
      <div ref={stageRef} className="carousel-stage">
        <ul className="list-none">
          {slides.map((slide, i) => (
            <li
              key={slide.slug}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              data-index={i}
              className="carousel-slide"
              style={initialStyle(i)}
              aria-roledescription="slide"
              aria-label={m.slidePosition(i + 1, total)}
            >
              <CarouselCard slide={slide} lang={lang} priority={i === 0} />
            </li>
          ))}
        </ul>
      </div>

      <CarouselControls lang={lang} current={current} total={total} onSelect={settle} />

      {/* 위치가 바뀐 걸 스크린리더에 알린다. 눈에는 보이지 않는다. */}
      <p className="sr-only" aria-live="polite">
        {m.slidePosition(current + 1, total)}
      </p>
    </section>
  );
};

export default LatestCarousel;
```

- [ ] **Step 6: HomePage를 바꾼다**

`components/pages/HomePage.tsx` 를 통째로 아래 내용으로 바꾼다.

```tsx
/****************************************
 *
 * HomePage : 메인 본체
 *
 * 라우트 파일이 아니라 여기에 둔다. 한국어(/)와 영어(/en)가 같은 화면을 쓰는데
 * 루트 레이아웃이 달라 라우트 파일을 둘로 나눠야 하기 때문이다. 본체가 하나면
 * 한쪽만 고쳐져 두 언어가 어긋나는 일이 없다.
 *
 * 서버 컴포넌트로 남는다. 캐러셀은 클라이언트라 props가 전부 HTML에 실리므로,
 * 마크다운 본문을 뺀 CarouselSlide로 줄여서 넘긴다.
 *
 ****************************************/

import Link from "next/link";
import InnerHeader from "@/components/Layout/InnerHeader";
import LatestCarousel from "@/components/Carousel/LatestCarousel";
import { allPosts } from "@/app/lib/posts/repository";
import { postsIn } from "@/app/lib/posts/queries";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import { localePath } from "@/app/lib/i18n/paths";
import { messages } from "@/app/lib/i18n/messages";
import { ALL_TAG } from "@/app/lib/posts/constants";
import type { CarouselSlide, Lang } from "@/app/lib/posts/types";

/** 메인에 보여줄 글 개수. 이 값만 쓴다. */
const LATEST_COUNT = 5;

const HomePage = ({ lang }: { lang: Lang }) => {
  const slides: CarouselSlide[] = postsIn(allPosts(), lang)
    .slice(0, LATEST_COUNT)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      tags: post.tags,
      // body를 읽어야 정해진다. 서버에서 끝내고 결과만 넘긴다.
      thumbnailSrc: thumbnailOf(post),
    }));

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <LatestCarousel slides={slides} lang={lang} />
      <div className="flex justify-center py-8">
        <Link
          href={localePath(lang, `/post/${ALL_TAG}/1`)}
          className="font-semibold text-blue-600 dark:text-blue-400"
        >
          {messages(lang).allPosts}
        </Link>
      </div>
    </>
  );
};

export default HomePage;
```

- [ ] **Step 7: 죽은 파일을 지운다**

```bash
git rm components/MainArticleList.tsx components/MainArticleItem.tsx
```

- [ ] **Step 8: 아무도 두 파일을 참조하지 않는지 확인한다**

Run: `grep -rn "MainArticleList\|MainArticleItem" --include=*.tsx --include=*.ts . --exclude-dir=node_modules`

Expected: 출력 없음 (종료 코드 1).

- [ ] **Step 9: 타입과 린트를 확인한다**

Run: `npx tsc --noEmit && pnpm lint`

Expected: 둘 다 에러 없음.

- [ ] **Step 10: 브라우저에서 확인한다**

Run: `pnpm dev` 후 http://localhost:3000 과 http://localhost:3000/en

확인할 것:
1. 가운데 카드 한 장이 정면, 양옆 카드가 비스듬히 누워 보인다
2. 오른쪽 화살표를 누르면 카드가 돌아가며 넘어간다
3. 1번째에서 왼쪽 화살표가, 5번째에서 오른쪽 화살표가 흐려지고 눌리지 않는다
4. 점을 누르면 그 카드로 간다. 현재 점만 길쭉한 파란 막대다
5. 점 옆에 "1 / 5" 가 현재 위치를 따라 바뀐다
6. 가운데 카드를 클릭하면 글이 열린다
7. **옆 카드를 클릭하면 글이 열리지 않고 가운데로 온다**
8. Tab을 연달아 누르면 포커스가 간 카드가 가운데로 따라온다
9. 카드에 포커스를 둔 채 ← → 를 누르면 넘어간다
10. 다크 모드로 바꿔도 화살표·점·카드 색이 맞는다
11. 브라우저 폭을 400px까지 줄여도 카드가 깨지지 않고, 세로 스크롤이 된다
12. 아래 "모든 글 보기 →" 링크가 그대로 있다

- [ ] **Step 11: 커밋 (승인 후)**

```bash
git add app/lib/posts/types.ts app/globals.css components/Carousel components/pages/HomePage.tsx
git commit -F- <<'EOF'
✨ feat: 메인 최신 글을 코버플로우 캐러셀로 바꾼다

세로 목록을 걷어내고 가운데 한 장이 정면을 보는 3D 캐러셀을 놓는다.
화살표·점·방향키·Tab으로 다섯 글 전부에 닿을 수 있다. 드래그는 다음 작업.

본문(body)은 클라이언트로 넘기지 않는다. 캐러셀이 클라이언트 컴포넌트라
props가 전부 HTML에 실려서, Post를 그대로 주면 마크다운 다섯 편이
메인 HTML에 복사된다. CarouselSlide로 줄이고 썸네일 경로는 서버에서 정한다.

MainArticleList·MainArticleItem은 HomePage에서만 쓰여 함께 지운다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 4: 드래그

**Files:**
- Modify: `components/Carousel/LatestCarousel.tsx`

**Interfaces:**
- Consumes: Task 3이 만든 `LatestCarousel`의 `posRef`, `cardWidthRef`, `paint`, `settle`, `stageRef`, `clamp`, `total`, CSS의 `.is-dragging`
- Produces: Task 5가 이어서 고칠 지점들 —
  - `const drag = useRef({ active, startX, startPos, lastX, lastT, velocity, moved })`
  - `handlePointerDown(e: React.PointerEvent<HTMLDivElement>)` — Task 5가 여기에 `setPaused(true)` 를 넣는다
  - `handlePointerUp()` — Task 5가 여기에 `setPaused(false)` 와 `setStopped(true)` 를 넣는다
  - 상수 `CLICK_SLOP` — Task 5가 영구 정지 판정에 다시 쓴다

- [ ] **Step 1: 상수를 추가한다**

`components/Carousel/LatestCarousel.tsx` 의 `BASE_CARD_WIDTH` 선언 **아래**에 붙인다.

```ts
/** 카드 한 장을 넘기는 데 필요한 드래그 거리 = 카드 폭 × 이 비율. */
const DRAG_RATIO = 0.72;
/** 손을 놓을 때 속도(px/ms)를 얼마나 더 밀어 줄지. 튕기면 한 장 더 간다. */
const FLICK_WEIGHT = 1.8;
/** 이보다 적게 움직였으면 드래그가 아니라 클릭이다. */
const CLICK_SLOP = 5;
/** 양끝에서 더 끌리는 여유. 끝에 닿았다는 감각을 준다. */
const OVERDRAG = 0.45;
```

- [ ] **Step 2: 드래그 상태를 담을 ref를 추가한다**

`const [current, setCurrent] = useState(0);` **아래**에 붙인다.

```ts
  /**
   * 드래그 한 번 동안만 사는 값들. state로 두면 pointermove마다 리렌더가 난다.
   * moved는 "이번 드래그에서 가장 멀리 움직인 거리"로, 손을 놓을 때
   * 클릭이었는지 드래그였는지 가른다.
   */
  const drag = useRef({
    active: false,
    startX: 0,
    startPos: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    moved: 0,
  });
```

- [ ] **Step 3: 포인터 핸들러를 추가한다**

`handleFocusCapture` 선언 **위**에 붙인다.

```ts
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 마우스는 왼쪽 버튼만. 터치·펜은 button이 0이라 그대로 통과한다.
    if (e.pointerType === "mouse" && e.button !== 0) return;

    drag.current = {
      active: true,
      startX: e.clientX,
      startPos: posRef.current,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
      moved: 0,
    };
    // 포인터를 붙잡아 둔다. 스테이지 밖으로 나가도 move/up이 여기로 온다.
    e.currentTarget.setPointerCapture(e.pointerId);
    stageRef.current?.classList.add("is-dragging");
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;

    const dx = e.clientX - d.startX;
    d.moved = Math.max(d.moved, Math.abs(dx));
    posRef.current = clamp(
      d.startPos - dx / (cardWidthRef.current * DRAG_RATIO),
      -OVERDRAG,
      total - 1 + OVERDRAG
    );
    paint();

    const dt = e.timeStamp - d.lastT;
    if (dt > 0) {
      d.velocity = (e.clientX - d.lastX) / dt;
      d.lastX = e.clientX;
      d.lastT = e.timeStamp;
    }
  };

  const handlePointerUp = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;

    // settle 전에 꺼야 전환 애니메이션이 붙는다.
    stageRef.current?.classList.remove("is-dragging");
    // Task 5: 여기서 자동 넘김을 영구 정지시킨다 (d.moved > CLICK_SLOP 일 때)
    settle(Math.round(posRef.current - d.velocity * FLICK_WEIGHT));
  };
```

- [ ] **Step 4: 드래그 끝의 클릭을 막는다**

`handleClickCapture` 를 아래 내용으로 바꾼다.

```ts
  /**
   * 옆 카드를 누르면 글로 가지 않고 가운데로 데려온다.
   * 그리고 드래그 끝에 따라오는 click을 막는다 — 안 막으면 카드를 쓸어 넘긴
   * 손가락이 그대로 글을 연다.
   */
  const handleClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    if (drag.current.moved > CLICK_SLOP) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = 0;
      return;
    }

    const slide = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
    if (!slide) return;
    const index = Number(slide.dataset.index);
    if (index !== current) {
      e.preventDefault();
      settle(index);
    }
  };
```

- [ ] **Step 5: 스테이지에 핸들러를 붙인다**

`<div ref={stageRef} className="carousel-stage">` 를 아래로 바꾼다.

```tsx
      <div
        ref={stageRef}
        className="carousel-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        // 브라우저 기본 이미지·텍스트 드래그가 먼저 집어가지 못하게 한다.
        onDragStart={(e) => e.preventDefault()}
      >
```

- [ ] **Step 6: 타입과 린트를 확인한다**

Run: `npx tsc --noEmit && pnpm lint`

Expected: 둘 다 에러 없음.

- [ ] **Step 7: 브라우저에서 확인한다**

Run: `pnpm dev` 후 http://localhost:3000

확인할 것:
1. 카드를 잡고 끌면 **손을 실시간으로 따라온다** (끊겨 보이면 `.is-dragging` 전환 끄기가 안 된 것)
2. 손을 놓으면 가장 가까운 카드로 부드럽게 붙는다
3. 빠르게 튕기면 한 장 더 간다
4. 1번째에서 오른쪽으로, 5번째에서 왼쪽으로 끌면 조금만 끌리다 되돌아온다
5. **카드를 끌고 놓았을 때 글이 열리지 않는다**
6. 제자리에서 그냥 클릭하면 글이 열린다
7. 썸네일을 끌어도 브라우저의 이미지 드래그(반투명 유령 이미지)가 생기지 않는다
8. 스테이지 밖으로 마우스가 나가도 드래그가 이어진다
9. 화살표 버튼을 눌러도 드래그가 시작되지 않는다 (화살표는 스테이지 밖에 있다)
10. 휴대폰 또는 반응형 모드에서 **세로로 쓸면 페이지가 스크롤되고, 가로로 쓸면 카드가 넘어간다**

- [ ] **Step 8: 커밋 (승인 후)**

```bash
git add components/Carousel/LatestCarousel.tsx
git commit -F- <<'EOF'
✨ feat: 캐러셀을 마우스·터치로 끌 수 있게

pointermove마다 React state를 건드리지 않는다. 실수 위치는 ref에 두고
카드 다섯 장의 style을 직접 쓴다 — state로 하면 한 번 끌 때마다
리렌더가 수십 번 난다.

5px 넘게 끌었으면 뒤따라오는 click을 막는다. 안 막으면 카드를 쓸어 넘긴
손가락이 그대로 글을 연다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 5: 자동 넘김과 동작 줄이기

**Files:**
- Modify: `components/Carousel/LatestCarousel.tsx`

**Interfaces:**
- Consumes: Task 4가 만든 `handlePointerDown`/`handlePointerUp`, `drag`, `CLICK_SLOP`, `settle`, `current`
- Produces: 없음 (마지막 동작 Task)

- [ ] **Step 1: 상수를 추가한다**

`OVERDRAG` 선언 **아래**에 붙인다.

```ts
/** 자동 넘김 주기. */
const AUTOPLAY_MS = 4000;
```

- [ ] **Step 2: 상태 두 개를 추가한다**

`const [current, setCurrent] = useState(0);` **아래**에 붙인다.

```ts
  /**
   * 자동 넘김을 멈추는 두 가지 방식.
   *
   * stopped: 방문자가 직접 한 번이라도 넘겼다. 영구 정지. 읽기 시작한 사람의
   *          화면을 더는 건드리지 않는다.
   * paused:  포인터가 위에 있거나, 포커스가 안에 있거나, 끌고 있는 중. 임시.
   *
   * 멈출 방법 없이 저절로 움직이는 콘텐츠는 WCAG 2.2.2(Pause, Stop, Hide)
   * 위반이다. 일시정지 버튼을 따로 두는 대신 멈추는 조건을 넓게 잡았다.
   */
  const [stopped, setStopped] = useState(false);
  const [paused, setPaused] = useState(false);
  /** OS의 "동작 줄이기" 설정. 켜져 있으면 자동 넘김을 아예 하지 않는다. */
  const [reducedMotion, setReducedMotion] = useState(false);
```

- [ ] **Step 3: "동작 줄이기" 설정을 읽는다**

카드 폭을 재는 `useEffect` **아래**에 붙인다.

```ts
  // 초기값을 false로 두는 건 서버 렌더와 맞추기 위해서다. 서버는 이 설정을
  // 알 수 없다. 화면에 그려지는 것이 달라지지 않으므로 hydration 경고는 없다.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
```

- [ ] **Step 4: 자동 넘김을 추가한다**

Step 3의 `useEffect` **아래**에 붙인다.

```ts
  useEffect(() => {
    if (stopped || paused || reducedMotion || total < 2) return;

    const id = window.setInterval(() => {
      // 다른 탭에 가 있으면 넘기지 않는다. 돌아왔을 때 저 혼자
      // 네 칸쯤 가 있으면 어디를 보고 있었는지 잃는다.
      if (document.hidden) return;
      settle((Math.round(posRef.current) + 1) % total);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [stopped, paused, reducedMotion, total, settle]);
```

- [ ] **Step 5: 직접 넘기면 영구 정지시킨다**

`settle` 선언 **아래**에 붙인다.

```ts
  /** 방문자가 직접 넘겼다. 자동 넘김을 영구 정지하고 이동한다. */
  const navigate = useCallback(
    (next: number) => {
      setStopped(true);
      settle(next);
    },
    [settle]
  );
```

`handleKeyDown` 의 `settle(...)` 두 곳을 `navigate(...)` 로 바꾼다.

```ts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      navigate(current - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      navigate(current + 1);
    }
  };
```

`<CarouselControls ... onSelect={settle} />` 를 `onSelect={navigate}` 로 바꾼다.

`handlePointerUp` 의 `// Task 5: ...` 주석 줄을 아래로 바꾼다.

```ts
    if (d.moved > CLICK_SLOP) setStopped(true);
```

> `handleClickCapture`의 "옆 카드를 가운데로"는 `settle` 그대로 둔다. Tab으로
> 따라오는 `handleFocusCapture`도 마찬가지다. 설계에서 영구 정지 대상으로 잡은
> 것은 드래그·화살표·점·방향키 네 가지다.

- [ ] **Step 6: 포인터·포커스로 임시 정지시킨다**

`handlePointerDown` 안, `stageRef.current?.classList.add("is-dragging");` **아래**에 붙인다.

```ts
    setPaused(true);
```

`handlePointerUp` 안, `stageRef.current?.classList.remove("is-dragging");` **아래**에 붙인다.

```ts
    setPaused(false);
```

`<section className="carousel" ...>` 에 네 개를 더한다.

```tsx
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label={m.carouselLabel}
      onKeyDown={handleKeyDown}
      onFocusCapture={handleFocusCapture}
      onClickCapture={handleClickCapture}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
```

> `onFocus`/`onBlur`는 React에서 버블링된다 (네이티브 focusin/focusout에 대응).
> 그래서 카드 링크나 화살표에 포커스가 들어와도 여기서 잡힌다.

- [ ] **Step 7: 자동 넘김이 스크린리더에 말을 걸지 않게 한다**

`aria-live` 영역을 그대로 두면 4초마다 "5개 중 3번째"를 읽어 준다. 화면을 보지
않는 사람에게는 끝없이 끼어드는 소리가 된다. **방문자가 직접 넘긴 뒤부터만** 읽도록
`stopped`를 조건으로 건다. 자동 넘김과 직접 넘김은 `stopped`로 정확히 갈린다.

`<p className="sr-only" aria-live="polite">` 블록을 아래로 바꾼다.

```tsx
      {/*
        위치가 바뀐 걸 스크린리더에 알린다. 눈에는 보이지 않는다.
        단, 방문자가 직접 넘긴 뒤부터만 읽는다 — 자동 넘김까지 읽어 주면
        화면을 보지 않는 사람에게 4초마다 끼어드는 소리가 된다.
      */}
      <p className="sr-only" aria-live="polite">
        {stopped ? m.slidePosition(current + 1, total) : ""}
      </p>
```

- [ ] **Step 8: 타입과 린트를 확인한다**

Run: `npx tsc --noEmit && pnpm lint`

Expected: 둘 다 에러 없음.

- [ ] **Step 9: 브라우저에서 확인한다**

Run: `pnpm dev` 후 http://localhost:3000

확인할 것:
1. 가만히 두면 **4초마다** 다음 카드로 넘어간다
2. 5번째 다음에 1번째로 돌아간다
3. 마우스를 캐러셀 위에 올리면 멈추고, 치우면 다시 넘어간다
4. Tab으로 캐러셀 안에 포커스를 두면 멈춘다
5. **카드를 한 번 끌면 그 뒤로 영영 자동으로 넘어가지 않는다**
6. 화살표·점·방향키도 마찬가지로 영구 정지시킨다
7. 다른 탭으로 갔다가 돌아와도 그 사이에 여러 칸 밀려 있지 않다
8. Windows 설정 → 접근성 → 시각 효과 → "애니메이션 효과"를 끄면
   자동 넘김이 없고 카드가 미끄러지지 않고 즉시 바뀐다
   (끄고 켤 때 페이지를 새로 고치지 않아도 반영된다)
9. 개발자 도구 Elements에서 `.sr-only` 문단이 자동 넘김 중에는 비어 있고,
   화살표를 누른 뒤부터 "5개 중 n번째"가 들어찬다

- [ ] **Step 10: 커밋 (승인 후)**

```bash
git add components/Carousel/LatestCarousel.tsx
git commit -F- <<'EOF'
✨ feat: 캐러셀 자동 넘김과 동작 줄이기 대응

4초마다 넘어가되 멈추는 조건을 넓게 뒀다. 마우스를 올리거나, 포커스가
들어오거나, 끌고 있거나, 다른 탭에 가 있으면 쉰다. 방문자가 직접 한 번이라도
넘기면 그때부터 영구 정지한다 — 읽기 시작한 사람의 화면을 더 건드리지 않는다.

멈출 방법 없이 저절로 움직이는 콘텐츠는 WCAG 2.2.2 위반이라, 일시정지 버튼을
따로 두는 대신 이 조건들로 풀었다. OS "동작 줄이기"가 켜져 있으면 아예
시작하지 않는다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## Task 6: 빌드 검증과 작업 기록

**Files:**
- Create: `docs/worklog/2026-11-12-latest-coverflow-carousel.md`

**Interfaces:**
- Consumes: Task 1~5의 결과물 전부
- Produces: 없음

- [ ] **Step 1: 전체 테스트를 돌린다**

Run: `pnpm test`

Expected: `pass 129`, `fail 0`.

- [ ] **Step 2: 정적 빌드를 돌린다**

Run: `pnpm build`

Expected: 에러 없이 끝나고 `out/` 이 생긴다.

- [ ] **Step 3: 빌드된 HTML에 글 5개가 다 들어 있는지 확인한다**

메인 HTML에 제목 다섯 개와 글 링크 다섯 개가 그대로 있어야 한다. 캐러셀이
카드를 `opacity`와 `transform`으로만 가리므로 크롤러는 전부 읽는다.

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('out/index.html', 'utf8');
const hrefs = [...html.matchAll(/<a[^>]+href=\"\/([a-z0-9-]+)\"/g)].map(m => m[1]);
const slides = [...html.matchAll(/data-index=\"(\d)\"/g)].length;
console.log('카드 수:', slides);
console.log('글 링크:', [...new Set(hrefs)].join(', '));
"
```

Expected: `카드 수: 5` 그리고 최신 글 5개의 slug가 모두 나온다.

- [ ] **Step 4: 본문이 HTML에 새어 나가지 않았는지 확인한다**

`CarouselSlide`로 줄인 것이 실제로 효과가 있었는지 본다.

```bash
node -e "
const fs = require('fs');
const size = fs.statSync('out/index.html').size;
console.log('out/index.html:', (size / 1024).toFixed(1), 'KB');
"
```

Expected: 300KB 미만. 본문이 새어 나갔다면 글 다섯 편 분량만큼 커져 있다.
크다면 `HomePage`가 `Post`를 그대로 넘기고 있지 않은지 확인한다.

- [ ] **Step 5: JS 없이 열어 본다**

Run: `npx serve out` (또는 `python -m http.server 8000 --directory out`)

브라우저 개발자 도구 → 설정 → Debugger → "Disable JavaScript" 를 켜고 메인을 연다.

Expected:
- 카드 다섯 장이 가운데 겹쳐 보이지 **않는다** (코버플로우 모양 그대로)
- 가운데 카드 제목을 클릭하면 글로 간다
- 아래 "모든 글 보기 →" 링크가 동작한다

- [ ] **Step 6: 작업 기록을 쓴다**

`docs/worklog/2026-11-12-latest-coverflow-carousel.md` 를 만든다. 담을 내용:

- 무엇을 왜 바꿨는지 — 읽기 효율을 내주고 움직임을 얻기로 한 교환
- 설계 과정에서 세 가지(평면 셸프·코버플로우·덱)를 실제로 끌어 보고 골랐다는 것
- 본문을 클라이언트로 넘기지 않으려고 `CarouselSlide`를 만든 이유와
  Step 4에서 잰 실제 `out/index.html` 크기
- 자동 넘김에 붙인 정지 조건들과 그 근거(WCAG 2.2.2)
- `MainArticleList`·`MainArticleItem`을 지웠다는 것
- 남은 것: 5번째 카드는 1번 위치에서 투명도가 0이라 보이지 않는다.
  점과 "n / 5"가 그 사실을 대신 알린다

- [ ] **Step 7: 커밋 (승인 후)**

```bash
git add docs/worklog/2026-11-12-latest-coverflow-carousel.md
git commit -F- <<'EOF'
📝 docs: 메인 캐러셀 작업 기록

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

---

## 되돌리는 법

캐러셀이 마음에 들지 않으면 Task 3의 커밋 하나만 되돌리면 세로 목록으로 돌아온다.
`MainArticleList`·`MainArticleItem`이 그 커밋에서 함께 지워졌으므로 같이 살아난다.

```bash
git revert <Task 3의 커밋 해시>
```

Task 4·5(드래그·자동 넘김)는 `LatestCarousel.tsx`만 건드리므로, Task 3을 되돌리면
함께 사라진다. Task 1·2(변환 수식·문구)는 남지만 아무도 쓰지 않을 뿐 해롭지 않다.

---

## 실제 구현과 달라진 점

위 계획은 **구현 전에** 쓴 것이다. 그대로 두는 이유는 "무엇을 결정하고 시작했는가"가
기록의 핵심이라서다. 다만 아래 네 가지는 만들면서 뒤집혔으므로, 코드를 읽을 때는
이 절을 기준으로 삼는다.

### 1. 튕김 상수 — `FLICK_WEIGHT = 1.8` 폐기

계획의 식 `round(pos - velocity * 1.8)`은 **단위가 맞지 않았다.** `velocity`는 px/ms인데
그걸 칸 수에서 바로 뺐다. 보통 손 속도(약 2px/ms)로 300px을 끌면 1번에서 5번으로
날아갔고, 카드 폭이 달라져도 튕김 거리가 그대로였다. 계획의 검증 기준 3번
("빠르게 튕기면 한 장 더 간다")과 계획의 수식이 서로 모순이었던 셈이다.

```
flick = clamp(velocity * FLICK_MS / (cardWidth * DRAG_RATIO), -1, 1)
                        ───────────   ──────────────────────
                        속도→거리(px)   거리→칸 수
```

`FLICK_MS = 120`, `FLICK_MAX_CARDS = 1`로 대체했다. 튕김 세기는 `FLICK_MS` 하나로
조절한다. 브라우저 실측으로 잡았고, `app/lib/carousel/drag.test.ts`의
"튕김은 카드 폭에 반비례한다"가 이 회귀를 고정한다.

### 2. 포인터 캡처 시점 — `pointerdown` → 5px 문턱 이후

계획은 `pointerdown`에서 바로 `setPointerCapture`를 걸라고 했다. 그러면 Chrome이
뒤따라오는 `click`의 target을 캡처한 요소로 바꿔 버려 **카드 링크가 영영 눌리지
않는다.** 실측: `click`의 target이 `A`가 아니라 `DIV.carousel-stage`로 찍혔고,
제자리 클릭 후에도 URL이 `/` 그대로였다.

`moved > CLICK_SLOP`을 넘은 뒤에 잡는다. 그 뒤의 `click`은 어차피 드래그 꼬리라
막을 대상이므로 손해가 없다.

### 3. 파일 구조 — 세 층으로 가름

계획은 `LatestCarousel.tsx` 한 파일에 상태·이벤트·자동 넘김을 모두 두었다.
305줄이 되면서 "무엇이 그려지는가"와 "어떻게 움직이는가"를 번갈아 읽어야 했다.

```
app/lib/carousel/geometry.ts        카드 한 장의 3D 변환      ← 테스트 돎
app/lib/carousel/drag.ts            손의 움직임 → 칸 수       ← 테스트 돎
components/Carousel/useCoverflow.ts React·DOM 배선 (산수 없음)
components/Carousel/LatestCarousel.tsx  JSX만 (81줄)
```

기준은 "테스트가 돌 수 있는가"다. `package.json`의 글롭이 `app/**/*.test.ts`라
`components/` 아래 코드는 영영 검사되지 않는다. 위 1번 버그가 정확히 그 경계
바깥에 있었다.

### 4. CSS 세 군데 보강

계획의 CSS에 빠져 있던 것들로, 전부 실측으로 찾았다.

| 증상 | 원인 | 수정 |
|---|---|---|
| 3D가 아예 안 걸림 | `perspective`는 직계 자식에만 걸리는데 카드는 `stage > ul > li`로 손자 | `.carousel-stage > ul { transform-style: preserve-3d }` |
| 점을 손가락으로 못 누름 | 버튼이 8×8px (WCAG 2.5.8은 24×24) | 버튼을 24×24로, 보이는 점은 `::before` |
| 옆 카드 포커스 시 레이아웃이 밀림 | `overflow: hidden`은 프로그램 스크롤이 가능 | `overflow: clip` (+`hidden` 폴백) |

### 되돌리는 법 (위 "되돌리는 법" 절 갱신)

계획과 달리 커밋이 Task 단위가 아니라 **층 단위**로 나뉘었다.

```bash
git revert <ed2d614>   # 화면: 캐러셀 교체 + 드래그. 세로 목록이 함께 살아난다
git revert <a268296>   # 산수: 되돌리지 않아도 해롭지 않다 (아무도 쓰지 않을 뿐)
```

### 아직 안 한 것

**Task 5(자동 넘김 + reduced motion)는 구현하지 않았다.** 지금은 가만히 두면
넘어가지 않는다. 계획의 Task 5는 그대로 유효하되, 붙이는 자리가 `LatestCarousel`이
아니라 `useCoverflow`의 `handlePointerDown` / `handlePointerUp`이다. 그 두 곳에
표시를 남겨 두었다.
