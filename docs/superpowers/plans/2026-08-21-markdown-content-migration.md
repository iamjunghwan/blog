# Markdown 콘텐츠 전환 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 블로그 아티클을 memexdata.io 헤드리스 CMS에서 저장소 내 Markdown 파일로 옮기고 CMS 의존을 완전히 제거한다.

**Architecture:** `content/posts/*.md`를 유일한 콘텐츠 소스로 두고, `app/lib/posts/` 아래 6개 모듈(types/parse/thumbnail/render/repository/queries)이 파싱·렌더·조회를 담당한다. 페이지는 `allPosts()`로 목록을 얻어 순수 함수인 queries에 넘긴다. 기존 `processHtml`(cheerio TOC 삽입)은 그대로 재사용하고 앞단에 `markdown-it`만 추가한다.

**Tech Stack:** Next.js 16 (App Router, `output: "export"`), React 19, TypeScript, Tailwind 3, `gray-matter`, `markdown-it`, `cheerio`(기존), `turndown`(마이그레이션 전용), `tsx`(테스트·스크립트 실행), `node:test`

**설계 문서:** [docs/superpowers/specs/2026-08-21-markdown-content-migration-design.md](../specs/2026-08-21-markdown-content-migration-design.md)

## Global Constraints

- 런타임: Node `24.13.0`, pnpm `10.28.2` (`package.json`의 `engines`). 로컬 확인 환경은 Node v24.18.0.
- `next.config.ts`의 `output: "export"`는 변경하지 않는다. 모든 페이지는 정적 생성되어야 한다.
- **`pnpm build`는 환경변수 없이 성공해야 한다.** 빌드 중 네트워크 호출이 하나도 없어야 한다.
- **공개 URL을 깨뜨리지 않는다.** 아티클은 `https://iaman.kr/<slug>`, 목록은 `/post/<tag|all>/<page>`.
- import는 기존 관례를 따른다: `@/` 별칭 사용, 확장자 없음. `.ts` 확장자를 붙이지 않는다.
- Tailwind 클래스 문자열은 **한 글자도 바꾸지 않는다.** 기존 파일에서 그대로 복사한다. (원본의 중복 클래스 `w-full max-w-xl ... w-full max-w-md`도 그대로 둔다)
- 주석은 한국어로, 기존 파일의 밀도를 따른다. 기존 파일의 `/**** ... ****/` 배너 주석은 유지한다.
- 페이지 크기는 `queries.ts`의 `PAGE_SIZE = 5` 하나만 쓴다. 다른 파일에 5를 하드코딩하지 않는다.
- **줄바꿈:** 이 저장소는 `core.autocrlf=true`이고 `.gitattributes`가 없어 워킹트리 파일이 **CRLF**다. JS 템플릿 리터럴은 CRLF를 LF로 정규화하지만 `fs.readFileSync`는 하지 않는다. 규칙은 둘이다:
  1. `parsePost`가 파싱 경계에서 `\r\n` → `\n`으로 정규화한다. 그래서 `Post.body`는 항상 LF다.
  2. **줄 단위로 문자열을 훑는 함수는 줄 분리를 인코딩 독립적으로 한다** (`split(/\r\n|\r|\n/)`). 방어 코드 중복이 아니라 그 함수가 자기 전제를 책임지는 것이다. `"\n"`으로만 쪼개면 각 줄 끝에 `\r`가 남고, JS 정규식의 `.`는 `\r`를 매치하지 않으며 `$`는 `/m` 없이 문자열 끝만 보므로 `^...(.*)$` 형태의 줄 패턴이 **전부 무동작**이 된다. 실측으로 확인된 실패 모드다.

  그 외의 곳에서는 LF를 가정하고 줄바꿈 방어 코드를 넣지 않는다.
- **이 브랜치(`markdown-migration`)는 2부가 끝나기 전에 배포하지 않는다.** 1부 완료 시점에는 사이트에 임시 샘플 글 3개만 존재한다.
- 테스트 픽스처(`app/lib/posts/__fixtures__/`)와 임시 샘플 글(`content/posts/sample-*.md`)은 서로 다른 것이다. 픽스처는 영구, 샘플은 2부에서 삭제한다.

## File Structure

**신규 (`app/lib/posts/`)**

| 파일 | 책임 |
|---|---|
| `types.ts` | `PostMeta`, `Post`, `SearchEntry` 타입 |
| `constants.ts` | `ALL_TAG`. `parse.ts`와 `queries.ts`가 **둘 다 아래로** 의존하는 중립 모듈. 상수를 `queries.ts`에 두면 수집 계층(`parse`)이 조회 계층(`queries`)에 의존하게 되어 파이프라인 방향이 뒤집힌다 |
| `parse.ts` | md 문자열 → `Post`. frontmatter 검증. **fs를 모르는 순수 함수** |
| `thumbnail.ts` | `Post` → 대표 이미지 경로. 순수 함수 |
| `render.ts` | md 본문 → HTML (`markdown-it` → 기존 `processHtml`) |
| `repository.ts` | 폴더 → `Post[]`. **유일한 fs 접근점.** 정렬·draft 필터·캐시 |
| `queries.ts` | `postBySlug`/`postsByTag`/`allTags`/`paginate`/`searchIndex`/`postListParams`/`postListUrls`. **모두 `posts`를 인자로 받는 순수 함수** |

**신규 (기타)**

| 파일 | 책임 |
|---|---|
| `app/sitemap.ts` | 사이트맵 (`next-sitemap` 대체) |
| `app/robots.ts` | robots.txt |
| `scripts/migrate-from-cms.ts` | CMS → md 1회 변환 (`API_TOKEN` 필요) |
| `scripts/verify-migration.ts` | 원본 HTML vs 렌더된 md 구조 비교 |
| `content/posts/*.md` | 콘텐츠 |
| `migration/cms-dump.json` | CMS 원본 응답 (안전망, 커밋함) |

**삭제**

`app/lib/posts.ts`, `app/utils/callApi.ts`, `app/utils/helperCallApi.ts`, `app/utils/common.ts`, `app/api/search/route.ts`, `app/[slug]/services/articleService.ts`, `app/post/[slug]/[...page]/service/getTagsArticle.ts`, `components/PostArticle/hooks/usePaginationState.ts`, `type/index.ts`, `scripts/callApiForCommonjs.js`, `next-sitemap.config.js`, `public/robots.txt`, `public/sitemap.xml`, `public/sitemap-0.xml`

**수정**

`app/page.tsx`, `app/[slug]/page.tsx`, `app/[slug]/layout.tsx`, `app/post/[slug]/[...page]/page.tsx`, `components/Layout/Header.tsx`, `components/MainArticleList.tsx`, `components/PostPageContent.tsx`, `components/Card/*.tsx`, `components/PostArticle/*.tsx`, `components/Tags/*.tsx`, `components/Search/components/Search.tsx`, `components/Search/hooks/useSearchData.tsx`, `package.json`

---

# 1부: 토큰 없이 진행

## Task 1: 의존성 정리와 테스트 러너, `types.ts` + `parse.ts`

**Files:**
- Modify: `package.json`
- Create: `app/lib/posts/types.ts`
- Create: `app/lib/posts/parse.ts`
- Test: `app/lib/posts/parse.test.ts`

**Interfaces:**
- Consumes: 없음 (첫 작업)
- Produces:
  - `type PostMeta = { slug: string; title: string; date: string; tags: string[]; thumbnail?: string; draft: boolean }`
  - `type Post = PostMeta & { body: string }`
  - `type SearchEntry = { slug: string; title: string; date: string; tags: string[] }`
  - `parsePost(source: string, fileName: string): Post`

**주의:** `next-sitemap`과 `dayjs`는 이 작업에서 제거하지 **않는다.** `postbuild` 스크립트와 `CardDateArea`가 아직 그것들을 쓰고 있어서 지금 빼면 빌드가 깨진다. Task 10, Task 11에서 각각 제거한다.

- [ ] **Step 1: 새 의존성 추가**

```bash
pnpm add gray-matter markdown-it @types/markdown-it
pnpm add -D tsx turndown @types/turndown turndown-plugin-gfm
```

> **사후 정정:** `@types/markdown-it`은 불필요하다. `markdown-it` 15는 자체 타입을
> 내장한다(`dist/markdown-it.d.mts`). Task 3에서 제거한다. 위 명령은 실제로 실행된
> 이력이라 그대로 남긴다.

- [ ] **Step 2: 미사용 의존성 제거**

`formidable`, `@types/formidable`, `fs-extra`, `@next/bundle-analyzer`는 저장소 어디서도 import되지 않는다 (이미지 업로드 기능을 만들다 남은 흔적).

```bash
pnpm remove formidable @types/formidable fs-extra @next/bundle-analyzer
```

- [ ] **Step 3: test 스크립트 추가**

`package.json`의 `scripts`에 추가한다. `postbuild`는 아직 건드리지 않는다.

```json
"test": "tsx --test \"app/**/*.test.ts\""
```

- [ ] **Step 4: 실패하는 테스트 작성**

`app/lib/posts/parse.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePost } from "@/app/lib/posts/parse";

const VALID = `---
slug: nextjs-16-upgrade
title: "Next.js 16 업그레이드"
date: 2026-07-14
tags: [nextjs, react]
---

# Next.js 16 업그레이드

본문이다.
`;

test("frontmatter와 본문을 분리해 Post를 만든다", () => {
  const post = parsePost(VALID, "2026-07-nextjs-16-upgrade.md");

  assert.equal(post.slug, "nextjs-16-upgrade");
  assert.equal(post.title, "Next.js 16 업그레이드");
  assert.equal(post.date, "2026-07-14");
  assert.deepEqual(post.tags, ["nextjs", "react"]);
  assert.equal(post.draft, false);
  assert.equal(post.thumbnail, undefined);
  assert.equal(post.body, "# Next.js 16 업그레이드\n\n본문이다.");
});

test("YAML이 Date 객체로 파싱한 date를 YYYY-MM-DD 문자열로 되돌린다", () => {
  // date: 2026-07-14 (따옴표 없음) 는 js-yaml이 Date 객체로 만든다.
  const post = parsePost(VALID, "f.md");
  assert.equal(typeof post.date, "string");
  assert.equal(post.date, "2026-07-14");
});

test("date를 따옴표로 감싼 문자열도 허용한다", () => {
  const source = VALID.replace("date: 2026-07-14", 'date: "2026-07-14"');
  assert.equal(parsePost(source, "f.md").date, "2026-07-14");
});

test("CRLF 파일을 읽어도 본문은 LF만 담는다", () => {
  // 디스크에서 읽은 문자열은 템플릿 리터럴과 달리 CRLF가 그대로 들어온다.
  const post = parsePost(VALID.replace(/\n/g, "\r\n"), "crlf.md");

  assert.equal(post.body.includes("\r"), false);
  assert.equal(post.body, "# Next.js 16 업그레이드\n\n본문이다.");
  assert.equal(post.date, "2026-07-14");
});

test("thumbnail과 draft를 읽는다", () => {
  const source = VALID.replace(
    "tags: [nextjs, react]",
    "tags: [nextjs]\nthumbnail: /uploads/2026/07/hero.png\ndraft: true"
  );
  const post = parsePost(source, "f.md");

  assert.equal(post.thumbnail, "/uploads/2026/07/hero.png");
  assert.equal(post.draft, true);
});

test("slug이 없으면 파일명을 포함한 에러를 던진다", () => {
  const source = VALID.replace("slug: nextjs-16-upgrade\n", "");

  assert.throws(
    () => parsePost(source, "2026-07-broken.md"),
    /2026-07-broken\.md.*slug/
  );
});

test("title이 없으면 파일명을 포함한 에러를 던진다", () => {
  const source = VALID.replace('title: "Next.js 16 업그레이드"\n', "");

  assert.throws(() => parsePost(source, "broken.md"), /broken\.md.*title/);
});

test("date 형식이 틀리면 에러를 던진다", () => {
  const source = VALID.replace("date: 2026-07-14", "date: 2026년 7월");

  assert.throws(() => parsePost(source, "broken.md"), /broken\.md.*date/);
});

test("tags가 배열이 아니면 에러를 던진다", () => {
  const source = VALID.replace("tags: [nextjs, react]", "tags: nextjs,react");

  assert.throws(() => parsePost(source, "broken.md"), /broken\.md.*tags/);
});

test("tags가 비어 있으면 에러를 던진다", () => {
  const source = VALID.replace("tags: [nextjs, react]", "tags: []");

  assert.throws(() => parsePost(source, "broken.md"), /broken.md.*tags/);
});

test("예약어 all은 태그로 쓸 수 없다", () => {
  // /post/all/1 이 전체 목록 라우트라 태그 이름으로 쓰면 그 태그를 필터할 수 없다.
  const source = VALID.replace("tags: [nextjs, react]", "tags: [nextjs, all]");

  assert.throws(() => parsePost(source, "broken.md"), /broken.md.*all/);
});
```

- [ ] **Step 5: 테스트가 실패하는지 확인**

```bash
pnpm test
```

Expected: FAIL — `Cannot find module '@/app/lib/posts/parse'`

- [ ] **Step 6: `types.ts` 작성**

`app/lib/posts/types.ts`:

```ts
/****************************************
 *
 * 콘텐츠 타입 정의
 *
 ****************************************/

export type PostMeta = {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  tags: string[];
  thumbnail?: string;
  draft: boolean;
};

export type Post = PostMeta & {
  /** 렌더 전 markdown 본문 */
  body: string;
};

/** 검색 모달에 넘기는 최소 정보 (본문 제외) */
export type SearchEntry = Pick<PostMeta, "slug" | "title" | "date" | "tags">;
```

- [ ] **Step 7: `parse.ts` 작성**

`app/lib/posts/parse.ts`:

```ts
import matter from "gray-matter";
import type { Post } from "@/app/lib/posts/types";
import { ALL_TAG } from "@/app/lib/posts/constants";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * md 문자열을 Post로 파싱한다.
 * 필수 필드가 없으면 파일명을 포함한 에러를 던져 빌드를 실패시킨다.
 * 조용히 넘기면 글이 사이트에서 사라지는데 아무도 알 수 없다.
 */
export function parsePost(source: string, fileName: string): Post {
  // 이 저장소는 core.autocrlf=true 라 워킹트리 파일이 CRLF다.
  // 파싱 경계에서 한 번 정규화해 아래 모듈들이 줄바꿈을 신경 쓰지 않게 한다.
  const { data, content } = matter(source.replace(/\r\n/g, "\n"));

  return {
    slug: requireString(data.slug, "slug", fileName),
    title: requireString(data.title, "title", fileName),
    date: requireDate(data.date, fileName),
    tags: requireTags(data.tags, fileName),
    thumbnail:
      typeof data.thumbnail === "string" && data.thumbnail.trim() !== ""
        ? data.thumbnail.trim()
        : undefined,
    draft: data.draft === true,
    body: content.trim(),
  };
}

function requireString(value: unknown, field: string, fileName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${fileName}: frontmatter의 '${field}'는 비어 있지 않은 문자열이어야 합니다.`
    );
  }
  return value.trim();
}

/**
 * YAML은 따옴표 없는 2026-07-14를 Date 객체로 파싱한다.
 * Date는 UTC 자정이므로 ISO 앞 10자를 그대로 쓰면 원래 날짜가 보존된다.
 */
function requireDate(value: unknown, fileName: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && DATE_PATTERN.test(value.trim())) {
    return value.trim();
  }
  throw new Error(
    `${fileName}: frontmatter의 'date'는 YYYY-MM-DD 형식이어야 합니다. (받은 값: ${String(value)})`
  );
}

function requireTags(value: unknown, fileName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `${fileName}: frontmatter의 'tags'는 YAML 배열이어야 합니다. 예: tags: [javascript, react]`
    );
  }

  const tags = value.map((tag) => String(tag).trim()).filter((tag) => tag !== "");

  if (tags.length === 0) {
    throw new Error(`${fileName}: frontmatter의 'tags'가 비어 있습니다.`);
  }

  // 'all'은 전체 목록 라우트(/post/all/1)가 쓰는 예약어다. 태그로 허용하면 그 태그로는
  // 필터가 불가능해지고 목록 라우트도 중복 생성된다. 조용히 무시하지 않고 빌드를 세운다.
  if (tags.includes(ALL_TAG)) {
    throw new Error(
      `${fileName}: '${ALL_TAG}'는 전체 목록 라우트가 쓰는 예약어라 태그로 쓸 수 없습니다.`
    );
  }
  return tags;
}
```

- [ ] **Step 8: 테스트 통과 확인**

```bash
pnpm test
```

Expected: PASS — 11 tests

- [ ] **Step 9: 커밋**

```bash
git add package.json pnpm-lock.yaml app/lib/posts/types.ts app/lib/posts/parse.ts app/lib/posts/parse.test.ts
git commit -m "feat: md frontmatter 파서와 테스트 러너 추가"
```

---

## Task 2: `thumbnail.ts`

**Files:**
- Create: `app/lib/posts/thumbnail.ts`
- Test: `app/lib/posts/thumbnail.test.ts`

**Interfaces:**
- Consumes: `Post` (Task 1)
- Produces:
  - `DEFAULT_THUMBNAIL = "/iaman.png"`
  - `thumbnailOf(post: Pick<Post, "thumbnail" | "body">): string`

기존 `app/utils/common.ts`의 `imgCheck(htmlString)`를 대체한다. 대상이 HTML이 아니라 md 본문이므로 markdown 이미지 문법과 raw HTML `<img>` 둘 다 인식해야 하고, **둘이 함께 있으면 본문에서 먼저 나오는 쪽**을 쓴다.

- [ ] **Step 1: 실패하는 테스트 작성**

`app/lib/posts/thumbnail.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_THUMBNAIL, thumbnailOf } from "@/app/lib/posts/thumbnail";

test("frontmatter의 thumbnail이 최우선이다", () => {
  const result = thumbnailOf({
    thumbnail: "/uploads/2026/07/hero.png",
    body: "![다른거](/uploads/2026/07/other.png)",
  });

  assert.equal(result, "/uploads/2026/07/hero.png");
});

test("thumbnail이 없으면 본문의 첫 markdown 이미지를 쓴다", () => {
  const body = "# 제목\n\n![대체텍스트](/uploads/2026/07/first.png)\n\n![두번째](/uploads/2026/07/second.png)";

  assert.equal(thumbnailOf({ body }), "/uploads/2026/07/first.png");
});

test("markdown 이미지의 title 속성을 경로에 포함시키지 않는다", () => {
  const body = '![alt](/uploads/a.png "제목")';

  assert.equal(thumbnailOf({ body }), "/uploads/a.png");
});

test("raw HTML img 태그도 인식한다", () => {
  const body = '<img src="/uploads/2026/07/raw.png" alt="x" />';

  assert.equal(thumbnailOf({ body }), "/uploads/2026/07/raw.png");
});

test("markdown 이미지와 raw img가 함께 있으면 본문에서 먼저 나온 쪽을 쓴다", () => {
  const htmlFirst = '<img src="/uploads/raw.png">\n\n![md](/uploads/md.png)';
  const mdFirst = '![md](/uploads/md.png)\n\n<img src="/uploads/raw.png">';

  assert.equal(thumbnailOf({ body: htmlFirst }), "/uploads/raw.png");
  assert.equal(thumbnailOf({ body: mdFirst }), "/uploads/md.png");
});

test("상대 경로에 앞 슬래시를 붙인다", () => {
  assert.equal(thumbnailOf({ body: "![a](uploads/2026/07/rel.png)" }), "/uploads/2026/07/rel.png");
});

test("절대 URL은 그대로 둔다", () => {
  const body = "![a](https://example.com/x.png)";

  assert.equal(thumbnailOf({ body }), "https://example.com/x.png");
});

test("이미지가 없으면 기본 이미지를 쓴다", () => {
  assert.equal(thumbnailOf({ body: "# 제목\n\n이미지 없음" }), DEFAULT_THUMBNAIL);
  assert.equal(DEFAULT_THUMBNAIL, "/iaman.png");
});

test("코드 펜스 안의 markdown 이미지는 무시한다", () => {
  const body = [
    "# 제목",
    "",
    "```markdown",
    "![예시](/uploads/in-code.png)",
    "```",
    "",
    "![실제](/uploads/real.png)",
  ].join("\n");

  assert.equal(thumbnailOf({ body }), "/uploads/real.png");
});

test("코드 펜스 안의 raw img도 무시한다", () => {
  const body = ["# 제목", "", "~~~html", '<img src="/uploads/in-code.png">', "~~~"].join(
    "\n"
  );

  assert.equal(thumbnailOf({ body }), DEFAULT_THUMBNAIL);
});

test("리스트 안에 들여쓴 펜스도 무시한다", () => {
  const body = [
    "# 제목",
    "",
    "1. 먼저 이렇게 쓴다",
    "",
    "   ```markdown",
    "   ![예시](/uploads/in-code.png)",
    "   ```",
    "",
    "![실제](/uploads/real.png)",
  ].join("\n");

  assert.equal(thumbnailOf({ body }), "/uploads/real.png");
});

test("긴 펜스로 감싼 안쪽 펜스가 블록을 조기에 닫지 않는다", () => {
  const body = [
    "# 제목",
    "",
    "````markdown",
    "```",
    "![예시](/uploads/in-code.png)",
    "```",
    "````",
    "",
    "![실제](/uploads/real.png)",
  ].join("\n");

  assert.equal(thumbnailOf({ body }), "/uploads/real.png");
});

test("닫히지 않은 펜스는 문서 끝까지 코드로 본다", () => {
  const body = ["# 제목", "", "```", "![예시](/uploads/in-code.png)"].join("\n");

  assert.equal(thumbnailOf({ body }), DEFAULT_THUMBNAIL);
});

