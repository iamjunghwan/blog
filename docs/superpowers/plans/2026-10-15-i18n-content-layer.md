# 다국어 1단계: 콘텐츠 계층의 언어 인식 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글 데이터에 언어라는 축을 추가한다 — 파일이 어느 언어 폴더에 있는지로 `lang`을 정하고, 언어별로 걸러 쓸 수 있게 한다. 이 계획이 끝나도 **사이트 화면과 주소는 지금과 똑같다.**

**Architecture:** 언어는 frontmatter가 아니라 **읽은 폴더**가 정한다(`content/posts/ko`, `content/posts/en`). 적는 걸 잊으면 틀리기 때문이다. `queries.ts`의 기존 함수는 모두 `posts` 배열을 인자로 받으므로 그대로 두고, 언어 필터(`postsIn`)와 짝 찾기(`counterpart`)만 추가한다. UI 문자열은 라이브러리 없이 객체 두 개로 둔다.

**Tech Stack:** Next.js 16 App Router (`output: "export"`), TypeScript, gray-matter, `node:test` + `node:assert/strict`를 `tsx`로 실행

## Global Constraints

- **커밋은 사용자가 허락한 뒤에만 한다.** 각 Task의 커밋 단계는 사용자 승인을 받고 실행한다. 승인 없이 `git commit`/`git push`를 실행하지 않는다.
- 언어 코드는 **`ko`와 `en`** 뿐이다. `kr`은 국가 코드라 쓰지 않는다.
- 언어는 **읽은 폴더**가 정한다. frontmatter에 `lang`을 적지 않는다.
- 같은 글의 두 언어판은 **frontmatter `slug`가 같아야 한다**. 그게 두 판을 잇는 열쇠다.
- 기존 한국어 글 19편의 **frontmatter 내용은 한 글자도 바꾸지 않는다.** 위치만 옮긴다.
- import는 **`@/` 별칭**을 쓴다.
- 테스트 파일은 **`app/` 아래**에 둔다. `pnpm test`의 글로브가 `app/**/*.test.ts`라 다른 위치는 실행되지 않는다.
- 이 계획이 끝난 뒤 **빌드 산출물의 URL 수가 이전과 같아야 한다**(사이트맵 37개).

---

## File Structure

| 파일 | 책임 |
|---|---|
| `app/lib/posts/types.ts` (수정) | `Lang` 타입, `PostMeta`에 `lang`·`fileName` |
| `app/lib/posts/parse.ts` (수정) | `lang`을 인자로 받아 Post에 채운다. 파싱 규칙은 그대로 |
| `app/lib/posts/repository.ts` (수정) | 언어 폴더마다 읽어 합친다. 중복 검사를 `(slug, lang)` 쌍으로 |
| `app/lib/posts/queries.ts` (수정) | `postsIn`, `counterpart` 추가. 기존 함수는 건드리지 않는다 |
| `app/lib/i18n/messages.ts` (신규) | 화면 문자열 사전. ko/en 두 벌 |
| `app/lib/i18n/messages.test.ts` (신규) | 두 사전의 키가 어긋나지 않는지 |
| `app/lib/date/relative.ts` (수정) | 문구를 사전에서 가져온다 |
| `components/Card/CardDateArea.tsx` (수정) | `lang` prop (기본 `"ko"`) |
| `content/posts/ko/**` | 기존 19편이 옮겨 간 자리 |
| `content/posts/en/.gitkeep` (신규) | 영어 폴더 자리 확보. 폴더가 없으면 로더가 실패한다 |

---

### Task 1: Lang 타입과 파싱

**Files:**
- Modify: `app/lib/posts/types.ts`
- Modify: `app/lib/posts/parse.ts`
- Test: `app/lib/posts/parse.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type Lang = "ko" | "en"`
  - `PostMeta`에 `lang: Lang`, `fileName: string`
  - `parsePost(source: string, fileName: string, lang: Lang): Post`

