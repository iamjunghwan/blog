# 메인 화면 재구성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인(`/`)의 최신 글 5개를 가로 카드 세로 스택으로 바꾸고, 30일 이내 글의 날짜에 "오늘 / 어제 / N일 전"을 덧붙인다.

**Architecture:** 날짜 계산은 `now`를 인자로 받는 순수 함수(`app/lib/date/relative.ts`)로 분리해 단위 테스트한다. `CardDateArea`만 클라이언트 컴포넌트로 바꿔 마운트 후 상대 표기를 덧붙인다 — 정적 사이트라 빌드 시점에 계산하면 값이 HTML에 박히기 때문이다. 메인 레이아웃은 기존 `components/Card/*` atom을 조합한 `MainArticleItem` 한 줄짜리 컴포넌트를 새로 만들고, `MainArticleList`는 그것을 단순히 나열한다.

**Tech Stack:** Next.js 16 App Router (`output: "export"`), React 19, Tailwind CSS 3.4, `node:test` + `node:assert/strict`를 `tsx`로 실행

## Global Constraints

- **커밋은 사용자가 허락한 뒤에만 한다.** 각 Task의 커밋 단계는 사용자 승인을 받고 실행한다. 승인 없이 `git commit`/`git push`를 실행하지 않는다.
- 썸네일 비율은 **`aspect-[40/21]`** 로 고정한다. og:image 표준 1200×630과 같은 값이라 `pnpm thumbnail`로 만든 이미지가 잘리지 않는다.
- 상대 표기 한도는 **30일**. 넘으면 아무것도 붙이지 않는다.
- 본문 컨테이너 폭 **`max-w-3xl`** 는 건드리지 않는다 (`app/layout.tsx`).
- **검색 모달(`components/Search/components/Search.tsx`)은 수정하지 않는다.** 날짜를 `item.date`로 직접 렌더하며 이번 범위 밖이다.
- import는 **`@/` 별칭**을 쓴다. 상대 경로 import를 새로 만들지 않는다.
- 테스트 파일은 **`app/` 아래**에 둔다. `pnpm test`의 글로브가 `app/**/*.test.ts`라 다른 위치는 실행되지 않는다.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `app/lib/date/relative.ts` (신규) | `"YYYY-MM-DD"` + `now` → `"오늘" \| "어제" \| "N일 전" \| null`. DOM·React 의존 없음 |
| `app/lib/date/relative.test.ts` (신규) | 위 함수의 경계값 검증 |
| `components/Card/CardDateArea.tsx` (수정) | 절대 날짜 렌더 + 마운트 후 상대 표기 덧붙임. `className` prop 추가 |
| `components/Card/CardExcerptArea.tsx` (신규) | 발췌문 2줄 클램프 |
| `components/MainArticleItem.tsx` (신규) | 메인 가로 카드 한 줄. atom 조합만 담당 |
| `components/MainArticleList.tsx` (수정) | 받은 글을 그대로 나열 + "모든 글 보기" 링크. 개수 분기 없음 |
| `components/Card/ArticleCard.tsx` (삭제) | `MainArticleList`에서만 쓰이던 세로 카드. 대체됨 |

`app/page.tsx`는 **수정하지 않는다** — 이미 `allPosts().slice(0, 5)`를 넘기고 있고, 개수를 정하는 유일한 지점으로 남긴다.

---

### Task 1: 상대 날짜 계산 함수

**Files:**
- Create: `app/lib/date/relative.ts`
- Test: `app/lib/date/relative.test.ts`

**Interfaces:**
- Consumes: 없음 (순수 함수)
- Produces:
  - `relativeLabel(date: string, now: Date): string | null`
  - `RELATIVE_LIMIT_DAYS: number` (값 `30`)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/lib/date/relative.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { relativeLabel } from "@/app/lib/date/relative";

// now를 인자로 받으므로 시간을 고정해 검증할 수 있다.
const NOW = new Date(2026, 9, 14, 12, 0, 0); // 2026-10-14 12:00 로컬

test("오늘 올린 글은 '오늘'", () => {
  assert.equal(relativeLabel("2026-10-14", NOW), "오늘");
});

test("하루 전은 '어제'", () => {
  assert.equal(relativeLabel("2026-10-13", NOW), "어제");
});

test("이틀 전부터는 'N일 전'", () => {
  assert.equal(relativeLabel("2026-10-12", NOW), "2일 전");
});

test("30일 전까지는 붙인다 (경계)", () => {
  assert.equal(relativeLabel("2026-09-14", NOW), "30일 전");
});

