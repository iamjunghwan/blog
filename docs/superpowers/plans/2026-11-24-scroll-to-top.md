# 맨 위로 버튼 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 아티클 페이지에서 화면 한 높이 이상 내려가면 오른쪽 아래에 ⤒ 아이콘 버튼이 떠서, 누르면 맨 위로 돌아간다.

**Architecture:** 서버 컴포넌트 `ArticleContent`가 글 머리에 높이 0짜리 표식을 두고 끝에 클라이언트 컴포넌트 `ScrollToTopButton`을 그린다. 버튼은 IntersectionObserver(`rootMargin: "100% 0px 0px 0px"`)로 표식을 보고 보임 여부를 정한다. 판단 로직과 표식 id는 순수 모듈 `app/lib/scroll/scroll-to-top.ts`에 두어 node:test로 검사한다.

**Tech Stack:** Next.js 16 (App Router, `output: "export"`), React 19, Tailwind 3, node:test + tsx

**설계 문서:** `docs/superpowers/specs/2026-11-24-scroll-to-top-design.md`

## Global Constraints

- 아티클 페이지(`/<slug>`, `/en/<slug>`)에만 나온다. 홈·목록·소개에는 없다
- 화면에 글자는 없다. 아이콘(⤒, 위에 가로선이 있는 위쪽 화살표)만 그린다. 24×24, `strokeWidth={1.5}`, `stroke="currentColor"`, `fill="none"` — 기존 `components/Icon/*`와 같다
- 버튼 이름(`aria-label`)은 `messages(lang).scrollToTop`: ko `"맨 위로"`, en `"Back to top"`
- scroll 이벤트를 듣지 않는다. IntersectionObserver만 쓴다
- `prefers-reduced-motion: reduce`면 즉시 이동(`behavior: "auto"`), 아니면 `"smooth"`
- 숨김 상태: `opacity-0 pointer-events-none`, `tabIndex={-1}`, `aria-hidden="true"`. 보임 상태: `opacity-100`, 탭 가능, `aria-hidden` 없음
- IntersectionObserver가 없거나 표식을 못 찾으면 버튼을 항상 보인다
- "use client" 파일에서 문자열 상수를 export해 서버 컴포넌트가 가져다 쓰지 않는다(클라이언트 참조로 바뀐다). 공유 상수는 `app/lib/scroll/scroll-to-top.ts`에 둔다
- import는 `@/` 별칭을 쓴다 (이 저장소의 관례)
- 커밋 메시지는 gitmoji + `-다`체, 끝에 `Co-Authored-By: Claude <모델 이름> <noreply@anthropic.com>`. 푸시는 하지 않는다
- blog-vanilla는 건드리지 않는다

---

### Task 1: 버튼 문구와 보임 판단 로직

**Files:**
- Modify: `app/lib/i18n/messages.ts` (타입 `Messages`, `MESSAGES.ko`, `MESSAGES.en`)
- Modify: `app/lib/i18n/messages.test.ts`
- Create: `app/lib/scroll/scroll-to-top.ts`
- Test: `app/lib/scroll/scroll-to-top.test.ts`

**Interfaces:**
- Produces:
  - `messages(lang).scrollToTop: string`
  - `SCROLL_TOP_SENTINEL_ID: "scroll-top-sentinel"`
  - `SCROLL_TOP_ROOT_MARGIN: "100% 0px 0px 0px"`
  - `isPastSentinel(entry: { isIntersecting: boolean; boundingClientRect: { top: number } }): boolean`
  - `scrollBehavior(prefersReducedMotion: boolean): ScrollBehavior` — `"auto"` | `"smooth"`

- [ ] **Step 1: 실패하는 테스트 작성**

`app/lib/i18n/messages.test.ts` 끝에 추가:

```ts
test("맨 위로 버튼 이름", () => {
  assert.equal(messages("ko").scrollToTop, "맨 위로");
  assert.equal(messages("en").scrollToTop, "Back to top");
});
```