- [ ] **Step 1: 기존 호출부를 확인한다**

```bash
grep -rn "parsePost(" app scripts --include=*.ts --include=*.tsx
```

`repository.ts`와 `parse.test.ts`에서만 부른다. 세 번째 인자가 늘어나므로 둘 다 고쳐야 한다.

- [ ] **Step 2: 실패하는 테스트를 추가한다**

`app/lib/posts/parse.test.ts` **맨 끝에** 아래를 덧붙인다. 기존 테스트는 지우지 않는다.

```ts
test("lang과 fileName을 인자로 받아 그대로 담는다", () => {
  const source = [
    "---",
    "slug: hello",
    'title: "안녕"',
    "date: 2026-01-02",
    "tags: [javascript]",
    "---",
    "",
    "본문",
  ].join("\n");

  const post = parsePost(source, "2026/01/hello.md", "en");

  assert.equal(post.lang, "en");
  assert.equal(post.fileName, "2026/01/hello.md");
});

test("lang은 frontmatter를 보지 않는다", () => {
  // 폴더가 언어를 정한다. frontmatter에 적혀 있어도 무시해야
  // '적는 걸 잊어서 틀리는' 경로가 생기지 않는다.
  const source = [
    "---",
    "slug: hello",
    'title: "안녕"',
    "date: 2026-01-02",
    "tags: [javascript]",
    "lang: en",
    "---",
    "",
    "본문",
  ].join("\n");

  assert.equal(parsePost(source, "2026/01/hello.md", "ko").lang, "ko");
});
```

- [ ] **Step 3: 테스트를 돌려 실패를 확인한다**

```bash
npx tsx --test app/lib/posts/parse.test.ts
```

Expected: FAIL — `post.lang`이 `undefined`

- [ ] **Step 4: 타입을 넓힌다**

`app/lib/posts/types.ts`의 `PostMeta`를 아래로 바꾼다. 다른 타입은 그대로 둔다.

```ts
/** 지원하는 글 언어. 'kr'은 국가 코드라 쓰지 않는다. */
export type Lang = "ko" | "en";

export type PostMeta = {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  tags: string[];
  thumbnail?: string;
  /** 검색·공유용 설명문. 없으면 본문에서 뽑는다 (excerpt.ts). */
  description?: string;
  draft: boolean;
  /** 이 글이 어느 언어인지. 읽은 폴더가 정한다 — frontmatter에 적지 않는다. */
  lang: Lang;
  /** 언어 폴더 기준 상대 경로. 스크립트가 원본 파일을 되찾는 데 쓴다. */
  fileName: string;
};
```

- [ ] **Step 5: parsePost가 lang을 받게 한다**

`app/lib/posts/parse.ts`의 import 줄과 함수 머리를 바꾼다.

```ts
import type { Lang, Post } from "@/app/lib/posts/types";
```

```ts
/**
 * md 문자열을 Post로 파싱한다.
 * 필수 필드가 없으면 파일명을 포함한 에러를 던져 빌드를 실패시킨다.
 * 조용히 넘기면 글이 사이트에서 사라지는데 아무도 알 수 없다.
 *
 * lang은 호출자(로더)가 준다. 읽은 폴더가 곧 언어이고, frontmatter는 보지 않는다.
 */
export function parsePost(source: string, fileName: string, lang: Lang): Post {
  // 이 저장소는 core.autocrlf=true 라 워킹트리 파일이 CRLF다.
  // 파싱 경계에서 한 번 정규화해 아래 모듈들이 줄바꿈을 신경 쓰지 않게 한다.
  const { data, content } = matter(source.replace(/\r\n/g, "\n"));

  return {
    slug: requireString(data.slug, "slug", fileName),
    title: requireString(data.title, "title", fileName),
    date: requireDate(data.date, fileName),
    tags: requireTags(data.tags, fileName),
    thumbnail: optionalString(data.thumbnail),
    description: optionalString(data.description),
    draft: data.draft === true,
    lang,
    fileName,
    body: content.trim(),
  };
}
```