test("31일을 넘으면 붙이지 않는다 (경계)", () => {
  assert.equal(relativeLabel("2026-09-13", NOW), null);
});

test("미래 날짜는 붙이지 않는다", () => {
  assert.equal(relativeLabel("2026-10-15", NOW), null);
});

test("형식이 다르면 붙이지 않는다", () => {
  assert.equal(relativeLabel("2026/10/14", NOW), null);
  assert.equal(relativeLabel("", NOW), null);
});

test("경과 시간이 아니라 달력 날짜로 센다", () => {
  // 자정 1분 뒤에 본다면 하루도 채 지나지 않았지만 날짜는 하루 넘어갔다.
  // 경과 시간(ms)으로 나누면 '오늘'이 되어 틀린다.
  const justAfterMidnight = new Date(2026, 9, 15, 0, 1, 0);
  assert.equal(relativeLabel("2026-10-14", justAfterMidnight), "어제");

  // 반대로 자정 직전은 아직 같은 날이다.
  const justBeforeMidnight = new Date(2026, 9, 14, 23, 59, 0);
  assert.equal(relativeLabel("2026-10-14", justBeforeMidnight), "오늘");
});

test("해를 넘겨도 날짜 차이를 맞게 센다", () => {
  const newYear = new Date(2027, 0, 5, 9, 0, 0); // 2027-01-05
  assert.equal(relativeLabel("2026-12-27", newYear), "9일 전");
});
```

- [ ] **Step 2: 테스트를 돌려 실패를 확인한다**

```bash
npx tsx --test app/lib/date/relative.test.ts
```

Expected: FAIL — `Cannot find module '.../app/lib/date/relative'`

- [ ] **Step 3: 구현한다**

`app/lib/date/relative.ts`:

```ts
/****************************************
 *
 * 글 날짜를 "오늘 / 어제 / N일 전"으로 바꾼다.
 *
 * 이 블로그는 output: "export" 정적 사이트다. 빌드 시점에 계산하면 배포 순간의
 * 값이 HTML에 박히므로, 호출부(CardDateArea)가 브라우저에서 now를 넘겨 쓴다.
 * now를 인자로 받는 이유는 그 때문이기도 하고, 테스트에서 시간을 고정하기 위해서다.
 *
 ****************************************/

/** 이 일수를 넘으면 상대 표기를 붙이지 않는다. 640일 전 같은 값은 감이 오지 않는다. */
export const RELATIVE_LIMIT_DAYS = 30;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * @param date parsePost가 정규화한 "YYYY-MM-DD"
 * @param now  보는 시점 (브라우저의 new Date())
 * @returns 붙일 문구, 또는 붙이지 않아야 하면 null
 */
export function relativeLabel(date: string, now: Date): string | null {
  const days = daysSince(date, now);

  if (days === null || days < 0 || days > RELATIVE_LIMIT_DAYS) {
    return null;
  }
  if (days === 0) {
    return "오늘";
  }
  if (days === 1) {
    return "어제";
  }
  return `${days}일 전`;
}

/**
 * 두 날짜 사이의 "달력 일수"를 센다. 경과 시간이 아니다.
 *
 * new Date("2026-10-14")는 UTC 자정으로 해석된다. 음수 시간대(예: UTC-5)에서는
 * 전날로 밀려 하루가 어긋난다. 그래서 연·월·일을 직접 넘겨 **로컬 자정**으로 만들고,
 * 오늘도 로컬 자정으로 맞춘 뒤 뺀다.
 */