test("CRLF 본문에서도 펜스를 인식한다", () => {
  // 이 저장소는 core.autocrlf=true라 디스크의 md가 CRLF다.
  // "\n"으로만 쪼개면 각 줄에 \r가 남아 펜스 인식이 전부 무동작이 된다.
  const body = [
    "# 제목",
    "",
    "```markdown",
    "![예시](/uploads/in-code.png)",
    "```",
    "",
    "![실제](/uploads/real.png)",
  ].join("\r\n");

  assert.equal(thumbnailOf({ body }), "/uploads/real.png");
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm test
```

Expected: FAIL — `Cannot find module '@/app/lib/posts/thumbnail'`

- [ ] **Step 3: `thumbnail.ts` 작성**

`app/lib/posts/thumbnail.ts`:

```ts
import type { Post } from "@/app/lib/posts/types";

export const DEFAULT_THUMBNAIL = "/iaman.png";

// ![alt](경로 "title") 에서 경로만 잡는다. 공백/닫는 괄호/> 앞에서 멈춘다.
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(\s*<?([^\s)>]+)>?/;
const HTML_IMAGE = /<img[^>]+src\s*=\s*["']([^"']+)["']/i;
// 펜스 줄: 최대 3칸 들여쓰기 + ` 또는 ~ 3개 이상 + 나머지(info string 또는 빈 문자열)
const FENCE_LINE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

/**
 * 대표 이미지를 결정한다.
 * frontmatter thumbnail → 본문 첫 이미지(markdown 문법과 raw img 중 먼저 나온 것) → 기본 이미지
 *
 * 코드블록 안의 이미지는 예시 코드이므로 후보에서 뺀다. markdown-it도 펜스 안을
 * 이미지로 렌더하지 않으므로, 빼지 않으면 화면에 없는 이미지가 썸네일이 된다.
 */
export function thumbnailOf(post: Pick<Post, "thumbnail" | "body">): string {
  if (post.thumbnail) {
    return normalize(post.thumbnail);
  }

  // 두 정규식을 같은 문자열에 돌리므로 펜스를 지워도 등장 순서 비교는 유효하다.
  const body = stripFencedBlocks(post.body);

  const markdownMatch = MARKDOWN_IMAGE.exec(body);
  const htmlMatch = HTML_IMAGE.exec(body);

  if (markdownMatch && htmlMatch) {
    return normalize(
      markdownMatch.index < htmlMatch.index ? markdownMatch[1] : htmlMatch[1]
    );
  }
  if (markdownMatch) {
    return normalize(markdownMatch[1]);
  }
  if (htmlMatch) {
    return normalize(htmlMatch[1]);
  }
  return DEFAULT_THUMBNAIL;
}

function normalize(src: string): string {
  if (/^(https?:)?\/\//.test(src)) {
    return src;
  }
  return src.startsWith("/") ? src : `/${src}`;
}

/**
 * 코드 펜스 구간을 지운다. 정규식 하나로는 부족해서 줄 단위로 훑는다.
 * CommonMark 규칙을 따른다:
 *  - 여는 펜스는 들여쓰기 최대 3칸, 마커는 ` 또는 ~ 3개 이상
 *  - 닫는 펜스는 같은 문자로 여는 펜스 이상 길이여야 하고 뒤에 내용이 없어야 한다
 *    (그래서 ````로 감싼 안쪽 ```가 블록을 조기에 닫지 않는다)
 *  - 닫는 펜스가 없으면 문서 끝까지 코드로 본다
 */
function stripFencedBlocks(body: string): string {
  const kept: string[] = [];
  let open: { marker: string; length: number } | null = null;

  // 줄 분리는 인코딩과 무관해야 한다. "\n"으로만 쪼개면 CRLF 파일에서 각 줄 끝에 \r가
  // 남고, FENCE_LINE의 `.`는 \r를 매치하지 않아 펜스가 아예 인식되지 않는다.
  for (const line of body.split(/\r\n|\r|\n/)) {
    const match = FENCE_LINE.exec(line);

    if (open === null) {
      if (match) {
        open = { marker: match[1][0], length: match[1].length };
        continue;
      }
      kept.push(line);
      continue;
    }

    const closes =
      match !== null &&
      match[1][0] === open.marker &&
      match[1].length >= open.length &&
      match[2].trim() === "";

    if (closes) {
      open = null;
    }
  }

  return kept.join("\n");
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test
```

Expected: PASS — 앞선 11개 + 14개 = 25개

- [ ] **Step 5: 커밋**

```bash
git add app/lib/posts/thumbnail.ts app/lib/posts/thumbnail.test.ts
git commit -m "feat: md 본문에서 대표 이미지를 뽑는 thumbnailOf 추가"
```

---

## Task 3: `render.ts`

**Files:**
- Create: `app/lib/posts/render.ts`
- Test: `app/lib/posts/render.test.ts`

**Interfaces:**
- Consumes: 기존 `processHtml(html: string): { headings: any[]; html: string }` (`app/lib/processHtml.ts`)
- Produces: `renderPostBody(body: string): string`

**부수 정리:** `@types/markdown-it`을 제거한다.

```bash
pnpm remove @types/markdown-it
```

`markdown-it` 15는 `dist/markdown-it.d.mts`로 자체 타입을 제공하고 TypeScript가 그것을
`@types/*`보다 먼저 해석하므로, `@types/markdown-it`(최신 14.x)은 동작에 관여하지 않는
죽은 의존성이다. 제거 후에도 `npx tsc --noEmit`이 깨끗해야 한다 —
`tsconfig.json`은 `esModuleInterop: true`, `moduleResolution: "bundler"`라
`import MarkdownIt from "markdown-it"` 기본 import가 정상 동작한다 (실측 확인).

**주의:** `app/lib/processHtml.ts`는 **수정하지 않는다.** 잘 동작하는 코드이고 이번 전환의 검증 기준선이다. `processHtml`은 cheerio `$.html()`을 반환하므로 결과에 `<html><head><body>` 래퍼가 붙는데, 이는 현재 프로덕션 동작과 동일하다 (브라우저가 innerHTML 파싱 시 무시한다). **바꾸지 않는다.**

- [ ] **Step 1: 실패하는 테스트 작성**

`app/lib/posts/render.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderPostBody } from "@/app/lib/posts/render";

test("markdown을 HTML로 렌더한다", () => {
  const html = renderPostBody("# 제목\n\n본문 **강조**");

  assert.match(html, /<h1>제목<\/h1>/);
  assert.match(html, /<strong>강조<\/strong>/);
});

test("h2에 id를 부여한다 (processHtml 재사용)", () => {
  const html = renderPostBody("# 제목\n\n## 소제목\n\n내용");

  assert.match(html, /<h2 id="소제목">소제목<\/h2>/);
});

test("공백이 있는 heading의 id는 하이픈으로 이어진다", () => {
  const html = renderPostBody("# 제목\n\n## Hello World\n\n내용");

  assert.match(html, /<h2 id="hello-world">/);
});

test("h1 뒤에 TOC를 삽입한다", () => {
  const html = renderPostBody("# 제목\n\n## 첫째\n\n### 둘째\n\n내용");

  assert.match(html, /class="toc"/);
  assert.match(html, /<a href="#첫째">첫째<\/a>/);
  assert.match(html, /<a href="#둘째">둘째<\/a>/);
});

test("h1 다음이 hr이면 TOC는 hr 뒤에 온다", () => {
  const html = renderPostBody("# 제목\n\n---\n\n## 소제목\n\n내용");
  const hrIndex = html.indexOf("<hr>");
  const tocIndex = html.indexOf('class="toc"');

  assert.ok(hrIndex !== -1, "hr이 렌더되어야 한다");
  assert.ok(hrIndex < tocIndex, "TOC는 hr 뒤에 와야 한다");
});

test("raw HTML을 그대로 통과시킨다", () => {
  const html = renderPostBody('# 제목\n\n<iframe src="https://example.com"></iframe>');

  assert.match(html, /<iframe src="https:\/\/example\.com"><\/iframe>/);
});

test("펜스 코드블록의 언어를 class로 유지한다", () => {
  const html = renderPostBody("# 제목\n\n```ts\nconst a = 1;\n```");

  assert.match(html, /<code class="language-ts">/);
  assert.match(html, /const a = 1;/);
});

test("markdown 이미지를 img 태그로 렌더한다", () => {
  const html = renderPostBody("# 제목\n\n![대체텍스트](/uploads/a.png)");

  assert.match(html, /<img src="\/uploads\/a\.png" alt="대체텍스트">/);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm test
```

Expected: FAIL — `Cannot find module '@/app/lib/posts/render'`

- [ ] **Step 3: `render.ts` 작성**

`app/lib/posts/render.ts`:

```ts
import MarkdownIt from "markdown-it";
import { processHtml } from "@/app/lib/processHtml";

// html: true — 변환 불가한 블록을 raw HTML로 남기는 전략을 지원한다.
const markdown = new MarkdownIt({ html: true });

/**
 * md 본문을 아티클 HTML로 렌더한다.
 * heading id 부여와 TOC 삽입은 기존 processHtml을 그대로 재사용한다.
 */
export function renderPostBody(body: string): string {
  return processHtml(markdown.render(body)).html;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test
```

Expected: PASS — 8개 추가

**위 기대값 8개는 실측으로 확인된 것이다** (`markdown-it` 15 + 현재 `processHtml`). 실제 출력:

| 검증 | 실제 출력 |
|---|---|
| h2 id | `<h2 id="소제목">` |
| 공백 heading id | `<h2 id="hello-world">` |
| 이미지 | `<img src="/uploads/a.png" alt="대체텍스트">` (src 먼저, 자기닫힘 아님) |
| 코드펜스 | `<code class="language-ts">` |
| raw HTML | `<iframe src="https://example.com">` 통과 |
| hr / TOC 순서 | hr(37) → toc(46) |
| TOC 링크 | `<a href="#첫째">첫째</a>` |

따라서 **테스트가 실패하면 기대값이 아니라 구현을 의심한다.** 기대값을 실제 출력에 맞춰 고치지 말 것.

참고: `processHtml`이 삽입하는 TOC 자체의 제목은 `<h2 id=toc>`로 **속성에 따옴표가 없다**
(`processHtml.ts`의 하드코딩 문자열). h2를 세는 단정에서는 이걸 감안해야 하므로 위 테스트는
`assert.match`로 특정 h2만 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add app/lib/posts/render.ts app/lib/posts/render.test.ts
git commit -m "feat: markdown-it 렌더러를 기존 processHtml에 연결"
```

---

## Task 4: `repository.ts`

**Files:**
- Create: `app/lib/posts/repository.ts`
- Create: `app/lib/posts/__fixtures__/posts/2026-01-alpha.md`
- Create: `app/lib/posts/__fixtures__/posts/2026-02-beta.md`
- Create: `app/lib/posts/__fixtures__/posts/2026-03-gamma-draft.md`
- Create: `app/lib/posts/__fixtures__/posts/NOTES.txt`
- Create: `app/lib/posts/__fixtures__/duplicate/a.md`
- Create: `app/lib/posts/__fixtures__/duplicate/b.md`
- Test: `app/lib/posts/repository.test.ts`

**Interfaces:**
- Consumes: `parsePost` (Task 1), `Post` (Task 1)
- Produces:
  - `POSTS_DIR: string`
  - `loadPosts(dir: string, includeDrafts: boolean): Post[]` — 테스트용 순수 진입점
  - `allPosts(): Post[]` — `POSTS_DIR` + 캐시. 페이지에서 쓰는 함수
  - `shouldIncludeDrafts(nodeEnv?: string): boolean` — 환경값 기반 draft 표시 여부 (기본값 `process.env.NODE_ENV`)

- [ ] **Step 1: 테스트 픽스처 작성**

`app/lib/posts/__fixtures__/posts/2026-01-alpha.md`:

```markdown
---
slug: alpha
title: "알파"
date: 2026-01-05
tags: [javascript]
---

# 알파

알파 본문.
```

`app/lib/posts/__fixtures__/posts/2026-02-beta.md`:

```markdown
---
slug: beta
title: "베타"
date: 2026-02-10
tags: [javascript, react]
---

# 베타

베타 본문.
```

`app/lib/posts/__fixtures__/posts/2026-03-gamma-draft.md`:

```markdown
---
slug: gamma
title: "감마"
date: 2026-03-01
tags: [nextjs]
draft: true
---

# 감마

아직 초안이다.
```

`app/lib/posts/__fixtures__/posts/NOTES.txt` — `.md`가 아닌 파일이 무시되는지 검증하기 위한 것이다. 이 파일이 없으면 "md가 아닌 파일은 무시한다" 테스트가 아무것도 검증하지 않는다.

```
이 폴더는 repository 테스트용 픽스처다. 이 파일 자체는 md가 아니므로 무시되어야 한다.
```

`app/lib/posts/__fixtures__/duplicate/a.md`:

```markdown
---
slug: same-slug
title: "첫번째"
date: 2026-01-01
tags: [javascript]
---

# 첫번째
```

`app/lib/posts/__fixtures__/duplicate/b.md`:

```markdown
---
slug: same-slug
title: "두번째"
date: 2026-01-02
tags: [javascript]
---

# 두번째
```

- [ ] **Step 2: 실패하는 테스트 작성**

`app/lib/posts/repository.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadPosts, shouldIncludeDrafts } from "@/app/lib/posts/repository";

const FIXTURES = path.join(process.cwd(), "app", "lib", "posts", "__fixtures__");
const POSTS = path.join(FIXTURES, "posts");

test("date 내림차순으로 정렬한다", () => {
  const posts = loadPosts(POSTS, true);

  assert.deepEqual(
    posts.map((post) => post.slug),
    ["gamma", "beta", "alpha"]
  );
});

test("includeDrafts가 false면 draft를 제외한다", () => {
  const posts = loadPosts(POSTS, false);

  assert.deepEqual(
    posts.map((post) => post.slug),
    ["beta", "alpha"]
  );
});

test("md가 아닌 파일은 무시한다", () => {
  const posts = loadPosts(POSTS, true);

  assert.equal(posts.length, 3);
});

test("본문을 함께 읽는다", () => {
  const [, beta] = loadPosts(POSTS, true);

  assert.equal(beta.slug, "beta");
  assert.match(beta.body, /베타 본문\./);
});

test("slug이 중복되면 두 파일명을 담은 에러를 던진다", () => {
  const duplicateDir = path.join(FIXTURES, "duplicate");

  assert.throws(() => loadPosts(duplicateDir, true), /same-slug.*a\.md.*b\.md/);
});

test("draft는 프로덕션에서만 숨긴다", () => {
  assert.equal(shouldIncludeDrafts("production"), false);
  assert.equal(shouldIncludeDrafts("development"), true);
  assert.equal(shouldIncludeDrafts("test"), true);
  assert.equal(shouldIncludeDrafts(undefined), true);
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

```bash
pnpm test
```

Expected: FAIL — `Cannot find module '@/app/lib/posts/repository'`

- [ ] **Step 4: `repository.ts` 작성**

`app/lib/posts/repository.ts`:

```ts
import fs from "node:fs";
import path from "node:path";
import { parsePost } from "@/app/lib/posts/parse";
import type { Post } from "@/app/lib/posts/types";

export const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/**
 * 폴더에서 글을 읽어 date 내림차순으로 정렬한다.
 * dir을 인자로 받아 테스트에서 픽스처를 쓸 수 있게 한다.
 */
export function loadPosts(dir: string, includeDrafts: boolean): Post[] {
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort();

  const entries = files.map((file) => ({
    file,
    post: parsePost(fs.readFileSync(path.join(dir, file), "utf8"), file),
  }));

  assertUniqueSlugs(entries);

  return entries
    .map((entry) => entry.post)
    .filter((post) => includeDrafts || !post.draft)
    .sort(byDateDescThenSlug);
}

/**
 * draft는 프로덕션 빌드에서만 숨긴다. dev에서는 미리보기용으로 보여준다.
 *
 * 환경값을 인자로 받는다. `process.env.NODE_ENV`는 Next 타입 정의에서 읽기 전용이라
 * 테스트에서 대입할 수 없고, 대입 대신 값을 넘기면 캐스팅도 전역 상태 조작도 없이
 * 순수 함수로 검증된다.
 */
export function shouldIncludeDrafts(
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  return nodeEnv !== "production";
}

let cache: Post[] | null = null;

/**
 * content/posts의 글 목록.
 *
 * 캐시는 **프로덕션 빌드에서만** 쓴다. dev에서 캐시하면 md를 고쳐도 서버를
 * 재시작해야 반영된다 — 콘텐츠 파일은 webpack 모듈 그래프에 없어서 Fast Refresh가
 * 이 모듈을 다시 평가하지 않기 때문이다. 글을 쓰면서 바로 확인하는 게 md 전환의
 * 핵심이므로 dev에서는 매번 읽는다. 파일 16개 파싱은 충분히 싸다.
 */
export function allPosts(): Post[] {
  if (cache !== null) {
    return cache;
  }

  const posts = loadPosts(POSTS_DIR, shouldIncludeDrafts());

  // 캐시 여부를 NODE_ENV로 다시 판단하지 않는다. 같은 개념을 두 곳에서 각자 비교하면
  // 한쪽만 바뀌었을 때 캐싱과 draft 표시가 조용히 어긋난다.
  if (!shouldIncludeDrafts()) {
    cache = posts;
  }
  return posts;
}

/**
 * 날짜가 같으면 slug으로 갈라 정적 빌드 순서를 안정시킨다.
 * slug이 같은 경우는 없다 — assertUniqueSlugs가 이 비교자보다 먼저 돌아 빌드를 세운다.
 */
function byDateDescThenSlug(a: Post, b: Post): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1;
  }
  return a.slug < b.slug ? -1 : 1;
}

/** slug 중복은 한 글이 조용히 사라지는 결과를 낳으므로 빌드를 실패시킨다. */
function assertUniqueSlugs(entries: { file: string; post: Post }[]): void {
  const seen = new Map<string, string>();

  for (const { file, post } of entries) {
    const previous = seen.get(post.slug);
    if (previous !== undefined) {
      throw new Error(
        `slug '${post.slug}'가 중복됩니다: ${previous} 와 ${file}`
      );
    }
    seen.set(post.slug, file);
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
pnpm test
```

Expected: PASS — 6개 추가

- [ ] **Step 6: 커밋**

```bash
git add app/lib/posts/repository.ts app/lib/posts/repository.test.ts app/lib/posts/__fixtures__
git commit -m "feat: content/posts를 읽는 repository와 테스트 픽스처 추가"
```

---

## Task 5: `queries.ts`

**Files:**
- Create: `app/lib/posts/queries.ts`
- Test: `app/lib/posts/queries.test.ts`

**Interfaces:**
- Consumes: `Post`, `SearchEntry` (Task 1)
- Produces:
  - `PAGE_SIZE = 5`
  - `postBySlug(posts: Post[], slug: string): Post | undefined`
  - `postsByTag(posts: Post[], tag: string): Post[]` — `"all"`이면 전체
  - `allTags(posts: Post[]): string[]` — 중복 제거 + 사전순
  - `paginate<T>(items: T[], page: number): { items: T[]; totalPages: number }`
  - `searchIndex(posts: Post[]): SearchEntry[]`
  - `postListParams(posts: Post[]): { slug: string; page: string[] }[]`
  - `postListUrls(posts: Post[]): string[]`

**핵심 회귀 방지:** 기존 코드는 콤마 문자열에 `includes`를 써서 `js`가 `nextjs`에 매칭됐다. `postsByTag`는 배열 정확 비교여야 한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`app/lib/posts/queries.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_SIZE,
  allTags,
  paginate,
  postBySlug,
  postListParams,
  postListUrls,
  postsByTag,
  searchIndex,
} from "@/app/lib/posts/queries";
import type { Post } from "@/app/lib/posts/types";

function makePost(slug: string, date: string, tags: string[]): Post {
  return { slug, title: slug.toUpperCase(), date, tags, draft: false, body: `# ${slug}` };
}

// date 내림차순 (repository가 이미 정렬한 상태를 가정한다)
const POSTS: Post[] = [
  makePost("g", "2026-01-07", ["nextjs"]),
  makePost("f", "2026-01-06", ["javascript"]),
  makePost("e", "2026-01-05", ["javascript"]),
  makePost("d", "2026-01-04", ["javascript"]),
  makePost("c", "2026-01-03", ["javascript"]),
  makePost("b", "2026-01-02", ["javascript", "react"]),
  makePost("a", "2026-01-01", ["react"]),
];

test("PAGE_SIZE는 5다", () => {
  assert.equal(PAGE_SIZE, 5);
});

test("postBySlug는 slug으로 글을 찾는다", () => {
  assert.equal(postBySlug(POSTS, "b")?.slug, "b");
  assert.equal(postBySlug(POSTS, "없는slug"), undefined);
});

test("postsByTag는 태그를 정확히 비교한다 (부분 문자열 매칭 금지)", () => {
  // 'js'는 'nextjs'의 부분 문자열이지만 매칭되면 안 된다.
  assert.deepEqual(postsByTag(POSTS, "js"), []);
  assert.deepEqual(
    postsByTag(POSTS, "nextjs").map((post) => post.slug),
    ["g"]
  );
});

test("postsByTag('all')은 전체를 준다", () => {
  assert.equal(postsByTag(POSTS, "all").length, POSTS.length);
});

test("postsByTag는 여러 태그를 가진 글도 잡는다", () => {
  assert.deepEqual(
    postsByTag(POSTS, "react").map((post) => post.slug),
    ["b", "a"]
  );
});

test("allTags는 중복을 제거하고 사전순으로 정렬한다", () => {
  assert.deepEqual(allTags(POSTS), ["javascript", "nextjs", "react"]);
});

test("paginate는 페이지 단위로 자르고 총 페이지 수를 준다", () => {
  const first = paginate(POSTS, 1);
  const second = paginate(POSTS, 2);

  assert.deepEqual(first.items.map((post) => post.slug), ["g", "f", "e", "d", "c"]);
  assert.equal(first.totalPages, 2);
  assert.deepEqual(second.items.map((post) => post.slug), ["b", "a"]);
  assert.equal(second.totalPages, 2);
});

test("paginate는 범위를 넘는 페이지에 빈 배열을 준다", () => {
  assert.deepEqual(paginate(POSTS, 3).items, []);
});

test("paginate는 빈 목록에도 totalPages 1을 준다", () => {
  const result = paginate([], 1);

  assert.deepEqual(result.items, []);
  assert.equal(result.totalPages, 1);
});

test("paginate는 유효하지 않은 page에 빈 배열을 준다", () => {
  // 가드가 없으면 slice의 음수 인덱스 때문에 page=-1이 최신 글 2개를 돌려준다.
  assert.deepEqual(paginate(POSTS, 0).items, []);
  assert.deepEqual(paginate(POSTS, -1).items, []);
  assert.deepEqual(paginate(POSTS, 1.5).items, []);
  assert.deepEqual(paginate(POSTS, Number.NaN).items, []);

  // totalPages는 여전히 알려준다 (전체 개수 정보는 유효하다)
  assert.equal(paginate(POSTS, -1).totalPages, 2);
});

test("searchIndex는 본문을 제외한다", () => {
  const [first] = searchIndex(POSTS);

  assert.deepEqual(Object.keys(first).sort(), ["date", "slug", "tags", "title"]);
  assert.equal(first.slug, "g");
});

test("postListParams는 all과 각 태그의 페이지를 만든다", () => {
  const params = postListParams(POSTS);

  // all: 7건 -> 2페이지, javascript: 5건 -> 1페이지, nextjs: 1건 -> 1페이지, react: 2건 -> 1페이지
  assert.deepEqual(params, [
    { slug: "all", page: ["1"] },
    { slug: "all", page: ["2"] },
    { slug: "javascript", page: ["1"] },
    { slug: "nextjs", page: ["1"] },
    { slug: "react", page: ["1"] },
  ]);
});

test("postListParams는 all과 실제 태그만 라우트로 만든다", () => {
  const slugs = postListParams(POSTS).map((param) => param.slug);
  const allowed = new Set(["all", ...allTags(POSTS)]);

  // 기존 버그: 아티클 slug과 콤마로 이어붙인 태그 문자열이 라우트로 생성됐다.
  // 특정 문자열("a", 콤마)이 아니라 허용 집합 소속으로 확인해, 같은 버그가 다른
  // 모양(다른 slug, 다른 구분자)으로 돌아오는 경우까지 잡는다.
  assert.ok(slugs.length > 0, "라우트가 하나도 없으면 이 단정은 의미가 없다");

  for (const slug of slugs) {
    assert.ok(allowed.has(slug), `허용되지 않은 목록 라우트 slug: ${slug}`);
  }

  // 소속 검사만으로는 중복 라우트를 못 잡는다. 같은 (slug, page)가 두 번 나오면
  // 사이트맵에 중복 URL이 실린다 — 원래 버그와 같은 부류의 증상이다.
  const keys = postListParams(POSTS).map(({ slug, page }) => `${slug}/${page[0]}`);

  assert.equal(new Set(keys).size, keys.length, `중복 라우트: ${keys.join(", ")}`);
});

test("postListUrls는 사이트맵용 경로 문자열을 준다", () => {
  assert.deepEqual(postListUrls(POSTS), [
    "/post/all/1",
    "/post/all/2",
    "/post/javascript/1",
    "/post/nextjs/1",
    "/post/react/1",
  ]);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm test
```

Expected: FAIL — `Cannot find module '@/app/lib/posts/queries'`

- [ ] **Step 3: `queries.ts` 작성**

`app/lib/posts/queries.ts`:

```ts
import type { Post, SearchEntry } from "@/app/lib/posts/types";
import { ALL_TAG } from "@/app/lib/posts/constants";

/** 목록 한 페이지에 보여줄 글 수. 이 값만 쓴다. */
export const PAGE_SIZE = 5;

// ALL_TAG는 constants.ts에 있다. parse.ts도 같은 값을 필요로 하는데, 여기에 두면
// 수집 계층이 조회 계층에 의존하게 되어 파이프라인 방향이 뒤집힌다.

export function postBySlug(posts: Post[], slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

/** 태그는 정확히 비교한다. 부분 문자열 매칭은 js가 nextjs에 걸리는 버그였다. */
export function postsByTag(posts: Post[], tag: string): Post[] {
  if (tag === ALL_TAG) {
    return posts;
  }
  return posts.filter((post) => post.tags.includes(tag));
}

export function allTags(posts: Post[]): string[] {
  const tags = new Set<string>();

  for (const post of posts) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}

export function paginate<T>(
  items: T[],
  page: number
): { items: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  // 유효하지 않은 page는 빈 결과를 준다. 호출자는 그것으로 404를 판단한다.
  // 1페이지로 클램프하면 존재하지 않는 주소에 실제 글이 노출된다.
  // (가드가 없으면 slice의 음수 인덱스 때문에 page=-1이 최신 글 2개를 돌려준다)
  if (!Number.isInteger(page) || page < 1) {
    return { items: [], totalPages };
  }

  const start = (page - 1) * PAGE_SIZE;

  return { items: items.slice(start, start + PAGE_SIZE), totalPages };
}

/** 검색 모달에 넘길 최소 정보. 본문을 빼서 페이로드를 작게 유지한다. */
export function searchIndex(posts: Post[]): SearchEntry[] {
  return posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
  }));
}

/** /post/[slug]/[...page] 의 generateStaticParams 값 */
export function postListParams(
  posts: Post[]
): { slug: string; page: string[] }[] {
  const params: { slug: string; page: string[] }[] = [];

  for (const slug of [ALL_TAG, ...allTags(posts)]) {
    const { totalPages } = paginate(postsByTag(posts, slug), 1);

    for (let page = 1; page <= totalPages; page += 1) {
      params.push({ slug, page: [String(page)] });
    }
  }
  return params;
}

/** 사이트맵에 넣을 목록 페이지 경로 */
export function postListUrls(posts: Post[]): string[] {
  return postListParams(posts).map(
    ({ slug, page }) => `/post/${slug}/${page[0]}`
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm test
```

Expected: PASS — 14개 추가 (누적 53개)

- [ ] **Step 5: 커밋**

```bash
git add app/lib/posts/queries.ts app/lib/posts/queries.test.ts
git commit -m "feat: 글 조회 순수 함수 queries 추가 (태그 정확 매칭)"
```

---

## Task 6: 임시 샘플 글과 아티클 상세 페이지 전환

**Files:**
- Create: `content/posts/2026-08-sample-alpha.md`
- Create: `content/posts/2026-08-sample-beta.md`
- Create: `content/posts/2026-07-sample-gamma.md`
- Modify: `app/[slug]/page.tsx` (전체 교체)
- Modify: `app/[slug]/layout.tsx` (전체 교체)
- Delete: `app/lib/posts.ts`
- Delete: `app/[slug]/services/articleService.ts`

**Interfaces:**
- Consumes: `allPosts` (Task 4), `postBySlug` (Task 5), `renderPostBody` (Task 3)
- Produces: 없음 (페이지)

**주의 1:** `app/lib/posts.ts`(파일)를 지우기 전에는 `app/lib/posts/`(디렉토리)가 이미 존재한다. git은 둘을 함께 추적할 수 있지만 **모듈 해석이 모호해지므로 이 작업에서 반드시 파일을 삭제한다.**

**주의 2:** `app/lib/posts.ts`의 `generateStaticParamsWithPagination`은 어디서도 import되지 않는 죽은 코드다. 옮기지 않고 버린다.

**주의 3:** 샘플 글의 slug은 `sample-`로 시작한다. 2부에서 실제 글로 교체할 때 식별하기 쉽게 하기 위한 것이다.

- [ ] **Step 1: 임시 샘플 글 3개 작성**

`content/posts/2026-08-sample-alpha.md` — 이미지·코드블록·hr을 모두 포함해 렌더 파이프라인을 실제로 검증한다.

````markdown
---
slug: sample-alpha
title: "샘플 알파"
date: 2026-08-20
tags: [javascript, browser]
---

# 샘플 알파

---

첫 문단이다. 마이그레이션 전 임시 글이며 2부에서 삭제한다.

## 첫번째 소제목

본문 **강조**와 [링크](https://iaman.kr)가 있다.

![eslint 설정 화면](/uploads/2026/07/eslint.webp)

### 하위 소제목

```ts
const answer: number = 42;
```

## 두번째 소제목

목록도 넣어본다.

- 하나
- 둘
````

`content/posts/2026-08-sample-beta.md`:

```markdown
---
slug: sample-beta
title: "샘플 베타"
date: 2026-08-15
tags: [javascript]
---

# 샘플 베타

이미지가 없는 글이다. 기본 썸네일이 쓰여야 한다.

## 소제목

내용.
```

`content/posts/2026-07-sample-gamma.md`:

```markdown
---
slug: sample-gamma
title: "샘플 감마"
date: 2026-07-30
tags: [react]
thumbnail: /uploads/2026/05/Deployments.webp
---

# 샘플 감마

thumbnail을 frontmatter로 지정한 글이다.

## 소제목

내용.
```

- [ ] **Step 2: `app/[slug]/page.tsx` 교체**

```tsx
import { allPosts } from "@/app/lib/posts/repository";
import { postBySlug } from "@/app/lib/posts/queries";
import { renderPostBody } from "@/app/lib/posts/render";
import NotFound from "../not-found";
import ArticleContent from "./components/ArticleContent";

export function generateStaticParams() {
  return allPosts().map((post) => ({ slug: post.slug }));
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = postBySlug(allPosts(), slug);

  if (post === undefined) {
    return NotFound();
  }

  return <ArticleContent content={renderPostBody(post.body)} />;
}
```

기존 `export const revalidate = 3600`과 `export const dynamic = "force-static"`은 삭제한다. `output: "export"`에서 모든 페이지는 이미 정적이고, fetch가 없어져 `revalidate`는 의미가 없다.

- [ ] **Step 3: `app/[slug]/layout.tsx` 교체**

```tsx
import { generateCommonMetadata } from "../utils/metadata";
import { allPosts } from "@/app/lib/posts/repository";
import { postBySlug } from "@/app/lib/posts/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = postBySlug(allPosts(), slug);

  if (post === undefined) {
    return generateCommonMetadata({
      title: "Not Found",
      description: "Page not found",
    });
  }

  return generateCommonMetadata({
    title: post.title,
    description: "https://iaman.kr",
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="prose dark:prose-invert">{children}</div>;
}
```

`description: "https://iaman.kr"`는 기존 값을 그대로 유지한다. 설명 문구로는 어색하지만 메타 출력이 바뀌면 이번 전환의 검증이 흐려진다. 별도로 다룰 문제다.

- [ ] **Step 4: 죽은 파일 삭제**

```bash
git rm app/lib/posts.ts "app/[slug]/services/articleService.ts"
```

- [ ] **Step 5: 개발 서버로 확인**

```bash
pnpm dev
```

브라우저에서 확인한다:
- `http://localhost:3000/sample-alpha` — 제목, TOC(`TOC` 헤딩과 소제목 링크), hr, 코드블록, 이미지가 보인다
- TOC의 소제목 링크를 클릭하면 해당 위치로 스크롤된다
- h2를 클릭해도 스크롤된다 (`ArticleClientActions`)
- `http://localhost:3000/없는-슬러그` — 404 페이지

**dev 캐시 무효화 확인 (이 단계를 건너뛰지 말 것):** 서버를 켠 상태로
`content/posts/2026-08-sample-beta.md`의 본문 한 줄을 고치고 저장한 뒤,
`http://localhost:3000/sample-beta`를 새로고침한다. **서버를 재시작하지 않고** 변경이
보여야 한다.

`allPosts()`의 캐시는 프로덕션에서만 동작하도록 되어 있는데 그 분기 자체에는 자동
테스트가 없다 (`content/posts`가 없으면 `allPosts()`가 ENOENT로 던지고, `NODE_ENV`는
Next 타입에서 읽기 전용이라 테스트에서 프로덕션을 흉내낼 수 없다). 이 수동 확인이
그 분기를 검증하는 유일한 지점이므로 반드시 수행한다. 변경이 보이지 않으면 캐시가
dev에서도 동작하고 있다는 뜻이다.

확인 후 서버를 종료한다.

- [ ] **Step 6: 커밋**

```bash
git add content/posts "app/[slug]/page.tsx" "app/[slug]/layout.tsx"
git commit -m "feat: 아티클 상세 페이지를 md 기반으로 전환"
```

---

## Task 7: 홈 화면과 카드 컴포넌트 전환

**Files:**
- Modify: `app/page.tsx` (전체 교체)
- Modify: `components/MainArticleList.tsx` (전체 교체)
- Modify: `components/Card/ArticleCard.tsx` (전체 교체)
- Modify: `components/Card/CardImageArea.tsx` (전체 교체)
- Modify: `components/Card/CardDateArea.tsx` (전체 교체)
- Modify: `components/Card/CardTagsArea.tsx` (전체 교체)
- Delete: `app/utils/common.ts`

**Interfaces:**
- Consumes: `allPosts` (Task 4), `thumbnailOf`/`DEFAULT_THUMBNAIL` (Task 2), `Post` (Task 1)
- Produces:
  - `<ArticleCard post={post} />`
  - `<CardImageArea src={string} className? width? height? alt? />`
  - `<CardDateArea date={string} />`
  - `<CardTagsArea tags={string[]} className? linkClassName? />`
  - `<CardTitleArea>`는 변경하지 않는다 (props가 이미 `title`/`slug`/`className`)

**변경 하나 짚어둠:** 기존 `ArticleCard`는 `CardTitleArea`에 `slug={data.slug}`(앞 슬래시 없음)를 넘겨 `<a href="code-caching">`이라는 상대 링크를 만들었다. 홈(`/`)에서만 우연히 동작한다. `/${post.slug}`로 통일한다.

- [ ] **Step 1: `app/page.tsx` 교체**

```tsx
import InnerHeader from "@/components/Layout/InnerHeader";
import MainArticleList from "@/components/MainArticleList";
import { allPosts } from "@/app/lib/posts/repository";

const Page = () => {
  // 메인은 최신 5개만 보여준다 (윗줄 3개 + 아랫줄 2개)
  const posts = allPosts().slice(0, 5);

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <MainArticleList posts={posts} />
    </>
  );
};

export default Page;
```

- [ ] **Step 2: `components/MainArticleList.tsx` 교체**

```tsx
import ArticleCard from "@/components/Card/ArticleCard";
import type { Post } from "@/app/lib/posts/types";

const MainArticleList = ({ posts }: { posts: Post[] }) => {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 ">
      {posts.slice(0, 3).map((post: Post) => (
        <li
          key={post.slug}
          className="flex flex-col h-full justify-start pt-8 pb-12"
        >
          <div className="h-full">
            <ArticleCard post={post} />
          </div>
        </li>
      ))}

      {/* 아랫줄은 최대 2개. 기존 코드는 `> 4`로 게이트해서 글이 정확히 4개일 때
          4번째 글이 어디에도 렌더되지 않고 사라졌다.
          상한(3, 5)은 이 컴포넌트가 직접 유지한다 — 호출자의 slice(0, 5)에 기대면
          그쪽이 바뀔 때 아랫줄이 무한정 늘어나 3+2 레이아웃이 깨진다. */}
      {posts.length > 3 ? (
        <li className="md:col-span-3 flex flex-col md:flex-row gap-2  items-stretch">
          {posts.slice(3, 5).map((post: Post) => (
            <div key={post.slug} className="flex-1 h-full pt-8 pb-12">
              <ArticleCard post={post} />
            </div>
          ))}
        </li>
      ) : null}
    </ul>
  );
};

export default MainArticleList;
```

- [ ] **Step 3: `components/Card/ArticleCard.tsx` 교체**

```tsx
/****************************************
 *
 * ArticleCard : 아티클 카드 컴포넌트
 *
 ****************************************/

import CardDateArea from "./CardDateArea";
import CardImageArea from "./CardImageArea";
import CardTitleArea from "./CardTitleArea";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import type { Post } from "@/app/lib/posts/types";

const ArticleCard = ({ post }: { post: Post }) => {
  return (
    <article className="flex flex-col items-center w-full">
      <CardDateArea date={post.date} />
      <CardImageArea src={thumbnailOf(post)} />
      <CardTitleArea title={post.title} slug={`/${post.slug}`} />
    </article>
  );
};

export default ArticleCard;
```

- [ ] **Step 4: `components/Card/CardImageArea.tsx` 교체**

```tsx
/****************************************
 *
 * CardImageArea : 아티클 이미지 atomic 컴포넌트
 *
 * 대표 이미지 경로는 thumbnailOf가 결정한다.
 *
 ****************************************/

interface CardImageAreaProps {
  src: string;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

const CardImageArea = ({
  src,
  className = "flex items-center justify-center h-24 w-24 overflow-hidden mb-4 rounded-lg",
  width = 96,
  height = 96,
  alt = "Article Representative Image",
}: CardImageAreaProps) => {
  return (
    <div className={className}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-cover rounded-lg"
      />
    </div>
  );
};

export default CardImageArea;
```

기존 파일의 `import Image from "next/image"`는 실제로 쓰이지 않았다 (`<img>`를 쓴다). 함께 제거한다.

- [ ] **Step 5: `components/Card/CardDateArea.tsx` 교체**

```tsx
/****************************************
 *
 * CardDateArea : 아티클 날짜 itomic 컴포넌트
 *
 ****************************************/

const CardDateArea = ({ date }: { date: string }) => {
  return (
    <div className="flex items-center mb-4">
      <time className="text-gray-500 dark:text-gray-400" dateTime={date}>
        {date}
      </time>
    </div>
  );
};
export default CardDateArea;
```

frontmatter의 `date`가 이미 `YYYY-MM-DD`라 `dayjs` 포맷팅이 필요 없다.

- [ ] **Step 6: `components/Card/CardTagsArea.tsx` 교체**

```tsx
/****************************************
 *
 * CardTagsArea : 아티클 태그 itomic 컴포넌트
 *
 ****************************************/
import Link from "next/link";

interface CardTagsAreaProps {
  tags: string[];
  className?: string;
  linkClassName?: string;
}

const CardTagsArea = ({
  tags,
  className = "flex flex-wrap gap-2 mb-2",
  linkClassName = "text-sm text-blue-600 uppercase no-underline",
}: CardTagsAreaProps) => {
  return (
    <div className={className}>
      {tags.map((tag: string, i: number) => (
        <Link key={i} href={`/post/${tag}/1`} className={linkClassName}>
          {tag}
        </Link>
      ))}
    </div>
  );
};

export default CardTagsArea;
```

- [ ] **Step 7: `app/utils/common.ts` 삭제**

이 파일에는 `imgCheck` 하나만 있었고 `thumbnailOf`가 대체한다.

```bash
git rm app/utils/common.ts
```

- [ ] **Step 8: 확인**

```bash
pnpm test
pnpm dev
```

Expected: 테스트 53개 PASS. `http://localhost:3000`에서 샘플 글 3개가 최신순(알파 → 베타 → 감마)으로 보인다. 3개뿐이라 아랫줄 영역은 나타나지 않는다. 제목 클릭 시 상세로 이동한다.

글 개수별 레이아웃(실제 글 16개에서는 5개로 잘려 들어오므로 항상 3+2다):

| 글 수 | 윗줄 | 아랫줄 |
|---|---|---|
| 3 | 3개 | 없음 |
| 4 | 3개 | **1개** (기존 코드는 이 글을 잃었다) |
| 5 이상 | 3개 | 2개 |

**카드 이미지 3개는 서로 다른 경로여야 한다** — 이게 썸네일 결정 로직 세 갈래를 실제로 구분하는 유일한 확인이다:

| 글 | 기대 경로 | 검증하는 갈래 |
|---|---|---|
| 알파 | `/uploads/2026/07/eslint.webp` | 본문 첫 이미지 추출 |
| 베타 | `/iaman.png` | 이미지 없음 → 기본값 |
| 감마 | `/uploads/2026/05/Deployments.webp` | frontmatter `thumbnail` 우선 |

세 값이 같게 나오면 확인이 통과해도 아무것도 검증하지 못한 것이다. 샘플 글이 서로 다른
이미지를 쓰는 이유가 이것이다.

- [ ] **Step 9: 커밋**

```bash
git add app/page.tsx components/MainArticleList.tsx components/Card
git commit -m "feat: 홈과 카드 컴포넌트를 Post 타입으로 전환"
```

---

## Task 8: 목록·태그·페이지네이션 전환

**Files:**
- Modify: `app/post/[slug]/[...page]/page.tsx` (전체 교체)
- Modify: `app/[slug]/page.tsx` (404 관용구만 `notFound()`로 통일)
- Modify: `components/PostPageContent.tsx` (전체 교체)
- Modify: `components/PostArticle/index.tsx` (전체 교체)
- Modify: `components/PostArticle/ArticleList.tsx` (전체 교체)
- Modify: `components/PostArticle/ArticleItem.tsx` (전체 교체)
- Modify: `components/PostArticle/PaginationNavigation.tsx` (전체 교체)
- Modify: `components/Tags/Tags.tsx` (전체 교체)
- Modify: `components/Tags/TagList.tsx` (props 타입만)
- Delete: `app/post/[slug]/[...page]/service/getTagsArticle.ts`
- Delete: `components/PostArticle/hooks/usePaginationState.ts`

**Interfaces:**
- Consumes: `allPosts` (Task 4), `postsByTag`/`paginate`/`postListParams`/`allTags` (Task 5), `thumbnailOf` (Task 2)
- Produces:
  - `<PostPageContent slug page totalPages totalCount posts />`
  - `<PostArticle posts page slug totalPages totalCount />`
  - `<PaginationNavigation currPage totalPages totalCount slug />`
  - `<ArticleList articles={Post[]} />`, `<ArticleItem item={Post} />`
  - `<TagList currTag tagNames />` (props 형태 유지)

**포함하는 정리 두 가지 (설계 문서에는 없지만 이 파일들을 어차피 고쳐야 해서 함께 처리한다. 별도 검토 대상):**

1. **`usePaginationState` 삭제.** 이 훅은 `initialPage`를 그대로 `currPage`로, `displayData`를 그대로 `currArticlePageList`로 돌려주는 항등 함수다 (`useState` + `useEffect`로 props를 복사만 한다). 페이지네이션은 URL 기반 정적 라우트라 클라이언트 상태가 필요 없다. 이 훅을 없애면 `PostArticle`의 `"use client"`도 필요 없어져 클라이언트 번들이 줄어든다.
2. **`startIndex`/`endIndex` prop 삭제.** `PostPageContent` → `PostArticle`로 전달되지만 `PostArticle`이 쓰지 않는다.

- [ ] **Step 1: `app/post/[slug]/[...page]/page.tsx` 교체**

**404 관용구 통일:** 기존 코드는 `not-found.tsx`의 컴포넌트를 직접 import해 `return <NotFound />`
했다. 이건 그 JSX를 **일반 페이지 본문으로 렌더**해서 HTTP 200을 준다. `next/navigation`의
`notFound()`는 프레임워크가 잡아 가장 가까운 `not-found.tsx`를 **404 상태로** 렌더한다.

`output: "export"`에서는 이 경로가 프로덕션에서 도달 불가능하다 — `generateStaticParams`가
돌려준 slug만 파일이 되고, 없는 주소는 Cloudflare가 `out/404.html`로 처리한다. 그래도
`next dev`에서 상태 코드가 맞고 관용구가 하나로 통일되므로 `notFound()`를 쓴다.
`app/[slug]/page.tsx`(Task 6)도 같은 방식으로 맞춘다.

```tsx
import { notFound } from "next/navigation";
import PostPageContent from "@/components/PostPageContent";
import { allPosts } from "@/app/lib/posts/repository";
import { paginate, postListParams, postsByTag } from "@/app/lib/posts/queries";

export function generateStaticParams() {
  return postListParams(allPosts());
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; page: string[] }>;
}) {
  const { slug, page } = await params;
  const pageNumber = Number(page[0]);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    notFound();
  }

  const tagged = postsByTag(allPosts(), slug);
  const { items, totalPages } = paginate(tagged, pageNumber);

  if (items.length === 0) {
    notFound();
  }

  return (
    <PostPageContent
      slug={slug}
      page={pageNumber}
      totalPages={totalPages}
      totalCount={tagged.length}
      posts={items}
    />
  );
}
```

`page`는 catch-all 세그먼트라 실제로 `string[]`이다. 기존 코드는 `string`으로 선언하고 `Number(page)`로 우연히 동작하고 있었다.

- [ ] **Step 2: `components/PostPageContent.tsx` 교체**

```tsx
import InnerHeader from "@/components/Layout/InnerHeader";
import Tags from "@/components/Tags/Tags";
import PostArticle from "@/components/PostArticle/index";
import type { Post } from "@/app/lib/posts/types";

interface PostPageContentProps {
  slug: string;
  page: number;
  totalPages: number;
  totalCount: number;
  posts: Post[];
}

const PostPageContent = ({
  slug,
  page,
  totalPages,
  totalCount,
  posts,
}: PostPageContentProps) => {
  return (
    <>
      <InnerHeader title={`Posts ${slug} ${totalCount}`} />
      <Tags currTag={slug} />
      <PostArticle
        posts={posts}
        page={page}
        slug={slug}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </>
  );
};

export default PostPageContent;
```

`InnerHeader`는 `title.split(" ")`로 `Posts / <slug> / <count>`를 분해한다. **이 문자열 형식을 바꾸면 헤더가 깨진다.**

- [ ] **Step 3: `components/PostArticle/index.tsx` 교체**

```tsx
import { ArticleList } from "./ArticleList";
import { PaginationNavigation } from "./PaginationNavigation";
import type { Post } from "@/app/lib/posts/types";

export default function PostArticle({
  posts,
  page,
  slug,
  totalPages,
  totalCount,
}: {
  posts: Post[];
  page: number;
  slug: string;
  totalPages: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1">
        <ArticleList articles={posts} />
      </div>

      <PaginationNavigation
        currPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        slug={slug}
      />
    </div>
  );
}
```

`"use client"`를 제거한다. 클라이언트 상태가 없다.

- [ ] **Step 4: `components/PostArticle/ArticleList.tsx` 교체**

```tsx
import type { Post } from "@/app/lib/posts/types";
import { ArticleItem } from "./ArticleItem";

export const ArticleList = ({ articles }: { articles: Post[] }) => (
  <ul className="list-none grid gap-8 mt-8">
    {articles?.map((item: Post) => (
      <ArticleItem key={item.slug} item={item} />
    ))}
  </ul>
);
```

- [ ] **Step 5: `components/PostArticle/ArticleItem.tsx` 교체**

```tsx
import type { Post } from "@/app/lib/posts/types";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import CardDateArea from "../Card/CardDateArea";
import CardTitleArea from "../Card/CardTitleArea";
import CardTagsArea from "../Card/CardTagsArea";
import CardImageArea from "../Card/CardImageArea";

export const ArticleItem = ({ item }: { item: Post }) => (
  <li>
    <article className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div className="w-[400px]">
        <CardTitleArea
          title={item.title}
          slug={`/${item.slug}`}
          className="flex"
        />
        <CardTagsArea tags={item.tags} />
        <CardDateArea date={item.date} />
      </div>
      <CardImageArea
        src={thumbnailOf(item)}
        className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg flex items-center"
      />
    </article>
  </li>
);
```

- [ ] **Step 6: `components/PostArticle/PaginationNavigation.tsx` 교체**

```tsx
// 페이지네이션 네비게이션 컴포넌트
export const PaginationNavigation = ({
  currPage,
  totalPages,
  totalCount,
  slug,
}: {
  currPage: number;
  totalPages: number;
  totalCount: number;
  slug: string;
}) => {
  const hasPrevPage = currPage > 1;
  const hasNextPage = currPage < totalPages;

  return (
    <div className="relative flex justify-center items-center gap-2 mt-8">
      {hasPrevPage && (
        <a
          className="absolute left-0 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
          href={`/post/${slug}/${currPage - 1}`}
        >
          {`${currPage - 1} Page`}
        </a>
      )}

      <span>{`page : ${currPage} of ${totalPages} (${totalCount})`}</span>

      {hasNextPage && (
        <a
          className="absolute right-0 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
          href={`/post/${slug}/${currPage + 1}`}
        >
          {`${currPage + 1} Page`}
        </a>
      )}
    </div>
  );
};
```

`totalPages`를 직접 받는다. `pageSize`를 여기서 다시 계산하지 않는다 (`PAGE_SIZE`는 `queries.ts`에만 있다).

- [ ] **Step 7: `components/Tags/Tags.tsx` 교체**

```tsx
import TagList from "./TagList";
import { allPosts } from "@/app/lib/posts/repository";
import { allTags } from "@/app/lib/posts/queries";

const Tags = ({ currTag }: { currTag: string }) => {
  return <TagList currTag={currTag} tagNames={allTags(allPosts())} />;
};

export default Tags;
```

`async`와 `NotFound` 폴백이 사라진다. 파일 시스템 읽기는 실패하면 빌드가 실패해야 하고, 조용히 404를 보여주면 안 된다.

- [ ] **Step 8: `components/Tags/TagList.tsx`의 props 타입 교체**

`type/index.ts`가 Task 11에서 삭제되므로 타입을 파일 안으로 옮긴다. **`import { TagListProps } from "@/type/index";`를 삭제하고** 아래 타입 선언을 `export default function` 위에 넣는다. 컴포넌트 본문은 변경하지 않는다.

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TagListProps {
  currTag: string;
  tagNames: string[];
}

export default function TagList({ currTag, tagNames }: TagListProps) {
```

- [ ] **Step 9: 죽은 파일 삭제**

```bash
git rm "app/post/[slug]/[...page]/service/getTagsArticle.ts" components/PostArticle/hooks/usePaginationState.ts
```

- [ ] **Step 10: 확인**

```bash
pnpm test
pnpm dev
```

Expected: 테스트 53개 PASS. 브라우저에서:
- `/post/all/1` — 샘플 3개, 헤더가 `Posts all 3`, 페이지네이션이 `page : 1 of 1 (3)`
- `/post/javascript/1` — 알파·베타 2개, 헤더 `Posts javascript 2`
- `/post/react/1` — 감마 1개
- `/post/browser/1` — 알파 1개
- `/post/nextjs/1` — 404 (샘플에 `nextjs` 태그가 없다)
- 태그 칩 클릭 시 해당 태그 목록으로 이동
- `/post/all/2` — 404 (글이 5개 미만)

- [ ] **Step 11: 커밋**

```bash
git add "app/post" components/PostPageContent.tsx components/PostArticle components/Tags
git commit -m "feat: 목록/태그/페이지네이션을 md 기반으로 전환하고 항등 훅 제거"
```

---

## Task 9: 검색 전환

**Files:**
- Modify: `components/Layout/Header.tsx` (검색 인덱스 전달)
- Modify: `components/Search/components/Search.tsx` (props 추가)
- Modify: `components/Search/hooks/useSearchData.tsx` (전체 교체)
- Delete: `app/api/search/route.ts` (`app/api/` 디렉토리 전체)

**Interfaces:**
- Consumes: `allPosts` (Task 4), `searchIndex` (Task 5), `SearchEntry` (Task 1)
- Produces: `<Search index={SearchEntry[]} />`, `useSearchData(index: SearchEntry[])`

**보안 관련:** 이 작업으로 `NEXT_PUBLIC_API_TOKEN` 노출이 사라진다. 현재 검색은 클라이언트에서 CMS를 직접 호출하며 이 토큰을 쓰고, `NEXT_PUBLIC_` 접두사 때문에 값이 정적 JS 번들에 그대로 박혀 있다.

- [ ] **Step 1: `components/Layout/Header.tsx` 수정**

파일 상단 import에 두 줄을 추가한다.

```tsx
import { allPosts } from "@/app/lib/posts/repository";
import { searchIndex } from "@/app/lib/posts/queries";
```

`export default function Header() {` 다음 줄에 인덱스를 만든다.

```tsx
export default function Header() {
  // 빌드 타임에 만든 검색 인덱스를 클라이언트 컴포넌트에 넘긴다.
  // 별도 JSON 파일과 fetch가 필요 없고, 모달을 열면 즉시 검색된다.
  const index = searchIndex(allPosts());
```

그리고 `<Search />` **두 곳**(데스크톱 `hidden sm:flex` 안, 모바일 `sm:hidden` 안)을 모두 바꾼다.

```tsx
<Search index={index} />
```

- [ ] **Step 2: `components/Search/hooks/useSearchData.tsx` 전체 교체**

```tsx
import { useState } from "react";
import { useDebounce } from "./useDebounce";
import type { SearchEntry } from "@/app/lib/posts/types";

/**
 * 빌드 타임에 받은 인덱스를 제목으로 필터링한다.
 * 디바운스는 입력마다 리렌더가 도는 것을 막기 위해 유지한다.
 */
const useSearchData = (index: SearchEntry[]) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const keyword = debouncedSearchValue.trim().toLowerCase();

  const filteredData =
    keyword === ""
      ? index
      : index.filter((entry: SearchEntry) =>
          entry.title.toLowerCase().includes(keyword)
        );

  return {
    setSearchValue,
    filteredData,
  };
};
export default useSearchData;
```

검색어가 비었을 때 전체를 보여주는 기존 동작을 유지한다 (기존에도 `"".includes`가 전부 참이었다).

- [ ] **Step 3: `components/Search/components/Search.tsx` 수정**

네 곳을 바꾼다. Tailwind 클래스와 나머지 JSX는 손대지 않는다.

(a) import 교체 — `ApiItem`을 `SearchEntry`로:

```tsx
import type { SearchEntry } from "@/app/lib/posts/types";
```

(b) `SearchModal`이 `index`를 받아 훅에 넘긴다:

```tsx
function SearchModal({
  open,
  onClose,
  index,
}: {
  open: boolean;
  onClose: () => void;
  index: SearchEntry[];
}) {
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { filteredData, setSearchValue } = useSearchData(index);
```

(c) 결과 렌더 부분에서 필드 경로를 평탄화한다:

```tsx
            filteredData.map((item: SearchEntry, idx: number) => (
              <div
                key={idx}
                className="flex cursor-pointer justify-between px-4 py-2 text-gray-700 dark:text-gray-100 bg-transparent hover:bg-yellow-100"
                tabIndex={0}
                onClick={() => {
                  onClose();
                  router.push(`/${item.slug}`);
                }}
              >
                <div className="text-gray-400 text-sm">{item.date}</div>
                <div className="dark:text-gray-500 truncate ml-10 flex-1">
                  {item.title}
                </div>
              </div>
            ))
```

(d) `Search` 컴포넌트가 `index`를 받아 모달에 넘긴다:

```tsx
const Search = ({ index }: { index: SearchEntry[] }) => {
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);

  const handleSearchPopup = () => {
    setIsSearchPopupOpen(true);
  };

  const handleClose = () => {
    setIsSearchPopupOpen(false);
  };

  return (
    <>
      <div className="p-4">
        <button
          type="button"
          onClick={handleSearchPopup}
          aria-label="searchButton"
        >
          <SearchIcon className="w-6 h-6" />
        </button>
      </div>
      <SearchModal
        open={isSearchPopupOpen}
        onClose={handleClose}
        index={index}
      />
    </>
  );
};
```

- [ ] **Step 4: 죽은 API 라우트 삭제**

`output: "export"`에서 route handler는 동작하지 않는다. 실제 검색은 클라이언트 훅이 CMS를 직접 호출하고 있었고, 이 파일은 호출되지 않는 죽은 코드다.

```bash
git rm app/api/search/route.ts
```

- [ ] **Step 5: 확인**

```bash
pnpm dev
```

Expected: 검색 아이콘 클릭 → 모달이 열리면서 **즉시** 샘플 3개가 보인다 (이전에는 fetch 응답을 기다렸다). "샘플"을 입력하면 3개, "알파"를 입력하면 1개, "없는말"을 입력하면 "검색 결과가 없습니다.". 결과 클릭 시 상세로 이동. Tab/Shift+Tab 포커스 트랩이 여전히 모달 안에서만 돈다.

- [ ] **Step 6: 커밋**

```bash
git add components/Layout/Header.tsx components/Search
git commit -m "feat: 검색을 빌드 타임 인덱스 props로 전환하고 토큰 노출 제거"
```

---

## Task 10: 사이트맵과 robots 전환

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Modify: `package.json` (`postbuild` 제거, `next-sitemap` 의존성 제거)
- Delete: `next-sitemap.config.js`
- Delete: `scripts/callApiForCommonjs.js`
- Delete: `public/robots.txt`, `public/sitemap.xml`, `public/sitemap-0.xml`

**Interfaces:**
- Consumes: `allPosts` (Task 4), `postListUrls` (Task 5)
- Produces: 없음 (메타데이터 라우트)

**배경:** `next-sitemap`의 `outDir` 기본값은 `public/`인데 이 프로젝트는 `output: "export"`라 배포물이 `out/`이다. `public/`은 빌드 중에 이미 `out/`으로 복사되므로 빌드 **후** `public/`에 쓰인 사이트맵은 그 빌드의 배포물에 반영되지 않는다. 실제로 커밋된 `public/sitemap-0.xml`에는 아티클이 12개만 있고(현재 16개), `/post/javascript,browser/1` 같은 404 URL이 구글에 제출되고 있다.

**`public/` 파일 삭제는 필수다.** `public/robots.txt`와 `app/robots.ts`가 같은 경로를 차지하면 Next 빌드가 충돌 에러를 낸다.

- [ ] **Step 1: `app/sitemap.ts` 작성**

```ts
import type { MetadataRoute } from "next";
import { allPosts } from "@/app/lib/posts/repository";
import { postListUrls } from "@/app/lib/posts/queries";

const BASE_URL = "https://iaman.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts();
  const latestDate = posts[0]?.date;

  return [
    { url: BASE_URL, lastModified: latestDate },
    { url: `${BASE_URL}/about` },
    ...posts.map((post) => ({
      url: `${BASE_URL}/${post.slug}`,
      lastModified: post.date,
    })),
    ...postListUrls(posts).map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: latestDate,
    })),
  ];
}
```

- [ ] **Step 2: `app/robots.ts` 작성**

```ts
import type { MetadataRoute } from "next";

const BASE_URL = "https://iaman.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
```

- [ ] **Step 3: `package.json` 정리**

`scripts`에서 `postbuild`를 삭제한다. `build`는 `"next build"`로 그대로 둔다.

**Task 9 시점 실측으로 확인된 사실:** `postbuild`는 pnpm 10에서 **실제로 실행된다** (계획
초기에 불확실하다고 적었던 부분이 해소됐다). `next build` 자체는 환경변수 없이 성공하는데,
그 뒤 `postbuild`가 `next-sitemap`을 돌리고 `next-sitemap.config.js`가 CMS를 호출해
`result.list`가 undefined가 되어 `TypeError: Cannot read properties of undefined (reading 'map')`로
죽는다. 즉 이 단계 전까지 `pnpm build`는 **0이 아닌 코드로 종료된다.** 이 작업이 그것을 끝낸다.

```bash
pnpm remove next-sitemap
```

- [ ] **Step 4: 죽은 설정과 생성물 삭제**

```bash
git rm next-sitemap.config.js scripts/callApiForCommonjs.js public/robots.txt public/sitemap.xml public/sitemap-0.xml
```

- [ ] **Step 5: 빌드해서 산출물 확인**

```bash
pnpm build
```

Expected: 성공. 그리고 다음을 확인한다.

```bash
cat out/sitemap.xml
cat out/robots.txt
```

Expected:
- `out/sitemap.xml`에 `https://iaman.kr`, `/about`, 샘플 3개 slug, `/post/all/1`, `/post/browser/1`, `/post/javascript/1`, `/post/react/1`이 있다
- `<lastmod>`에 각 글 날짜가 들어 있다
- **콤마가 포함된 URL이 없다**
- `out/robots.txt`가 `Sitemap: https://iaman.kr/sitemap.xml`을 가리킨다
- **`out/404.html`이 생성되어 있다.** 정적 export에서 없는 주소의 유일한 404 경로가 이 파일이다
  (페이지 함수의 `notFound()` 분기는 빌드 타임에 도달하지 않는다 — `generateStaticParams`가
  돌려준 slug만 렌더되므로). Cloudflare Pages가 이 파일을 404 상태로 서빙한다

```bash
grep -c "," out/sitemap.xml
```

Expected: `0` (콤마 없음)

- [ ] **Step 6: 커밋**

```bash
git add app/sitemap.ts app/robots.ts package.json pnpm-lock.yaml
git commit -m "feat: next-sitemap을 Next 메타데이터 라우트로 교체"
```

---

## Task 11: CMS 잔재 제거와 전체 빌드 검증

**Files:**
- Delete: `app/utils/callApi.ts`, `app/utils/helperCallApi.ts`, `type/index.ts`
- Modify: `package.json` (`dayjs` 제거)
- Modify: `tsconfig.json` (필요 시 `@/type/*` 경로 정리)

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (삭제 전용)

- [ ] **Step 1: 남은 참조가 없는지 확인**

```bash
grep -rn "helperCallApi\|callApi\|ApiItem\|ApiResponse\|memexdata\|API_TOKEN\|dayjs\|imgCheck" --include=*.ts --include=*.tsx --include=*.js --include=*.mjs app components scripts type *.ts *.js *.mjs 2>/dev/null | grep -v node_modules
```

Expected: `type/index.ts`, `app/utils/callApi.ts`, `app/utils/helperCallApi.ts` 안의 자기 참조만 나온다. 그 밖의 파일이 나오면 **먼저 그 파일을 고친다.**

- [ ] **Step 2: 파일 삭제**

```bash
git rm app/utils/callApi.ts app/utils/helperCallApi.ts type/index.ts
```

- [ ] **Step 3: `dayjs` 제거**

`CardDateArea`와 `useSearchData`가 더 이상 쓰지 않는다.

```bash
pnpm remove dayjs
```

- [ ] **Step 4: `tsconfig.json` 확인**

`paths`에 `"@/type/*"` 같은 개별 항목이 있으면 삭제한다. `"@/*": ["./*"]` 하나만 있으면 그대로 둔다.

```bash
cat tsconfig.json
```

- [ ] **Step 5: 참조가 완전히 사라졌는지 재확인**

```bash
grep -rn "helperCallApi\|ApiItem\|ApiResponse\|memexdata\|API_TOKEN\|dayjs\|imgCheck" --include=*.ts --include=*.tsx --include=*.js --include=*.mjs app components scripts *.ts *.js *.mjs 2>/dev/null | grep -v node_modules
```

Expected: 출력 없음

- [ ] **Step 6: 환경변수 없이 빌드**

```bash
pnpm test
pnpm build
```

Expected: 테스트 53개 PASS. 빌드 성공. **빌드 로그에 네트워크 호출이나 `API_TOKEN` 관련 경고가 없어야 한다.**

- [ ] **Step 7: 정적 산출물 육안 확인**

```bash
npx serve out
```

`http://localhost:3000`에서 확인한다: 홈, 상세, `/post/all/1`, 태그 필터, 검색, TOC 클릭, 라이트/다크 토글, 640px 미만에서 햄버거 메뉴.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "refactor: CMS 호출 코드와 타입, dayjs 제거"
```

---

## Task 12: 마이그레이션 스크립트 작성

**Files:**
- Create: `scripts/migrate-from-cms.ts`
- Modify: `package.json` (스크립트 2개 추가)

**Interfaces:**
- Consumes: 없음 (독립 실행 스크립트)
- Produces:
  - `migration/cms-dump.json` — CMS 원본 응답
  - `content/posts/YYYY-MM-<slug>.md` — 변환된 글
  - stdout 변환 리포트

**덤프는 2026-08-25에 이미 확보해 커밋했다** (`migration/cms-dump.json`, 16건, 216KB).
따라서 이 스크립트는 `API_TOKEN` 없이 덤프만 읽어 동작해야 하며, 변환을 몇 번이든 다시
돌릴 수 있다. CMS 호출 경로는 남겨두되 실제로는 타지 않는다.

### 실측된 원본 데이터 특성 (덤프 분석 결과)

아래는 추측이 아니라 확인된 사실이다. 스크립트는 이것을 전제로 작성한다.

**해소된 미지수**

- **`createdAt`과 `data.date`가 16건 전부 동일하다.** 날짜 출처를 고민할 필요가 없고, 불일치 리포트도 실제로는 아무것도 출력하지 않을 것이다.
- **`data.thumbnail`은 16건 전부 빈 배열 `[]`** — 쓰이지 않는 필드다. 본문에서 대표 이미지를 뽑는 방식이 맞다.
- **`data.desc` / `data.keywords` / `data.author`는 16건 전부 리터럴 `"string text"`** — CMS 스키마 기본값이 그대로인 미입력 필드다. **frontmatter에 넣지 않는다. 데이터 유실이 아니다.**
- `data.tags`는 콤마 구분 문자열이 맞다. 전체 태그: `browser`, `cloudflare`, `graphql`, `javascript`, `nextjs`, `react`.
- **글마다 `h1` 정확히 1개, `hr` 정확히 1개** — `processHtml`의 TOC 삽입 전제가 실제 데이터와 일치한다.
- 참조 자산 13개가 `public/`에 **전부 존재한다** (누락 0).
- 제목에 이모지(⚛️, 🙊)와 후행 공백이 있다 (`"Number & parseInt "`). `parsePost`가 trim한다.

**본문은 TinyMCE 산출물이다**

| 특성 | 수량 | 대응 |
|---|---|---|
| `span` | 3186 | 대부분 스타일 span. turndown이 벗기고 내용은 보존된다 |
| `pre` / `code` | 46 / 43 | 클래스에 `language-javascript`, `language-markup` 존재 → 펜스 언어 복원 대상 |
| `table` + `colgroup`/`col` | 4 | `turndown-plugin-gfm`이 처리한다. **`keep`에 넣지 말 것** |
| `blockquote` | 12 | turndown 기본 처리 |
| `video` + `source` | 1 | `keep` 대상. 아래 경로 문제 참조 |
| `<br data-mce-bogus="1">`, `class="p1"`, `data-mce-*` | 다수 | 변환 시 자연히 사라진다 |
| `&nbsp;` | 다수 | ` `로 남는다. 검증의 `\s+` 정규화가 이를 포함하므로 비교에 영향 없다 |

**h2에 이미 id가 있고 그 값이 깨져 있다** — 예: `id="h2-&lt;br data-mce-bogus=&quot;1&quot;&gt;"`.
현재 사이트가 멀쩡한 이유는 `processHtml`이 h2/h3의 id를 텍스트 기반으로 **덮어쓰기** 때문이다.
md로 옮기면 쓰레기 id가 사라지고 깨끗한 id가 생성된다 — 전환이 오히려 정리한다.

**경로 형식이 섞여 있다 (정규화에서 가장 조심할 지점)**

- `2026/05`, `2026/07` 이미지: `src="/uploads/..."` — **앞 슬래시 있음**
- `2025` 이미지와 `.mov`: `src="uploads/..."` — **앞 슬래시 없음**
- `.mov` 파일명에 `&`가 있어 HTML에서 `&amp;`로 인코딩되어 있다 (`NDJSON&amp;JSON.mov`). 실제 파일명은 `NDJSON&JSON.mov`다.
- 각 `<img>`에 `src`와 `data-mce-src`가 **둘 다** 있고 값이 다르다. `src`가 정답이다.
  `[^>]*src=` 형태의 정규식은 greedy 매칭 때문에 `data-mce-src=`를 잡는다.
  앞에 하이픈이 오지 않도록 `(?:^|[^-])\bsrc=` 처럼 써야 한다.
- **`<source src="uploads/...">`도 정규화 대상이다.** 초안의 `normalizeImagePaths`는
  md 이미지 문법과 `<img>`만 다뤄 이 경우를 놓친다.

- [ ] **Step 1: `scripts/migrate-from-cms.ts` 작성**

```ts
/****************************************
 *
 * CMS -> Markdown 1회성 마이그레이션
 *
 * 사용법:
 *   API_TOKEN=xxx npx tsx scripts/migrate-from-cms.ts
 *
 * 원본 응답을 migration/cms-dump.json에 저장하므로, 두 번째 실행부터는
 * 토큰 없이 덤프만 재사용해 변환을 다시 시도할 수 있다.
 *
 ****************************************/

import fs from "node:fs";
import path from "node:path";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const API_URL =
  "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/search/v2";
const DUMP_PATH = path.join(process.cwd(), "migration", "cms-dump.json");
const OUT_DIR = path.join(process.cwd(), "content", "posts");

type CmsItem = {
  uid: string;
  createdAt: string;
  data: {
    slug: string;
    content: string;
    title: { KO: string };
    tags: string;
    /** ApiItem 타입에는 없었지만 실제 응답에 존재한다 (기존 사이트맵이 lastmod로 썼다) */
    date?: string;
  };
};

type Warning = { slug: string; kind: string; detail: string };

async function loadDump(): Promise<CmsItem[]> {
  if (fs.existsSync(DUMP_PATH)) {
    console.log(`기존 덤프 재사용: ${DUMP_PATH}`);
    return JSON.parse(fs.readFileSync(DUMP_PATH, "utf8")).list;
  }

  const token = process.env.API_TOKEN;
  if (!token) {
    throw new Error(
      "API_TOKEN 환경변수가 필요합니다. 덤프가 없으면 CMS를 호출해야 합니다."
    );
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Access-Token": token },
    body: JSON.stringify({
      size: 100,
      page: 0,
      direction: "DESC",
      orderCond: { type: "DATE_CREATE" },
    }),
  });

  if (!response.ok) {
    throw new Error(`CMS 응답 실패: ${response.status}`);
  }

  const json = await response.json();
  if (!Array.isArray(json.list)) {
    throw new Error("응답에 list가 없습니다.");
  }

  fs.mkdirSync(path.dirname(DUMP_PATH), { recursive: true });
  fs.writeFileSync(DUMP_PATH, JSON.stringify(json, null, 2), "utf8");
  console.log(`원본 덤프 저장: ${DUMP_PATH} (${json.list.length}건)`);

  return json.list;
}

function createTurndown(): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    fence: "```",
    bulletListMarker: "-",
    emDelimiter: "*",
  });

  service.use(gfm);

  // md로 표현할 수 없는 것은 조용히 버리지 않고 raw HTML로 남긴다.
  // table은 넣지 않는다 — gfm 플러그인이 md 표로 변환하므로 keep하면 그 변환을 막는다.
  service.keep(["iframe", "video", "source", "figure"]);

  // 언어 클래스를 펜스에 복원한다. turndown 기본 규칙은 이를 버린다.
  service.addRule("fencedCodeWithLanguage", {
    filter: (node) =>
      node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE",
    replacement: (_content, node) => {
      const code = (node as HTMLElement).firstChild as HTMLElement;
      const className = code.getAttribute?.("class") ?? "";
      const language = /language-(\S+)/.exec(className)?.[1] ?? "";
      const text = (code.textContent ?? "").replace(/\n+$/, "");

      return `\n\n\`\`\`${language}\n${text}\n\`\`\`\n\n`;
    },
  });

  return service;
}