`app/lib/scroll/scroll-to-top.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPastSentinel,
  scrollBehavior,
  SCROLL_TOP_ROOT_MARGIN,
  SCROLL_TOP_SENTINEL_ID,
} from "@/app/lib/scroll/scroll-to-top";

const entry = (isIntersecting: boolean, top: number) => ({
  isIntersecting,
  boundingClientRect: { top },
});

test("표식이 관찰 영역 안에 있으면 숨긴다", () => {
  assert.equal(isPastSentinel(entry(true, -100)), false);
  assert.equal(isPastSentinel(entry(true, 50)), false);
});

test("표식이 화면 위로 한 높이 넘게 지나가면 보인다", () => {
  assert.equal(isPastSentinel(entry(false, -2000)), true);
});

test("표식이 화면 아래에 있어 안 보이는 것은 지나간 것이 아니다", () => {
  // 글 머리가 화면 아래에 있는 경우(아주 작은 창 등)에는 보이지 않는다.
  assert.equal(isPastSentinel(entry(false, 900)), false);
});

test("움직임 줄이기 설정이면 즉시 이동한다", () => {
  assert.equal(scrollBehavior(true), "auto");
  assert.equal(scrollBehavior(false), "smooth");
});

test("표식 id와 관찰 여백", () => {
  assert.equal(SCROLL_TOP_SENTINEL_ID, "scroll-top-sentinel");
  assert.equal(SCROLL_TOP_ROOT_MARGIN, "100% 0px 0px 0px");
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm exec tsx --test app/lib/i18n/messages.test.ts app/lib/scroll/scroll-to-top.test.ts`
Expected: FAIL — `scrollToTop` 단언이 `undefined`로 실패하고, `scroll-to-top.test.ts`는 모듈을 찾지 못한다

- [ ] **Step 3: messages.ts에 문구 추가**

`Messages` 타입의 `aboutSince` 아래에:

```ts
  /** 아티클 페이지의 맨 위로 버튼. 화면에는 아이콘만 보이고 이 문구는 aria-label이다. */
  scrollToTop: string;
```

`MESSAGES.ko`의 `aboutSince` 줄 아래에 `scrollToTop: "맨 위로",`, `MESSAGES.en`의 `aboutSince` 줄 아래에 `scrollToTop: "Back to top",`를 넣는다.

- [ ] **Step 4: scroll-to-top.ts 작성**

`app/lib/scroll/scroll-to-top.ts`:

```ts
/****************************************
 *
 * 맨 위로 버튼의 판단 로직
 *
 * 버튼(components/Button/ScrollToTopButton.tsx)은 "use client" 파일이다.
 * 그 파일에서 상수를 export 하면 서버 컴포넌트(ArticleContent)가 가져갈 때
 * 값이 아니라 클라이언트 참조가 된다. 그래서 둘이 함께 쓰는 id는 여기 둔다.
 * 판단 함수도 DOM 없이 node:test로 검사하려고 여기 둔다.
 *
 ****************************************/

/** ArticleContent가 글 머리에 두는 높이 0짜리 표식 */
export const SCROLL_TOP_SENTINEL_ID = "scroll-top-sentinel";

/**
 * 관찰 영역을 화면 위로 한 높이만큼 늘린다.
 * 표식이 이 영역 밖(화면 위쪽)으로 나가면 = 한 화면 넘게 내려왔다.
 */
export const SCROLL_TOP_ROOT_MARGIN = "100% 0px 0px 0px";

type SentinelEntry = {
  isIntersecting: boolean;
  boundingClientRect: { top: number };
};

/** 표식이 관찰 영역을 벗어나 위쪽에 있으면 버튼을 보인다. */
export function isPastSentinel(entry: SentinelEntry): boolean {
  return !entry.isIntersecting && entry.boundingClientRect.top < 0;
}

export function scrollBehavior(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}
```

- [ ] **Step 5: 통과 확인**