function daysSince(date: string, now: Date): number | null {
  const match = DATE_PATTERN.exec(date);
  if (match === null) {
    return null;
  }

  const [, year, month, day] = match;
  const posted = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(posted.getTime())) {
    return null;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 서머타임이 끼면 하루가 23시간이나 25시간이 된다. round가 그걸 흡수한다.
  return Math.round((today.getTime() - posted.getTime()) / MS_PER_DAY);
}
```

- [ ] **Step 4: 테스트를 돌려 통과를 확인한다**

```bash
npx tsx --test app/lib/date/relative.test.ts
```

Expected: PASS — `pass 9`, `fail 0`

- [ ] **Step 5: 전체 테스트가 깨지지 않았는지 확인한다**

```bash
pnpm test
```

Expected: `fail 0`. 기존 77개 + 신규 9개 = `tests 86`

- [ ] **Step 6: 커밋 (사용자 승인 후)**

```bash
git add app/lib/date/relative.ts app/lib/date/relative.test.ts
git commit -m "feat: 글 날짜를 '오늘/어제/N일 전'으로 바꾸는 함수"
```

---

### Task 2: CardDateArea에 상대 표기 붙이기

**Files:**
- Modify: `components/Card/CardDateArea.tsx` (전체 교체)

**Interfaces:**
- Consumes: `relativeLabel(date: string, now: Date): string | null` (Task 1)
- Produces: `CardDateArea({ date, className }: { date: string; className?: string })` — `className`은 바깥 `<div>`에 적용된다. 기본값은 지금과 같은 `"flex items-center mb-4"`라 기존 호출부(`ArticleItem`)는 손대지 않아도 된다.

- [ ] **Step 1: 컴포넌트를 교체한다**

`components/Card/CardDateArea.tsx` 전체를 아래로 바꾼다:

```tsx
/****************************************
 *
 * CardDateArea : 아티클 날짜 atomic 컴포넌트
 *
 * 절대 날짜는 서버에서, 상대 표기는 브라우저에서 붙인다.
 * 이 블로그는 output: "export" 정적 사이트라 빌드 시점에 "N일 전"을 계산하면
 * 배포 순간의 값이 HTML에 박힌다. 글이 한 달에 한 편꼴이라 "2일 전"이 한 달 내내
 * 서 있게 된다. 첫 렌더를 서버와 똑같이 맞춰 hydration 경고도 피한다.
 *
 ****************************************/
"use client";

import { useEffect, useState } from "react";
import { relativeLabel } from "@/app/lib/date/relative";

interface CardDateAreaProps {
  date: string;
  className?: string;
}

const CardDateArea = ({
  date,
  className = "flex items-center mb-4",
}: CardDateAreaProps) => {
  const [relative, setRelative] = useState<string | null>(null);

  useEffect(() => {
    setRelative(relativeLabel(date, new Date()));
  }, [date]);

  return (
    <div className={className}>
      <time className="text-gray-500 dark:text-gray-400" dateTime={date}>
        {date}
        {relative !== null && ` (${relative})`}
      </time>
    </div>
  );
};

export default CardDateArea;
```

- [ ] **Step 2: 타입 오류가 없는지 확인한다**

```bash
npx tsc --noEmit
```

Expected: 출력 없음 (오류 0건)

- [ ] **Step 3: 빌드가 통과하는지 확인한다**

```bash
pnpm build
```

Expected: `✓ Compiled successfully`, `✓ Generating static pages ... (41/41)`

- [ ] **Step 4: 빌드 산출물에 절대 날짜만 들어갔는지 확인한다**

```bash
grep -o '<time[^>]*>[^<]*</time>' out/post/all/1.html | head -3
```

Expected: `<time ... datetime="2026-10-14">2026-10-14</time>` — 괄호가 **없어야** 정상이다. 상대 표기는 브라우저에서만 붙는다.

- [ ] **Step 5: 브라우저에서 상대 표기가 붙는지 확인한다**

```bash
pnpm dev
```

`http://localhost:3000/post/all/1`을 열어 최신 글 날짜가 `2026-10-14 (오늘)` 형태인지, 오래된 글(2025년)은 날짜만 나오는지 본다. 확인 후 서버를 끈다.

- [ ] **Step 6: 커밋 (사용자 승인 후)**

```bash
git add components/Card/CardDateArea.tsx
git commit -m "feat: 최근 30일 글의 날짜에 '오늘/어제/N일 전' 표기"
```

---

### Task 3: 메인을 가로 카드 세로 스택으로

**Files:**
- Create: `components/Card/CardExcerptArea.tsx`
- Create: `components/MainArticleItem.tsx`
- Modify: `components/MainArticleList.tsx` (전체 교체)
- Delete: `components/Card/ArticleCard.tsx`

**Interfaces:**
- Consumes:
  - `CardDateArea({ date, className? })` (Task 2)
  - 기존 atom: `CardImageArea({ src, className?, alt? })`, `CardTagsArea({ tags, className?, linkClassName? })`, `CardTitleArea({ title, slug, className? })`
  - 기존 함수: `thumbnailOf(post)`, `excerptOf(post)`, 상수 `ALL_TAG`
- Produces: `MainArticleList({ posts }: { posts: Post[] })` — 받은 글을 **전부** 나열한다. 개수 제한은 호출자(`app/page.tsx`)가 한다.

- [ ] **Step 1: 발췌문 atom을 만든다**

`components/Card/CardExcerptArea.tsx`:

```tsx
/****************************************
 *
 * CardExcerptArea : 아티클 발췌문 atomic 컴포넌트
 *
 * 본문에서 뽑는 일은 excerptOf가 한다. 여기서는 보여 주기만 한다.
 *
 ****************************************/

interface CardExcerptAreaProps {
  excerpt: string;
  className?: string;
}

const CardExcerptArea = ({
  excerpt,
  className = "line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400",
}: CardExcerptAreaProps) => {
  return <p className={className}>{excerpt}</p>;
};

export default CardExcerptArea;
```

- [ ] **Step 2: 가로 카드 한 줄 컴포넌트를 만든다**

`components/MainArticleItem.tsx`:

```tsx
/****************************************
 *
 * MainArticleItem : 메인의 가로 카드 한 줄
 *
 * 썸네일 왼쪽 + 글 오른쪽. 모바일에서는 썸네일이 위로 올라간다.
 * Posts 목록의 ArticleItem과 합치지 않는다 — 썸네일 위치가 반대고 발췌문 유무가
 * 달라서, 하나로 묶으면 플래그만 늘어난다. 공통 조각은 Card/* atom으로 공유한다.
 *
 ****************************************/

import type { Post } from "@/app/lib/posts/types";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import { excerptOf } from "@/app/lib/posts/excerpt";
import CardImageArea from "@/components/Card/CardImageArea";
import CardDateArea from "@/components/Card/CardDateArea";
import CardTagsArea from "@/components/Card/CardTagsArea";
import CardTitleArea from "@/components/Card/CardTitleArea";
import CardExcerptArea from "@/components/Card/CardExcerptArea";

const MainArticleItem = ({ post }: { post: Post }) => {
  return (
    <li className="border-b border-gray-200 dark:border-gray-800 py-6">
      <article className="flex flex-col sm:flex-row gap-5">
        <CardImageArea
          src={thumbnailOf(post)}
          className="w-full sm:w-56 sm:flex-shrink-0 aspect-[40/21] overflow-hidden rounded-lg"
        />
        {/* min-w-0이 없으면 긴 제목이 flex 칸을 밀어내 썸네일이 찌그러진다. */}
        <div className="flex-1 min-w-0">
          <CardDateArea
            date={post.date}
            className="flex items-center text-sm mb-1"
          />
          <CardTagsArea tags={post.tags} />
          <CardTitleArea
            title={post.title}
            slug={`/${post.slug}`}
            className="flex"
          />
          <CardExcerptArea excerpt={excerptOf(post)} />
        </div>
      </article>
    </li>
  );
};

export default MainArticleItem;
```

- [ ] **Step 3: 목록을 교체한다**

`components/MainArticleList.tsx` 전체를 아래로 바꾼다:

```tsx
/****************************************
 *
 * MainArticleList : 메인의 최신 글 목록
 *
 * 받은 글을 그대로 나열한다. 몇 개를 보여 줄지는 호출자(app/page.tsx)가 정한다.
 * 예전에는 3단 그리드 + 아랫줄 2개 구조라 호출자의 slice(0, 5)와 여기의
 * slice(0, 3)/slice(3, 5)가 겹쳐 있었고, 아랫줄 카드가 윗줄보다 1.6배 컸다.
 * 세로 스택은 개수에 따라 분기할 일이 없어 그 두 문제가 함께 사라진다.
 *
 ****************************************/

import Link from "next/link";
import MainArticleItem from "@/components/MainArticleItem";
import { ALL_TAG } from "@/app/lib/posts/constants";
import type { Post } from "@/app/lib/posts/types";

const MainArticleList = ({ posts }: { posts: Post[] }) => {
  return (
    <>
      <ul className="list-none">
        {posts.map((post: Post) => (
          <MainArticleItem key={post.slug} post={post} />
        ))}
      </ul>

      <div className="flex justify-center py-8">
        <Link
          href={`/post/${ALL_TAG}/1`}
          className="font-semibold text-blue-600 dark:text-blue-400"
        >
          모든 글 보기 →
        </Link>
      </div>
    </>
  );
};

export default MainArticleList;
```

- [ ] **Step 4: 쓰이지 않게 된 ArticleCard를 지운다**

먼저 정말 아무도 안 쓰는지 확인한다:

```bash
grep -rn "ArticleCard" --include=*.tsx --include=*.ts . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=out
```

Expected: `components/Card/ArticleCard.tsx` 자기 자신만 나온다 (파일 내부 3줄). `MainArticleList`에서 나오면 Step 3이 덜 적용된 것이다.