/**
 * 자산 경로를 절대경로로 통일한다.
 * 원본은 형식이 섞여 있다: 2026년 이미지는 /uploads/..., 2025년 이미지와 .mov는 uploads/...
 * <img> 뿐 아니라 <source>(동영상)도 대상이다.
 */
function normalizeAssetPaths(markdown: string): string {
  return (
    markdown
      // md 이미지 문법: ![alt](uploads/...) -> ![alt](/uploads/...)
      .replace(/\]\((?:\.\/)?uploads\//g, "](/uploads/")
      // 남은 raw HTML의 <img>, <video>의 <source>
      // 주의: `data-mce-src`가 아니라 `src`만 잡아야 한다 (앞에 하이픈이 오면 안 됨)
      .replace(
        /((?:^|[^-])\bsrc=["'])(?:\.\/)?uploads\//gi,
        "$1/uploads/"
      )
  );
}

function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");
}

function buildFrontmatter(item: CmsItem, date: string, tags: string[]): string {
  return [
    "---",
    `slug: ${item.data.slug}`,
    `title: ${JSON.stringify(item.data.title.KO)}`,
    `date: ${date}`,
    `tags: [${tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
    "draft: false",
    "---",
  ].join("\n");
}

function collectWarnings(
  item: CmsItem,
  markdown: string,
  date: string
): Warning[] {
  const warnings: Warning[] = [];
  const slug = item.data.slug;

  // 언어 없는 코드 펜스
  const fenceCount = (markdown.match(/^```\s*$/gm) ?? []).length;
  if (fenceCount > 0) {
    warnings.push({
      slug,
      kind: "코드블록 언어 없음",
      detail: `언어 지정이 없는 펜스 ${fenceCount}개 - 수동 보정 필요`,
    });
  }

  // 남아 있는 raw HTML
  const rawTags = [...markdown.matchAll(/<([a-z][a-z0-9]*)\b/gi)].map(
    (match) => match[1].toLowerCase()
  );
  const uniqueRawTags = [...new Set(rawTags)];
  if (uniqueRawTags.length > 0) {
    warnings.push({
      slug,
      kind: "raw HTML 유지",
      detail: uniqueRawTags.join(", "),
    });
  }

  // createdAt과 data.date 불일치
  if (item.data.date && toDateOnly(item.data.date) !== date) {
    warnings.push({
      slug,
      kind: "날짜 불일치",
      detail: `createdAt=${date} / data.date=${toDateOnly(item.data.date)} - 어느 쪽을 쓸지 판단 필요`,
    });
  }

  // 수상한 이미지 경로
  for (const match of markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
    const src = match[1];
    if (!src.startsWith("/uploads/") && !/^https?:\/\//.test(src)) {
      warnings.push({ slug, kind: "이미지 경로 확인", detail: src });
    }
  }

  return warnings;
}

async function main(): Promise<void> {
  const items = await loadDump();
  const turndown = createTurndown();
  const warnings: Warning[] = [];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const item of items) {
    const date = toDateOnly(item.createdAt);
    const tags = parseTags(item.data.tags);
    const body = normalizeAssetPaths(turndown.turndown(item.data.content));
    const fileName = `${date.slice(0, 7)}-${item.data.slug}.md`;

    fs.writeFileSync(
      path.join(OUT_DIR, fileName),
      `${buildFrontmatter(item, date, tags)}\n\n${body.trim()}\n`,
      "utf8"
    );

    warnings.push(...collectWarnings(item, body, date));
    console.log(`작성: ${fileName} (태그 ${tags.length}개)`);
  }

  console.log(`\n총 ${items.length}건 변환 완료 -> ${OUT_DIR}`);

  if (warnings.length === 0) {
    console.log("경고 없음");
    return;
  }

  console.log(`\n=== 확인 필요 ${warnings.length}건 ===`);
  for (const warning of warnings) {
    console.log(`[${warning.kind}] ${warning.slug}: ${warning.detail}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: `package.json`에 스크립트 추가**

`scripts`에 두 줄을 넣는다.

```json
"migrate": "tsx scripts/migrate-from-cms.ts",
"verify-migration": "tsx scripts/verify-migration.ts"
```

- [ ] **Step 3: 타입 검사만 확인 (실행은 2부)**

```bash
npx tsc --noEmit
```

Expected: 에러 없음. `turndown-plugin-gfm`에 타입 선언이 없다는 에러가 나면 `app/lib/posts/`가 아닌 프로젝트 루트에 `types/turndown-plugin-gfm.d.ts`를 만든다.

```ts
declare module "turndown-plugin-gfm" {
  import type TurndownService from "turndown";
  export const gfm: TurndownService.Plugin;
  export const tables: TurndownService.Plugin;
  export const strikethrough: TurndownService.Plugin;
  export const taskListItems: TurndownService.Plugin;
}
```

- [ ] **Step 4: `.gitignore`에 예외 없음을 확인**

`migration/cms-dump.json`은 **커밋해야 한다** (안전망). `.gitignore`에 `migration`이나 `*.json` 패턴이 없는지 확인한다.

```bash
git check-ignore -v migration/cms-dump.json || echo "ignore 안 됨 - 정상"
```

Expected: `ignore 안 됨 - 정상`

- [ ] **Step 5: 커밋**

```bash
git add scripts/migrate-from-cms.ts package.json
git commit -m "feat: CMS -> md 마이그레이션 스크립트 추가 (실행은 미완)"
```

---

## Task 13: 검증 스크립트 작성

**Files:**
- Create: `scripts/verify-migration.ts`

**Interfaces:**
- Consumes: `migration/cms-dump.json` (Task 12), `content/posts/*.md`
- Produces: stdout 비교 리포트, 실패 시 exit code 1

**비교 원칙:** 문자 단위 완전 일치는 목표가 아니다 (turndown 왕복에서 공백·속성 순서는 반드시 달라진다). 그리고 **`processHtml`을 통과시키지 않는다** — TOC 삽입이 텍스트를 추가해 비교를 오염시킨다. 원본 HTML과 `markdown-it` 출력만 비교한다.

- [ ] **Step 1: `scripts/verify-migration.ts` 작성**

```ts
/****************************************
 *
 * 마이그레이션 검증
 *
 * 사용법:
 *   npx tsx scripts/verify-migration.ts
 *
 * migration/cms-dump.json의 원본 HTML과 content/posts의 md를 렌더한 HTML을
 * 구조적으로 비교한다. TOC 삽입이 텍스트를 바꾸므로 processHtml은 거치지 않는다.
 *
 ****************************************/

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";

const DUMP_PATH = path.join(process.cwd(), "migration", "cms-dump.json");
const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const markdown = new MarkdownIt({ html: true });

type Shape = {
  text: string;
  headings: string[];
  links: string[];
  images: string[];
  codeBlocks: string[];
};

function shapeOf(html: string): Shape {
  const $ = cheerio.load(html);

  return {
    text: $.root().text().replace(/\s+/g, " ").trim(),
    headings: $("h1, h2, h3, h4, h5, h6")
      .map((_, el) => `${el.tagName.toLowerCase()}:${$(el).text().trim()}`)
      .get(),
    links: $("a[href]")
      .map((_, el) => $(el).attr("href") ?? "")
      .get(),
    images: $("img[src]")
      .map((_, el) => normalizeSrc($(el).attr("src") ?? ""))
      .get(),
    codeBlocks: $("pre code")
      .map((_, el) => $(el).text().trim())
      .get(),
  };
}

/** 원본은 uploads/..., md는 /uploads/... 이므로 앞 슬래시를 무시하고 비교한다. */
function normalizeSrc(src: string): string {
  return src.replace(/^\.?\//, "");
}

function diffList(label: string, before: string[], after: string[]): string[] {
  if (before.length === after.length && before.every((v, i) => v === after[i])) {
    return [];
  }

  const problems: string[] = [`${label}: ${before.length}개 -> ${after.length}개`];
  const max = Math.max(before.length, after.length);

  for (let i = 0; i < max; i += 1) {
    if (before[i] !== after[i]) {
      problems.push(`  [${i}] 원본: ${before[i] ?? "(없음)"}`);
      problems.push(`  [${i}] 변환: ${after[i] ?? "(없음)"}`);
    }
  }
  return problems;
}

function firstTextDifference(before: string, after: string): string {
  for (let i = 0; i < Math.max(before.length, after.length); i += 1) {
    if (before[i] !== after[i]) {
      const from = Math.max(0, i - 40);
      return [
        `  위치 ${i}`,
        `  원본: ...${before.slice(from, i + 40)}...`,
        `  변환: ...${after.slice(from, i + 40)}...`,
      ].join("\n");
    }
  }
  return "";
}

function checkImageFiles(images: string[]): string[] {
  const problems: string[] = [];

  for (const src of images) {
    if (/^https?:\/\//.test(src)) {
      continue;
    }
    const filePath = path.join(PUBLIC_DIR, src);
    if (!fs.existsSync(filePath)) {
      problems.push(`이미지 파일 없음: public/${src}`);
    }
  }
  return problems;
}

function main(): void {
  if (!fs.existsSync(DUMP_PATH)) {
    throw new Error(
      `${DUMP_PATH}가 없습니다. 먼저 pnpm migrate 를 실행하세요.`
    );
  }

  const items = JSON.parse(fs.readFileSync(DUMP_PATH, "utf8")).list;
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

  const bySlug = new Map<string, string>();
  for (const file of files) {
    const source = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const { data } = matter(source);
    bySlug.set(String(data.slug), file);
  }

  let failed = 0;

  for (const item of items) {
    const slug = item.data.slug;
    const file = bySlug.get(slug);

    if (file === undefined) {
      console.log(`\n[실패] ${slug}: 대응하는 md 파일이 없습니다.`);
      failed += 1;
      continue;
    }

    const { content } = matter(
      fs.readFileSync(path.join(POSTS_DIR, file), "utf8")
    );

    const before = shapeOf(item.data.content);
    const after = shapeOf(markdown.render(content));

    const problems: string[] = [];

    if (before.text !== after.text) {
      problems.push("텍스트 불일치");
      problems.push(firstTextDifference(before.text, after.text));
    }
    problems.push(...diffList("헤딩", before.headings, after.headings));
    problems.push(...diffList("링크", before.links, after.links));
    problems.push(...diffList("이미지", before.images, after.images));
    problems.push(...diffList("코드블록", before.codeBlocks, after.codeBlocks));
    problems.push(...checkImageFiles(after.images));

    if (problems.length === 0) {
      console.log(`[통과] ${slug} (${file})`);
      continue;
    }

    failed += 1;
    console.log(`\n[실패] ${slug} (${file})`);
    for (const problem of problems) {
      console.log(`  ${problem}`);
    }
  }

  const orphans = [...bySlug.keys()].filter(
    (slug) => !items.some((item: { data: { slug: string } }) => item.data.slug === slug)
  );
  if (orphans.length > 0) {
    console.log(`\n덤프에 없는 md: ${orphans.join(", ")}`);
  }

  console.log(
    `\n=== ${items.length}건 중 ${items.length - failed}건 통과, ${failed}건 실패 ===`
  );

  if (failed > 0) {
    process.exit(1);
  }
}

main();
```

- [ ] **Step 2: 타입 검사**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add scripts/verify-migration.ts
git commit -m "feat: 마이그레이션 구조 비교 검증 스크립트 추가"
```

---

# 2부: `API_TOKEN` 확보 후 (2026-08-24 월)

## Task 14: 마이그레이션 실행과 검증

**Files:**
- Create: `migration/cms-dump.json` (스크립트가 생성)
- Create: `content/posts/*.md` 16개 (스크립트가 생성)
- Delete: `content/posts/2026-08-sample-alpha.md`, `content/posts/2026-08-sample-beta.md`, `content/posts/2026-07-sample-gamma.md`

**Interfaces:**
- Consumes: Task 12, Task 13의 스크립트
- Produces: 실제 콘텐츠

- [ ] **Step 1: 마이그레이션 실행**

```bash
API_TOKEN=<토큰> pnpm migrate
```

Expected: `migration/cms-dump.json` 생성, `content/posts/`에 md 16개 작성, 변환 리포트 출력.

**리포트를 반드시 읽는다.** 특히:
- `날짜 불일치` — `createdAt`과 `data.date`가 다른 글. 어느 쪽이 맞는지 판단해 frontmatter를 고친다
- `코드블록 언어 없음` — 해당 글을 열어 펜스에 언어를 채운다
- `raw HTML 유지` — 남은 태그가 의도한 것인지 확인한다
- `이미지 경로 확인` — 경로를 고친다

- [ ] **Step 2: 원본 덤프를 먼저 커밋**

변환 결과를 손보기 전에 원본을 안전하게 확보한다.

```bash
git add migration/cms-dump.json
git commit -m "chore: CMS 원본 응답 덤프 보관"
```

- [ ] **Step 3: 검증 실행**

```bash
pnpm verify-migration
```

Expected: 16건 전부 통과. 실패 항목이 있으면 리포트의 위치를 보고 md를 고친 뒤 다시 실행한다. **`pnpm migrate`를 다시 돌리면 수동 보정이 덮어써진다** — 재변환이 필요하면 보정 내용을 먼저 기록한다.

- [ ] **Step 4: 임시 샘플 글 삭제**

```bash
git rm content/posts/2026-08-sample-alpha.md content/posts/2026-08-sample-beta.md content/posts/2026-07-sample-gamma.md
```

- [ ] **Step 5: 검증 재실행**

```bash
pnpm verify-migration
```

Expected: `덤프에 없는 md` 목록이 비어 있고 16건 통과.

- [ ] **Step 6: 커밋**

```bash
git add content/posts
git commit -m "feat: CMS 아티클 16개를 md로 마이그레이션"
```

---

## Task 15: 최종 확인

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 테스트와 빌드**

```bash
pnpm test
pnpm build
```

Expected: 테스트 53개 PASS. **환경변수 없이** 빌드 성공.

- [ ] **Step 2: URL 보존 확인**

기존 배포 사이트맵에 있던 아티클 URL 12개가 새 산출물에 모두 존재해야 한다.

```bash
for slug in code-caching difference-between-number-and-parseInt dynamic-components-and-lazy focus-trap graphql-study javascript-proxy JavaScript-String-Index-notation NDJSON-JSON Object-Map react-suspense-javascript-promise-throw truthy-falsy window-object; do
  test -f "out/$slug.html" && echo "OK   $slug" || echo "MISSING $slug"
done
```

Expected: 12개 전부 `OK`. `MISSING`이 있으면 해당 slug의 frontmatter를 확인한다.

위 12개는 기존 배포 사이트맵에 있던 것이고, 나머지 4개는 덤프를 받은 뒤에야 알 수 있다. **md 파일의 모든 slug이 정적 페이지로 나왔는지도 확인한다.**

```bash
grep -h "^slug:" content/posts/*.md | sed "s/^slug: *//" | while read -r slug; do
  test -f "out/$slug.html" && echo "OK   $slug" || echo "MISSING $slug"
done
```

Expected: 16개 전부 `OK`

- [ ] **Step 3: 사이트맵 확인**

```bash
grep -c "<url>" out/sitemap.xml
grep -c "," out/sitemap.xml
grep "lastmod" out/sitemap.xml | head -5
cat out/robots.txt
```

Expected: 아티클 16개 + 홈 + `/about` + 목록 페이지들. **콤마 개수 0.** `lastmod`에 각 글 날짜. robots가 `https://iaman.kr/sitemap.xml`을 가리킴.

- [ ] **Step 4: 이미지 파일 존재 확인**

```bash
grep -oh "/uploads/[^\")' ]*" content/posts/*.md | sort -u | while read -r p; do
  test -f "public$p" && echo "OK   $p" || echo "MISSING $p"
done
```

Expected: 전부 `OK`

- [ ] **Step 5: 육안 확인**

```bash
npx serve out
```

체크리스트:
- 홈: 최신 5개 (윗줄 3개 + 아랫줄 2개)
- 아티클 상세 16개 중 최소 5개: 제목, TOC, 이미지, 코드블록, 링크
- TOC 링크 클릭 스크롤, h2 클릭 스크롤
- `/post/all/1` ~ `/post/all/4` 페이지네이션 앞뒤 이동
- 태그 칩 클릭 필터링
- 검색: 모달 즉시 표시, 제목 검색, 결과 클릭 이동, Tab 포커스 트랩
- 라이트/다크 토글
- 640px 미만: 블로그 이름 숨김, 햄버거 메뉴

- [ ] **Step 6: 최종 커밋과 정리 안내**

```bash
git add -A
git commit -m "chore: md 전환 최종 확인"
```

배포 후 안정화되면 별도 커밋으로 정리할 것들 (**지금 지우지 않는다**):
- `migration/cms-dump.json`
- `scripts/migrate-from-cms.ts`, `scripts/verify-migration.ts`
- `package.json`의 `migrate`, `verify-migration` 스크립트
- `turndown`, `@types/turndown`, `turndown-plugin-gfm` devDependency
- Cloudflare Pages 환경변수 `API_TOKEN`, `NEXT_PUBLIC_API_TOKEN` (**대시보드에서 직접 삭제 필요**)

---

## 부록: 이 계획이 함께 해소하는 기존 버그

| 버그 | 해소되는 곳 |
|---|---|
| 태그 부분 문자열 매칭 (`js`가 `nextjs`에 걸림) | Task 5 — `postsByTag` 배열 정확 비교 + 회귀 테스트 |
| 콤마 문자열이 목록 라우트로 생성됨 (`/post/javascript,browser/1`) | Task 5 — `postListParams` + 회귀 테스트, Task 10 — 사이트맵 검증 |
| 아티클 slug이 목록 라우트로 생성되어 404 페이지가 만들어짐 | Task 5 — `postListParams`가 `all` + 실제 태그만 생성 |
| `size: 20` 상한으로 21번째 글부터 사라짐 | Task 4 — 파일 시스템 기반 |
| `NEXT_PUBLIC_API_TOKEN`이 정적 번들에 노출 | Task 9 |
| 사이트맵이 배포물에 반영되지 않음 (12/16건만 등재) | Task 10 |
| 죽은 코드: `generateStaticParamsWithPagination`, `app/api/search/route.ts` | Task 6, Task 9 |
| 미사용 의존성 4개 | Task 1 |
| `CardImageArea`의 사용하지 않는 `next/image` import | Task 7 |
| 항등 함수인 `usePaginationState` 훅 | Task 8 |