Run: `pnpm exec tsx --test app/lib/i18n/messages.test.ts app/lib/scroll/scroll-to-top.test.ts`
Expected: PASS — messages 6개, scroll-to-top 5개

- [ ] **Step 6: 폰트 서브셋**

`messages.ts`는 폰트 서브셋의 UI 소스다. "맨 위로"에 서브셋에 없는 글자가 있으면 폰트 테스트가 실패한다.

Run: `pnpm exec tsx --test app/lib/fonts/subset.test.ts`
실패하면 Run: `pnpm fonts` (원본 폰트를 내려받는다. `.next/cache`에 있으면 재사용) 후 다시 테스트. Expected: PASS

- [ ] **Step 7: 전체 테스트**

Run: `pnpm test`
Expected: 전부 PASS

- [ ] **Step 8: 커밋**

```bash
git add app/lib/i18n/messages.ts app/lib/i18n/messages.test.ts app/lib/scroll public/fonts
git commit -m "✨ feat: 맨 위로 버튼의 문구와 보임 판단을 더한다"
```

`public/fonts`는 `pnpm fonts`를 돌렸을 때만 바뀐다.

---

### Task 2: 아이콘, 버튼, 글 페이지 연결

**Files:**
- Create: `components/Icon/ArrowUpToLineIcon.tsx`
- Create: `components/Button/ScrollToTopButton.tsx`
- Modify: `components/Article/ArticleContent.tsx`

**Interfaces:**
- Consumes: `messages(lang).scrollToTop`, `SCROLL_TOP_SENTINEL_ID`, `SCROLL_TOP_ROOT_MARGIN`, `isPastSentinel`, `scrollBehavior` (Task 1)
- Produces: `<ScrollToTopButton lang={lang} />` (default export), `<ArrowUpToLineIcon className=... />` (default export)

DOM 동작이라 node:test로 돌리지 않는다. 판단은 Task 1의 테스트가 덮고, 여기서는 빌드 결과와 브라우저로 확인한다.

- [ ] **Step 1: 아이콘 작성**

`components/Icon/ArrowUpToLineIcon.tsx`:

```tsx
/** 위에 가로선이 있는 위쪽 화살표(⤒). "맨 위까지"를 뜻한다. stroke가 currentColor라 글자색을 따라간다. */
export default function ArrowUpToLineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4.5h14M12 20V9m0 0-5 5m5-5 5 5" />
    </svg>
  );
}
```

- [ ] **Step 2: 버튼 작성**

`components/Button/ScrollToTopButton.tsx`:

```tsx
/****************************************
 *
 * ScrollToTopButton : 아티클 페이지의 맨 위로 버튼
 *
 * 글 머리의 표식(ArticleContent가 그린다)을 IntersectionObserver로 본다.
 * 관찰 영역을 화면 위로 한 높이 늘려 두었으므로, 표식이 그 밖으로 나가면
 * 한 화면 넘게 내려온 것이다. scroll 이벤트는 듣지 않는다.
 *
 * 숨어 있을 때는 투명할 뿐 아니라 탭 이동과 낭독기에서도 빠진다.
 * 감지할 수 없으면(IntersectionObserver 없음, 표식 없음) 항상 보인다 —
 * 숨겨 두는 것보다 안전하다.
 *
 ****************************************/
"use client";

import { useEffect, useState } from "react";
import ArrowUpToLineIcon from "@/components/Icon/ArrowUpToLineIcon";
import { messages } from "@/app/lib/i18n/messages";
import {
  isPastSentinel,
  scrollBehavior,
  SCROLL_TOP_ROOT_MARGIN,
  SCROLL_TOP_SENTINEL_ID,
} from "@/app/lib/scroll/scroll-to-top";
import type { Lang } from "@/app/lib/posts/types";

export default function ScrollToTopButton({ lang }: { lang: Lang }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById(SCROLL_TOP_SENTINEL_ID);
    if (sentinel === null || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(isPastSentinel(entry)),
      { rootMargin: SCROLL_TOP_ROOT_MARGIN },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: scrollBehavior(reduce) });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={messages(lang).scrollToTop}
      aria-hidden={visible ? undefined : true}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-md transition-opacity duration-200 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-800 motion-reduce:transition-none ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <ArrowUpToLineIcon className="h-5 w-5" />
    </button>
  );
}
```