```bash
rm components/Card/ArticleCard.tsx
```

- [ ] **Step 5: 타입과 빌드를 확인한다**

```bash
npx tsc --noEmit
```

Expected: 출력 없음

```bash
pnpm test
```

Expected: `fail 0`

```bash
pnpm build
```

Expected: `✓ Compiled successfully`, `✓ Generating static pages ... (41/41)`

- [ ] **Step 6: 메인이 의도대로 나왔는지 확인한다**

```bash
grep -c 'aspect-\[40/21\]' out/index.html
```

Expected: `5` — 글 5개가 모두 가로 카드로 렌더됐다는 뜻

```bash
grep -o '모든 글 보기' out/index.html
```

Expected: `모든 글 보기` 한 줄

```bash
grep -o 'col-span-3\|flex-1 h-full' out/index.html
```

Expected: 아무것도 안 나온다 — 3+2 분기가 사라졌다는 뜻

- [ ] **Step 7: 눈으로 확인한다**

```bash
pnpm dev
```

`http://localhost:3000`에서 확인할 것:

1. 글 5개가 **같은 크기**로 세로로 쌓였는가 (1.6배 차이가 사라졌는가)
2. 제목이 한 줄에 들어가고 발췌문이 2줄 보이는가
3. 최신 글 날짜에 `(오늘)` 같은 표기가 붙는가
4. 맨 아래 "모든 글 보기 →"가 `/post/all/1`로 가는가
5. 창을 좁히면 썸네일이 글 위로 올라가는가
6. 다크모드에서 기본 썸네일과 글자가 보이는가

확인 후 서버를 끈다.

- [ ] **Step 8: 커밋 (사용자 승인 후)**

```bash
git add components/Card/CardExcerptArea.tsx components/MainArticleItem.tsx components/MainArticleList.tsx
git add -u components/Card/ArticleCard.tsx
git commit -m "feat: 메인을 가로 카드 세로 스택으로 재구성"
```

---

## Self-Review

**1. Spec coverage**

| 스펙 항목 | 담당 Task |
|---|---|
| 결정 1 — 가로 카드 세로 스택 | Task 3 Step 2–3 |
| 결정 2 — 3+2 분기 제거, 개수는 호출자가 | Task 3 Step 3, Step 6 (`col-span-3` 미검출 확인) |
| 결정 3 — ArticleItem과 합치지 않음 | Task 3 Step 2 (별도 컴포넌트, 주석에 이유) |
| 결정 4 — 상대 날짜는 브라우저에서 | Task 2 Step 1, Step 4 (빌드 산출물에 괄호 없음 확인) |
| 결정 5 — 30일 한도 | Task 1 (`RELATIVE_LIMIT_DAYS`, 경계 테스트 2건) |
| 시간대 처리 | Task 1 Step 3 `daysSince`, Step 1 "달력 날짜로 센다" 테스트 |
| 테스트 표 7가지 | Task 1 Step 1 (9개 테스트로 전부 포함) |
| 발췌문 2줄 | Task 3 Step 1 (`line-clamp-2`) |
| 모바일 반응형 | Task 3 Step 2 (`flex-col sm:flex-row`), Step 7-5 |
| `ArticleCard` 삭제 확인 후 | Task 3 Step 4 (grep 먼저) |
| 레이아웃 밀림 방지 | Task 2 Step 1 — 괄호가 `<time>` 안 인라인이라 줄이 밀리지 않음 |

빠진 항목 없음.

**2. Placeholder scan** — "TBD", "적절히 처리", 코드 없는 코드 단계 없음. 모든 코드 단계에 완전한 코드가 들어 있다.

**3. Type consistency**

- `relativeLabel(date: string, now: Date): string | null` — Task 1 정의, Task 2 호출. 일치
- `RELATIVE_LIMIT_DAYS` — Task 1에서 정의·사용(내부 한도). 외부 호출부 없음
- `CardDateArea({ date, className? })` — Task 2 정의, Task 3에서 `className` 넘김. 일치
- `CardImageArea({ src, className? })` / `CardTagsArea({ tags })` / `CardTitleArea({ title, slug, className? })` — 기존 시그니처와 일치 (확인함)
- `thumbnailOf(post)` / `excerptOf(post)` — 기존 시그니처(`Pick<Post, …>`)가 `Post`를 받으므로 그대로 전달 가능
- `MainArticleList({ posts: Post[] })` — `app/page.tsx`가 넘기는 형태 그대로. 일치