- [ ] **Step 6: 기존 테스트의 호출부를 고친다**

`app/lib/posts/parse.test.ts`에서 인자가 둘뿐인 `parsePost` 호출을 모두 찾아 세 번째 인자 `"ko"`를 넣는다.

```bash
grep -n "parsePost(" app/lib/posts/parse.test.ts
```

`repository.ts:19`도 임시로 `"ko"`를 넘겨 컴파일되게 한다 — Task 2에서 제대로 고친다.

```ts
    post: parsePost(fs.readFileSync(path.join(dir, file), "utf8"), file, "ko"),
```

- [ ] **Step 7: 통과를 확인한다**

```bash
npx tsx --test app/lib/posts/parse.test.ts
npx tsc --noEmit
```

Expected: 테스트 전부 통과, tsc 출력 없음

- [ ] **Step 8: 전체 테스트가 깨지지 않았는지 본다**

```bash
pnpm test
```

Expected: `fail 0`

- [ ] **Step 9: 커밋 (사용자 승인 후)**

```bash
git add app/lib/posts/types.ts app/lib/posts/parse.ts app/lib/posts/parse.test.ts app/lib/posts/repository.ts
git commit -m "feat: Post에 lang과 fileName 추가"
```

---

### Task 2: 글을 언어 폴더로 옮기고 로더를 언어별로

**Files:**
- Move: `content/posts/2025/**`, `content/posts/2026/**` → `content/posts/ko/**`
- Create: `content/posts/en/.gitkeep`
- Modify: `app/lib/posts/repository.ts`
- Test: `app/lib/posts/repository.test.ts`

**Interfaces:**
- Consumes: `parsePost(source, fileName, lang)` (Task 1)
- Produces:
  - `LANGS: readonly Lang[]` (값 `["ko", "en"]`)
  - `loadPosts(dir: string, includeDrafts: boolean, lang: Lang): Post[]` — 한 언어 폴더
  - `loadAllPosts(baseDir: string, includeDrafts: boolean): Post[]` — 모든 언어를 합친 것
  - `allPosts(): Post[]` — 시그니처 그대로, 내부만 바뀐다

- [ ] **Step 1: 파일을 옮긴다**

```bash
mkdir -p content/posts/ko
git mv content/posts/2025 content/posts/ko/2025
git mv content/posts/2026 content/posts/ko/2026
mkdir -p content/posts/en
printf '' > content/posts/en/.gitkeep
git add content/posts/en/.gitkeep
```

옮겨졌는지 본다. 19개가 나와야 한다.

```bash
find content/posts/ko -name '*.md' | wc -l
```

- [ ] **Step 2: 실패하는 테스트를 추가한다**

`app/lib/posts/repository.test.ts` 맨 끝에 덧붙인다.

```ts
test("언어 폴더마다 읽어 합치고, 폴더가 곧 lang이 된다", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-"));
  const write = (lang: string, name: string, slug: string, title: string) => {
    const full = path.join(dir, lang, "2026", "01");
    fs.mkdirSync(full, { recursive: true });
    fs.writeFileSync(
      path.join(full, name),
      ["---", `slug: ${slug}`, `title: "${title}"`, "date: 2026-01-02", "tags: [javascript]", "---", "", "본문"].join("\n")
    );
  };
  write("ko", "hello.md", "hello", "안녕");
  write("en", "hello.md", "hello", "Hello");

  const posts = loadAllPosts(dir, true);

  assert.equal(posts.length, 2);
  assert.deepEqual(
    posts.map((p) => `${p.lang}:${p.slug}`).sort(),
    ["en:hello", "ko:hello"]
  );
});

test("같은 언어 안에서 slug이 겹치면 빌드를 세운다", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-"));
  const full = path.join(dir, "ko", "2026", "01");
  fs.mkdirSync(full, { recursive: true });
  for (const name of ["a.md", "b.md"]) {
    fs.writeFileSync(
      path.join(full, name),
      ["---", "slug: same", 'title: "제목"', "date: 2026-01-02", "tags: [javascript]", "---", "", "본문"].join("\n")
    );
  }
  fs.mkdirSync(path.join(dir, "en"), { recursive: true });

  assert.throws(() => loadAllPosts(dir, true), /same/);
});

test("언어 폴더가 없으면 조용히 넘기지 않고 알린다", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-"));
  fs.mkdirSync(path.join(dir, "ko"), { recursive: true });
  // en 폴더를 만들지 않는다

  assert.throws(() => loadAllPosts(dir, true), /en/);
});
```