`z-40`: 메뉴 오버레이와 검색 모달이 `z-50`이라 그 아래에 놓인다.

- [ ] **Step 3: ArticleContent에 연결**

`components/Article/ArticleContent.tsx`:

import에 추가:

```tsx
import ScrollToTopButton from "@/components/Button/ScrollToTopButton";
import { SCROLL_TOP_SENTINEL_ID } from "@/app/lib/scroll/scroll-to-top";
```

`return` 부분을 바꾼다:

```tsx
  return (
    <article>
      {/* 맨 위로 버튼이 이 표식을 지켜본다. 높이가 없어 레이아웃에 영향이 없다. */}
      <div id={SCROLL_TOP_SENTINEL_ID} aria-hidden="true"></div>
      {/* children으로 넘기므로 아래 조각들은 서버에서 그려진 채로 전달된다. */}
      <ArticleInteractions>
        <div dangerouslySetInnerHTML={{ __html: head }}></div>
        <ArticleMeta date={date} tags={tags} lang={lang} />
        {rest !== "" && (
          <div
            className="article-rest"
            dangerouslySetInnerHTML={{ __html: rest }}
          ></div>
        )}
      </ArticleInteractions>
      <ScrollToTopButton lang={lang} />
    </article>
  );
```

- [ ] **Step 4: 테스트와 빌드**

Run: `pnpm test`
Expected: 전부 PASS

Run: `pnpm build`
Expected: 성공

Run: `grep -c 'scroll-top-sentinel' out/react-intro.html out/en/react-intro.html out/index.html out/about.html` (글 slug는 `ls out/*.html`에서 아무 글 하나로 바꿔 쓴다)
Expected: 글 두 개는 1 이상, `index.html`·`about.html`은 0

Run: `grep -o 'aria-label="맨 위로"' out/<글>.html` 와 `grep -o 'aria-label="Back to top"' out/en/<글>.html`
Expected: 각각 한 줄

- [ ] **Step 5: 브라우저 확인**

Run: `pnpm dev` (다른 dev 서버가 떠 있으면 `pnpm dev -p 3001`)

긴 글 하나에서 확인한다:
1. 맨 위에서는 버튼이 없다
2. 화면 한 높이쯤 내리면 오른쪽 아래에 ⤒ 버튼이 나타난다
3. 누르면 맨 위로 부드럽게 올라가고 버튼이 사라진다
4. 다크모드에서 색이 맞다
5. 모바일 폭(개발자 도구 375px)에서 본문을 크게 가리지 않는다
6. 숨어 있을 때 Tab으로 버튼에 가지 않는다. 보일 때는 간다
7. `/en/<글>`에서도 동작한다
8. 홈·목록·소개에는 버튼이 없다
9. 검색 모달이나 메뉴를 열면 버튼이 그 아래에 깔린다

dev 서버를 끈다.

- [ ] **Step 6: 커밋**

```bash
git add components/Icon/ArrowUpToLineIcon.tsx components/Button/ScrollToTopButton.tsx components/Article/ArticleContent.tsx
git commit -m "✨ feat: 아티클 페이지에 맨 위로 버튼을 단다"
```

- [ ] **Step 7: 작업 기록**

`docs/worklog/2026-11-24-scroll-to-top.md`에 무엇을 왜 했는지, 확인 결과를 `-다`체로 짧게 남기고 커밋한다:

```bash
git add docs/worklog/2026-11-24-scroll-to-top.md
git commit -m "📝 docs: 맨 위로 버튼 작업 기록을 남긴다"
```