파일 맨 위 import에 `os`가 없으면 추가한다.

```ts
import os from "node:os";
```

그리고 `loadAllPosts`를 import 목록에 넣는다.

- [ ] **Step 3: 실패를 확인한다**

```bash
npx tsx --test app/lib/posts/repository.test.ts
```

Expected: FAIL — `loadAllPosts is not a function`

- [ ] **Step 4: 로더를 고친다**

`app/lib/posts/repository.ts`에서 아래 네 군데를 바꾼다.

import와 상수:

```ts
import fs from "node:fs";
import path from "node:path";
import { parsePost } from "@/app/lib/posts/parse";
import type { Lang, Post } from "@/app/lib/posts/types";

export const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/** 글 폴더에 있어야 하는 언어들. 폴더가 없으면 빌드가 실패한다. */
export const LANGS: readonly Lang[] = ["ko", "en"];
```

`loadPosts`에 `lang`을 받게 한다:

```ts
/**
 * 한 언어 폴더에서 글을 읽어 date 내림차순으로 정렬한다.
 * dir을 인자로 받아 테스트에서 픽스처를 쓸 수 있게 한다.
 *
 * 글이 연도/월 폴더 아래 중첩되어 있으므로 재귀적으로 훑는다.
 */
export function loadPosts(dir: string, includeDrafts: boolean, lang: Lang): Post[] {
  const files = collectMarkdownFiles(dir).sort();

  const entries = files.map((file) => ({
    file,
    post: parsePost(fs.readFileSync(path.join(dir, file), "utf8"), file, lang),
  }));

  assertUniqueSlugs(entries);

  return entries
    .map((entry) => entry.post)
    .filter((post) => includeDrafts || !post.draft)
    .sort(byDateDescThenSlug);
}

/**
 * 모든 언어 폴더를 읽어 합친다.
 *
 * 언어 폴더가 없으면 던진다. 조용히 넘기면 번역을 통째로 빠뜨린 채
 * 빌드가 성공해 버린다. 언어를 늘릴 때 폴더를 만들라고 알려주는 편이 낫다.
 */
export function loadAllPosts(baseDir: string, includeDrafts: boolean): Post[] {
  const all: Post[] = [];

  for (const lang of LANGS) {
    const dir = path.join(baseDir, lang);
    if (!fs.existsSync(dir)) {
      throw new Error(`글 폴더가 없습니다: ${dir} ('${lang}' 폴더를 만드세요)`);
    }
    all.push(...loadPosts(dir, includeDrafts, lang));
  }

  return all.sort(byDateDescThenSlug);
}
```

`allPosts`가 새 함수를 쓰게 한다:

```ts
  const posts = loadAllPosts(POSTS_DIR, shouldIncludeDrafts());
```

중복 검사의 주석만 손본다. 키는 그대로 slug인데, 이제 **한 언어 폴더 안에서만** 검사하므로 다른 언어의 같은 slug은 걸리지 않는다:

```ts
/**
 * slug 중복은 한 글이 조용히 사라지는 결과를 낳으므로 빌드를 실패시킨다.
 *
 * 한 언어 폴더 안에서만 검사한다. 같은 글의 한국어판과 영어판은 slug이 같아야
 * 하고(그게 두 판을 잇는 열쇠다), 그 둘은 서로 다른 폴더에 있다.
 */
function assertUniqueSlugs(entries: { file: string; post: Post }[]): void {
```

- [ ] **Step 5: 통과를 확인한다**

```bash
npx tsx --test app/lib/posts/repository.test.ts
npx tsc --noEmit
```

Expected: 테스트 통과, tsc 출력 없음

- [ ] **Step 6: 회귀를 확인한다**

```bash
pnpm test
```

Expected: `fail 0`. 기존 `content.test.ts`가 실제 `content/posts`를 읽으므로, 이게 통과하면 19편이 제자리에 있다는 뜻이다.

- [ ] **Step 7: 빌드와 URL 수를 확인한다**

```bash
pnpm build
grep -c '<url>' out/sitemap.xml
```

Expected: 빌드 성공 41페이지, 사이트맵 **37** — 이동 전과 같아야 한다. 다르면 글이 빠진 것이다.

- [ ] **Step 8: 커밋 (사용자 승인 후)**

```bash
git add content/posts app/lib/posts/repository.ts app/lib/posts/repository.test.ts
git commit -m "feat: 글을 언어 폴더로 가르고 로더를 언어별로"
```

---

### Task 3: 언어 필터와 짝 찾기

**Files:**
- Modify: `app/lib/posts/queries.ts`
- Test: `app/lib/posts/queries.test.ts`

**Interfaces:**
- Consumes: `Lang`, `PostMeta.lang` (Task 1)
- Produces:
  - `postsIn(posts: Post[], lang: Lang): Post[]`
  - `counterpart(posts: Post[], slug: string, lang: Lang): Post | undefined`
  - `bilingualSlugs(posts: Post[]): string[]`

- [ ] **Step 1: 실패하는 테스트를 추가한다**

`app/lib/posts/queries.test.ts` 맨 끝에 덧붙인다. 이 파일에 이미 있는 픽스처 만드는 방식을 따르되, 없다면 아래 헬퍼를 같이 넣는다.

```ts
function post(slug: string, lang: "ko" | "en", date = "2026-01-02"): Post {
  return {
    slug,
    title: `${slug} (${lang})`,
    date,
    tags: ["javascript"],
    draft: false,
    lang,
    fileName: `2026/01/${slug}.md`,
    body: "본문",
  };
}

test("postsIn은 그 언어 글만 준다", () => {
  const posts = [post("a", "ko"), post("a", "en"), post("b", "ko")];

  assert.deepEqual(postsIn(posts, "en").map((p) => p.slug), ["a"]);
  assert.deepEqual(postsIn(posts, "ko").map((p) => p.slug), ["a", "b"]);
});

test("counterpart는 반대 언어의 같은 slug을 찾는다", () => {
  const posts = [post("a", "ko"), post("a", "en"), post("b", "ko")];

  assert.equal(counterpart(posts, "a", "ko")?.lang, "en");
  assert.equal(counterpart(posts, "a", "en")?.lang, "ko");
});

test("반대 언어판이 없으면 undefined", () => {
  const posts = [post("b", "ko")];

  assert.equal(counterpart(posts, "b", "ko"), undefined);
});

test("bilingualSlugs는 양쪽 다 있는 slug만 준다", () => {
  const posts = [post("a", "ko"), post("a", "en"), post("b", "ko"), post("c", "en")];

  assert.deepEqual(bilingualSlugs(posts), ["a"]);
});
```

파일 맨 위 import에 새 함수 셋과 `Post` 타입을 추가한다.

- [ ] **Step 2: 실패를 확인한다**

```bash
npx tsx --test app/lib/posts/queries.test.ts
```

Expected: FAIL — `postsIn is not a function`

- [ ] **Step 3: 함수를 추가한다**

`app/lib/posts/queries.ts` 맨 끝에 덧붙인다. **기존 함수는 하나도 건드리지 않는다** — 전부 `posts` 배열을 인자로 받으므로 호출부가 걸러서 넘기면 그대로 쓸 수 있다.

```ts
/** 그 언어로 쓰인 글만. 호출부가 이걸로 걸러 기존 조회 함수에 넘긴다. */
export function postsIn(posts: Post[], lang: Lang): Post[] {
  return posts.filter((post) => post.lang === lang);
}

/**
 * 반대 언어의 같은 글. 없으면 undefined.
 *
 * 두 판은 slug으로 이어진다. 언어 전환 버튼이 이걸로 "반대 판이 있는가"를
 * 판단해, 없으면 버튼을 감춘다 — 눌러서 404가 나는 것보다 낫다.
 */
export function counterpart(
  posts: Post[],
  slug: string,
  lang: Lang
): Post | undefined {
  return posts.find((post) => post.slug === slug && post.lang !== lang);
}

/** 한국어판과 영어판이 모두 있는 slug. 전환 버튼이 빌드 타임에 받아 간다. */
export function bilingualSlugs(posts: Post[]): string[] {
  const byLang = new Map<string, Set<Lang>>();

  for (const post of posts) {
    const langs = byLang.get(post.slug) ?? new Set<Lang>();
    langs.add(post.lang);
    byLang.set(post.slug, langs);
  }

  return [...byLang.entries()]
    .filter(([, langs]) => langs.size > 1)
    .map(([slug]) => slug)
    .sort();
}
```

맨 위 import에 `Lang`을 추가한다.

```ts
import type { Lang, Post, SearchEntry } from "@/app/lib/posts/types";
```

- [ ] **Step 4: 통과를 확인한다**

```bash
npx tsx --test app/lib/posts/queries.test.ts
npx tsc --noEmit
pnpm test
```

Expected: 전부 통과, tsc 출력 없음

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add app/lib/posts/queries.ts app/lib/posts/queries.test.ts
git commit -m "feat: 언어 필터와 두 언어판 짝 찾기"
```

---

### Task 4: 화면 문자열 사전과 날짜의 언어

**Files:**
- Create: `app/lib/i18n/messages.ts`
- Create: `app/lib/i18n/messages.test.ts`
- Modify: `app/lib/date/relative.ts`
- Modify: `app/lib/date/relative.test.ts`
- Modify: `components/Card/CardDateArea.tsx`

**Interfaces:**
- Consumes: `Lang` (Task 1)
- Produces:
  - `messages(lang: Lang)` — 그 언어의 문자열 묶음
  - `relativeLabel(date: string, now: Date, lang: Lang): string | null`
  - `CardDateArea({ date, className?, priority?… })`에 `lang?: Lang` prop (기본 `"ko"`)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/lib/i18n/messages.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { messages, MESSAGES } from "@/app/lib/i18n/messages";

test("두 언어 사전의 키가 같다", () => {
  // 한쪽에만 키가 있으면 그 언어에서 문구가 undefined로 새어 나온다.
  assert.deepEqual(Object.keys(MESSAGES.ko).sort(), Object.keys(MESSAGES.en).sort());
});

test("언어별 문구를 준다", () => {
  assert.equal(messages("ko").today, "오늘");
  assert.equal(messages("en").today, "Today");
});

test("N일 전은 수를 받아 만든다", () => {
  assert.equal(messages("ko").daysAgo(3), "3일 전");
  assert.equal(messages("en").daysAgo(3), "3 days ago");
});
```

`app/lib/date/relative.test.ts`의 기존 테스트는 **인자가 둘**이라 전부 실패하게 된다. 맨 위에 아래 테스트를 추가하고, 기존 호출은 Step 4에서 고친다.

```ts
test("영어는 영어 문구로 준다", () => {
  const now = new Date(2026, 9, 14, 12, 0, 0);

  assert.equal(relativeLabel("2026-10-14", now, "en"), "Today");
  assert.equal(relativeLabel("2026-10-13", now, "en"), "Yesterday");
  assert.equal(relativeLabel("2026-10-12", now, "en"), "2 days ago");
  assert.equal(relativeLabel("2026-09-13", now, "en"), null);
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npx tsx --test app/lib/i18n/messages.test.ts
```

Expected: FAIL — 모듈을 찾을 수 없음

- [ ] **Step 3: 사전을 만든다**

`app/lib/i18n/messages.ts`:

```ts
/****************************************
 *
 * 화면 문자열 사전
 *
 * i18n 라이브러리를 쓰지 않는다. 갈라지는 문자열이 아래가 전부라 객체 두 개면
 * 충분하고, 라이브러리는 번들만 키운다.
 *
 * Posts / About / The Latest Article 은 한국어 화면에서도 영어라 양쪽이 같다.
 *
 ****************************************/

import type { Lang } from "@/app/lib/posts/types";

type Messages = {
  allPosts: string;
  searchPlaceholder: string;
  openMenu: string;
  closeMenu: string;
  today: string;
  yesterday: string;
  daysAgo: (days: number) => string;
};

export const MESSAGES: Record<Lang, Messages> = {
  ko: {
    allPosts: "모든 글 보기 →",
    searchPlaceholder: "검색어를 입력하세요",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    today: "오늘",
    yesterday: "어제",
    daysAgo: (days) => `${days}일 전`,
  },
  en: {
    allPosts: "All posts →",
    searchPlaceholder: "Search posts",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    today: "Today",
    yesterday: "Yesterday",
    daysAgo: (days) => `${days} days ago`,
  },
};

export function messages(lang: Lang): Messages {
  return MESSAGES[lang];
}
```

- [ ] **Step 4: relativeLabel이 언어를 받게 한다**

`app/lib/date/relative.ts`의 import와 `relativeLabel`만 바꾼다. `daysSince`는 그대로 둔다.

```ts
import { messages } from "@/app/lib/i18n/messages";
import type { Lang } from "@/app/lib/posts/types";
```

```ts
/**
 * @param date parsePost가 정규화한 "YYYY-MM-DD"
 * @param now  보는 시점 (브라우저의 new Date())
 * @param lang 문구를 고를 언어
 * @returns 붙일 문구, 또는 붙이지 않아야 하면 null
 */
export function relativeLabel(
  date: string,
  now: Date,
  lang: Lang
): string | null {
  const days = daysSince(date, now);

  if (days === null || days < 0 || days > RELATIVE_LIMIT_DAYS) {
    return null;
  }

  const t = messages(lang);

  if (days === 0) {
    return t.today;
  }
  if (days === 1) {
    return t.yesterday;
  }
  return t.daysAgo(days);
}
```

`app/lib/date/relative.test.ts`의 기존 `relativeLabel(...)` 호출을 모두 찾아 세 번째 인자 `"ko"`를 넣는다.

```bash
grep -n "relativeLabel(" app/lib/date/relative.test.ts
```

- [ ] **Step 5: 컴포넌트가 언어를 넘기게 한다**

`components/Card/CardDateArea.tsx`를 아래로 바꾼다. 기본값이 `"ko"`라 **기존 호출부는 고치지 않아도 된다** — 영어 화면 배선은 다음 계획에서 한다.

```tsx
"use client";

import { useEffect, useState } from "react";
import { relativeLabel } from "@/app/lib/date/relative";
import type { Lang } from "@/app/lib/posts/types";

interface CardDateAreaProps {
  date: string;
  className?: string;
  lang?: Lang;
}

const CardDateArea = ({
  date,
  className = "flex items-center mb-4",
  lang = "ko",
}: CardDateAreaProps) => {
  const [relative, setRelative] = useState<string | null>(null);

  useEffect(() => {
    setRelative(relativeLabel(date, new Date(), lang));
  }, [date, lang]);

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

파일 맨 위의 설명 주석 블록은 그대로 둔다.

- [ ] **Step 6: 통과를 확인한다**

```bash
npx tsx --test app/lib/i18n/messages.test.ts
npx tsx --test app/lib/date/relative.test.ts
npx tsc --noEmit
pnpm test
```

Expected: 전부 통과, tsc 출력 없음

- [ ] **Step 7: 화면이 그대로인지 본다**

```bash
pnpm build
grep -o '<time[^>]*>[^<]*</time>' out/post/all/1.html | head -3
```

Expected: 빌드 성공 41페이지. `<time ... >2026-10-14</time>` — 정적 HTML에는 절대 날짜만(상대 표기는 마운트 후 붙는다).

```bash
grep -c '<url>' out/sitemap.xml
```

Expected: `37`

- [ ] **Step 8: 커밋 (사용자 승인 후)**

```bash
git add app/lib/i18n app/lib/date/relative.ts app/lib/date/relative.test.ts components/Card/CardDateArea.tsx
git commit -m "feat: 화면 문자열 사전과 날짜 문구의 언어 분리"
```

---

## Self-Review

**1. Spec coverage** (이 계획이 맡은 범위만)

| 설계 항목 | 담당 |
|---|---|
| 결정 2 — `ko/`·`en/` 폴더로 가름 | Task 2 Step 1, 4 |
| 결정 3 — slug이 열쇠, 언어별 중복 검사 | Task 2 Step 4 (`assertUniqueSlugs`를 언어 폴더 안으로), Task 3 `counterpart` |
| 결정 6 — 라이브러리 없이 사전 | Task 4 Step 3 |
| 콘텐츠 계층: `Lang`, `lang`, `fileName` | Task 1 |
| 콘텐츠 계층: `postsIn`, `counterpart` | Task 3 |
| 전환 버튼이 쓸 `bilingualSlugs` | Task 3 |
| 날짜 문구의 언어 | Task 4 |
| 테스트 표의 `parse`·`repository`·`queries`·`relative` | Task 1·2·3·4 |
| 위험: 19편 이동 중 유실 | Task 2 Step 6·7 (회귀 테스트 + 사이트맵 37) |

**다음 계획으로 넘기는 것** — 결정 1(라우트), 결정 4(라우트 그룹), 결정 5(영어 노출 규칙), 전환 버튼 UI, 언어별 검색 인덱스, SEO 태그, 사이트맵 확장, `gen-thumbnail`·`new-post` 스크립트, 시험 번역 1편. `content.test.ts`의 "19편이 모두 ko" 회귀 검증도 이 계획에서는 기존 테스트가 통과하는 것으로 갈음하고, 명시적 단언은 다음 계획에서 추가한다.

**2. Placeholder scan** — "TBD", "적절히 처리", 코드 없는 코드 단계 없음. `grep`으로 호출부를 찾으라는 단계는 파일이 몇 개인지 세는 작업이라 코드가 아니다.

**3. Type consistency**

- `Lang = "ko" | "en"` — Task 1 정의, Task 2·3·4 사용. 일치
- `parsePost(source, fileName, lang)` — Task 1 정의, Task 2 Step 4 호출. 일치
- `loadPosts(dir, includeDrafts, lang)` / `loadAllPosts(baseDir, includeDrafts)` — Task 2 정의, 테스트와 `allPosts`에서 사용. 일치
- `postsIn` / `counterpart` / `bilingualSlugs` — Task 3 정의, 다음 계획이 소비
- `relativeLabel(date, now, lang)` — Task 4 정의, `CardDateArea`가 호출. 일치
- `messages(lang)` / `MESSAGES` — Task 4 정의, `relative.ts`와 테스트가 사용. 일치
- `PostMeta.fileName` — Task 1 정의. 이 계획에서 쓰는 곳은 없고 다음 계획의 `gen-thumbnail`이 쓴다
