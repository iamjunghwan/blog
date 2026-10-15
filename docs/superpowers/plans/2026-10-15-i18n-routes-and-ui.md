# 다국어 2단계: 영어 라우트·전환 버튼·SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/en` 아래에 영어 사이트를 띄우고, 헤더에 언어 전환 버튼을 달고, 구글이 두 판을 같은 글로 인식하게 한다. 시험 번역 1편(`swe-bench`)을 넣어 실제로 눌러 볼 수 있게 한다.

**Architecture:** 한국어는 접두사 없이 지금 주소를 그대로 쓰고 영어만 `/en`을 붙인다. `<html lang>`이 언어마다 달라야 하는데 루트 레이아웃은 하나뿐이므로, Next의 **라우트 그룹**으로 `(ko)`·`(en)` 두 루트 레이아웃을 만든다(괄호 폴더는 URL에 안 나타난다). 페이지 본체는 `lang`을 받는 공용 컴포넌트로 빼고 라우트 파일은 그것을 호출하는 몇 줄짜리로 둔다. 내부 링크는 전부 `localePath(lang, path)`를 거친다.

**Tech Stack:** Next.js 16 App Router (`output: "export"`), React 19, TypeScript, Tailwind 3.4, `node:test` + `node:assert/strict`를 `tsx`로 실행

## Global Constraints

- **커밋은 사용자가 허락한 뒤에만 한다.** 각 Task의 커밋 단계는 사용자 승인을 받고 실행한다. 승인 없이 `git commit`/`git push`를 실행하지 않는다.
- **기존 한국어 주소를 하나도 바꾸지 않는다.** `/`, `/swe-bench`, `/post/all/1`, `/about` 이 그대로여야 한다. 이미 구글에 색인돼 있다.
- 언어 코드는 **`ko`와 `en`** 뿐이다. `kr`은 국가 코드라 쓰지 않는다.
- **영어판이 없는 글은 영어 쪽에 내지 않는다.** 영어 목록·사이트맵·검색에 영어판이 있는 글만 나온다.
- **i18n 라이브러리를 쓰지 않는다.** 1단계에서 만든 `app/lib/i18n/messages.ts`에 키를 더한다.
- 같은 글의 두 언어판은 **frontmatter `slug`가 같다.**
- import는 **`@/` 별칭**을 쓴다.
- 테스트 파일은 **`app/` 아래**에 둔다 (`pnpm test`의 글로브가 `app/**/*.test.ts`).
- 주석은 한국어로, *무엇*이 아니라 *왜*를 적는다.

### 이 작업에서 반복된 실패 양식 — Task마다 반드시 확인할 것

1단계에서 같은 종류의 사고가 다섯 번 났다: **시그니처나 전제를 바꾸면, 그것에 기대던 곳이 조용히 깨진다.**

그래서 **시그니처를 바꾸거나 파일을 옮기는 Task는 전수 조사를 한 단계로 포함한다.** 각 Task에 그 단계가 명시돼 있다. 브리프 밖에서 깨진 곳이 나오면 **고치지 말고 보고**한다.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `app/lib/i18n/paths.ts` (신규) | `localePath(lang, path)` — 내부 링크에 `/en`을 붙이거나 안 붙인다 |
| `app/lib/i18n/paths.test.ts` (신규) | 위 함수의 경계 |
| `app/lib/i18n/messages.ts` (수정) | `searchTitle`, `switchTo` 키 추가 |
| `components/Layout/Header.tsx` (수정) | `lang` prop, 링크에 `localePath`, 전환 버튼 자리 |
| `components/Layout/LanguageSwitch.tsx` (신규) | 전환 버튼. `usePathname()`으로 상대 주소 계산 |
| `components/Button/MenuToggleButton.tsx` (수정) | `lang` prop, 모바일 메뉴 링크 |
| `components/MainArticleList.tsx` (수정) | `lang` prop, "모든 글 보기" 링크 |
| `components/MainArticleItem.tsx` (수정) | `lang` prop, 제목 링크, 날짜 |
| `components/PostArticle/ArticleList.tsx` (수정) | `lang` prop 전달 |
| `components/PostArticle/ArticleItem.tsx` (수정) | `lang` prop, 제목 링크, 날짜 |
| `components/PostArticle/index.tsx` (수정) | `lang` prop 전달 |
| `components/PostArticle/PaginationNavigation.tsx` (수정) | `lang` prop, 앞뒤 페이지 링크 |
| `components/Card/CardTagsArea.tsx` (수정) | `lang` prop, 태그 링크 |
| `components/Card/CardDateArea.tsx` (수정) | `lang`을 **필수**로 (기본값 제거) |
| `components/Tags/Tags.tsx`, `TagList.tsx` (수정) | `lang` prop, `router.push` 경로 |
| `components/Search/components/Search.tsx` (수정) | `lang` prop, 결과 링크, 문구 |
| `components/PostPageContent.tsx` (수정) | `lang` prop 전달 |
| `components/pages/HomePage.tsx` (신규) | 메인 본체 |
| `components/pages/ArticlePage.tsx` (신규) | 글 본체 |
| `components/pages/AboutPage.tsx` (신규) | 소개 본체 |
| `components/pages/PostListPage.tsx` (신규) | 목록 본체 |
| `app/(ko)/**` | 한국어 라우트 (기존 파일 이동) |
| `app/(en)/en/**` | 영어 라우트 (신규, 얇은 래퍼) |
| `app/not-found.tsx` (수정) | 자기 `<html>`을 들고 있게 |
| `app/utils/metadata.ts` (수정) | `locale`, `alternates.languages` |
| `app/sitemap.ts` (수정) | 두 언어 + alternates |
| `content/posts/en/2026/10/swe-bench.md` (신규) | 시험 번역 |

---

### Task 1: 언어별 경로 만들기

**Files:**
- Create: `app/lib/i18n/paths.ts`
- Create: `app/lib/i18n/paths.test.ts`

**Interfaces:**
- Consumes: `Lang` (`@/app/lib/posts/types`)
- Produces: `localePath(lang: Lang, path: string): string`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/lib/i18n/paths.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { localePath } from "@/app/lib/i18n/paths";

test("한국어는 접두사가 붙지 않는다", () => {
  assert.equal(localePath("ko", "/"), "/");
  assert.equal(localePath("ko", "/swe-bench"), "/swe-bench");
  assert.equal(localePath("ko", "/post/all/1"), "/post/all/1");
});

test("영어는 /en 이 붙는다", () => {
  assert.equal(localePath("en", "/swe-bench"), "/en/swe-bench");
  assert.equal(localePath("en", "/post/all/1"), "/en/post/all/1");
});

test("영어 루트는 /en 이다 (/en/ 이 아니다)", () => {
  // 끝에 슬래시가 붙으면 정적 export에서 /en/index.html 과 /en.html 이 갈린다.
  assert.equal(localePath("en", "/"), "/en");
});

test("앞에 슬래시가 없어도 붙여 준다", () => {
  assert.equal(localePath("ko", "swe-bench"), "/swe-bench");
  assert.equal(localePath("en", "swe-bench"), "/en/swe-bench");
});

test("이미 접두사가 붙은 경로를 두 번 붙이지 않는다", () => {
  // 호출부가 실수로 완성된 경로를 넘겨도 /en/en/... 이 되지 않아야 한다.
  assert.equal(localePath("en", "/en/swe-bench"), "/en/swe-bench");
  assert.equal(localePath("en", "/en"), "/en");
});

test("'en'으로 시작하는 slug을 접두사로 오인하지 않는다", () => {
  // "/english-is-hard"는 접두사가 아니라 그냥 slug이다.
  assert.equal(localePath("en", "/english-is-hard"), "/en/english-is-hard");
});
```

- [ ] **Step 2: 실패를 확인한다**

```bash
npx tsx --test app/lib/i18n/paths.test.ts
```

Expected: FAIL — 모듈을 찾을 수 없음

- [ ] **Step 3: 구현한다**

`app/lib/i18n/paths.ts`:

```ts
/****************************************
 *
 * 내부 링크의 언어별 경로
 *
 * 한국어는 접두사가 없다 — 기존 주소가 이미 구글에 색인돼 있어 바꿀 수 없다.
 * 영어만 /en 을 붙인다. 이 비대칭 때문에 링크를 만드는 곳마다 분기가 생기는데,
 * 그 분기를 여기 한 곳에 모은다.
 *
 ****************************************/

import type { Lang } from "@/app/lib/posts/types";

const PREFIX: Record<Lang, string> = {
  ko: "",
  en: "/en",
};

export function localePath(lang: Lang, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefix = PREFIX[lang];

  if (prefix === "") {
    return normalized;
  }

  // 이미 붙어 있으면 그대로 둔다. 호출부가 완성된 경로를 넘겨도 /en/en/... 이 되지 않는다.
  // 경계를 함께 보지 않으면 "/english-is-hard" 같은 slug을 접두사로 오인한다.
  if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
    return normalized;
  }

  // 루트는 "/en/"이 아니라 "/en"이어야 한다. 정적 export에서 끝 슬래시가 파일을 가른다.
  return normalized === "/" ? prefix : `${prefix}${normalized}`;
}
```

- [ ] **Step 4: 통과를 확인한다**

```bash
npx tsx --test app/lib/i18n/paths.test.ts
npx tsc --noEmit
pnpm test
```

Expected: 전부 통과, tsc 출력 없음, `fail 0`

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add app/lib/i18n/paths.ts app/lib/i18n/paths.test.ts
git commit -m "feat: 내부 링크의 언어별 경로 helper"
```

---

### Task 2: 링크를 만드는 컴포넌트가 언어를 받게

**Files:**
- Modify: `components/Layout/Header.tsx`
- Modify: `components/Button/MenuToggleButton.tsx`
- Modify: `components/MainArticleList.tsx`
- Modify: `components/MainArticleItem.tsx`
- Modify: `components/PostArticle/index.tsx`
- Modify: `components/PostArticle/ArticleList.tsx`
- Modify: `components/PostArticle/ArticleItem.tsx`
- Modify: `components/PostArticle/PaginationNavigation.tsx`
- Modify: `components/Card/CardTagsArea.tsx`
- Modify: `components/Card/CardDateArea.tsx`
- Modify: `components/Tags/Tags.tsx`
- Modify: `components/Tags/TagList.tsx`
- Modify: `components/Search/components/Search.tsx`
- Modify: `components/PostPageContent.tsx`
- Modify: `app/lib/i18n/messages.ts`

**Interfaces:**
- Consumes: `localePath(lang, path)` (Task 1), `messages(lang)` (1단계)
- Produces: 위 컴포넌트들이 모두 `lang: Lang`을 **필수 prop**으로 받는다. 기본값을 두지 않는다 — 기본값은 전달을 빠뜨려도 타입 검사가 통과하게 만들어, 영어 화면에 한국어가 조용히 새는 경로를 남긴다.

- [ ] **Step 1: 지금 하드코딩된 경로를 전수 조사한다**

```bash
grep -rn 'href="/\|href={`/\|push("/\|push(`/' components app --include=*.tsx | grep -v localePath
```

아래 Step들이 다루는 곳 외에 더 나오면 **고치지 말고 보고하라.**

- [ ] **Step 2: 문자열 두 개를 추가한다**

`app/lib/i18n/messages.ts`의 `Messages` 타입과 두 사전에 각각 넣는다. 기존 키는 건드리지 않는다.

타입에:

```ts
  searchTitle: string;
  switchTo: string;
```

`ko`에:

```ts
    searchTitle: "아티클 검색",
    switchTo: "English로 보기",
```

`en`에:

```ts
    searchTitle: "Search articles",
    switchTo: "한국어로 보기",
```

`switchTo`는 **반대 언어로 가는 버튼의 설명**이라 ko 쪽이 영어를, en 쪽이 한국어를 가리킨다. 뒤바꾸지 마라.

- [ ] **Step 3: 날짜 컴포넌트의 기본값을 없앤다**

`components/Card/CardDateArea.tsx`에서 `lang`을 필수로 바꾼다. 맨 위 설명 주석 블록은 그대로 둔다.

```tsx
interface CardDateAreaProps {
  date: string;
  className?: string;
  lang: Lang;
}

const CardDateArea = ({
  date,
  className = "flex items-center mb-4",
  lang,
}: CardDateAreaProps) => {
```

기본값 `= "ko"`를 지운다. 이제 전달을 빠뜨리면 **컴파일이 실패해** 호출부를 컴파일러가 지목한다.

- [ ] **Step 4: 태그 링크**

`components/Card/CardTagsArea.tsx`:

```tsx
import Link from "next/link";
import { localePath } from "@/app/lib/i18n/paths";
import type { Lang } from "@/app/lib/posts/types";

interface CardTagsAreaProps {
  tags: string[];
  lang: Lang;
  className?: string;
  linkClassName?: string;
}

const CardTagsArea = ({
  tags,
  lang,
  className = "flex flex-wrap gap-2 mb-2",
  linkClassName = "text-sm text-blue-600 dark:text-blue-400 uppercase no-underline",
}: CardTagsAreaProps) => {
  return (
    <div className={className}>
      {tags.map((tag: string, i: number) => (
        <Link key={i} href={localePath(lang, `/post/${tag}/1`)} className={linkClassName}>
          {tag}
        </Link>
      ))}
    </div>
  );
};

export default CardTagsArea;
```

- [ ] **Step 5: 메인 카드**

`components/MainArticleItem.tsx`에서 세 군데를 바꾼다. 나머지(호버 틴트, stretched link 클래스, 썸네일)는 그대로 둔다.

함수 머리:

```tsx
const MainArticleItem = ({
  post,
  lang,
  priority = false,
}: {
  post: Post;
  lang: Lang;
  priority?: boolean;
}) => {
```

`CardDateArea`·`CardTagsArea`·`CardTitleArea` 호출:

```tsx
          <CardDateArea
            date={post.date}
            lang={lang}
            className="flex items-center text-sm mb-1"
          />
          <CardTagsArea
            tags={post.tags}
            lang={lang}
            className="relative z-10 flex flex-wrap gap-2 mb-2"
          />
          <CardTitleArea
            title={post.title}
            slug={localePath(lang, `/${post.slug}`)}
            className="flex"
            linkClassName="after:absolute after:inset-0"
          />
```

import에 추가:

```tsx
import { localePath } from "@/app/lib/i18n/paths";
import type { Lang } from "@/app/lib/posts/types";
```

- [ ] **Step 6: 메인 목록**

`components/MainArticleList.tsx`:

```tsx
const MainArticleList = ({ posts, lang }: { posts: Post[]; lang: Lang }) => {
  return (
    <>
      <ul className="list-none">
        {posts.map((post: Post, index: number) => (
          <MainArticleItem
            key={post.slug}
            post={post}
            lang={lang}
            priority={index === 0}
          />
        ))}
      </ul>

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
```

import에 `localePath`, `messages`, `Lang`을 추가한다. 하드코딩돼 있던 `모든 글 보기 →`는 사전에서 온다.

- [ ] **Step 7: 목록 행**

`components/PostArticle/ArticleItem.tsx`:

```tsx
export const ArticleItem = ({
  item,
  lang,
  priority = false,
}: {
  item: Post;
  lang: Lang;
  priority?: boolean;
}) => (
```

안쪽 세 군데:

```tsx
        <CardTitleArea
          title={item.title}
          slug={localePath(lang, `/${item.slug}`)}
          className="flex"
          linkClassName="after:absolute after:inset-0"
        />
        <CardTagsArea
          tags={item.tags}
          lang={lang}
          className="relative z-10 flex flex-wrap gap-2 mb-2"
        />
        <CardDateArea date={item.date} lang={lang} />
```

`components/PostArticle/ArticleList.tsx`:

```tsx
export const ArticleList = ({
  articles,
  lang,
}: {
  articles: Post[];
  lang: Lang;
}) => (
  <ul className="list-none grid gap-8 mt-8">
    {/* 맨 위 한 장만 즉시 받는다. 나머지는 스크롤해야 보이므로 미룬다. */}
    {articles?.map((item: Post, index: number) => (
      <ArticleItem key={item.slug} item={item} lang={lang} priority={index === 0} />
    ))}
  </ul>
);
```

- [ ] **Step 8: 페이지네이션**

`components/PostArticle/PaginationNavigation.tsx`의 `slug` 아래에 `lang`을 더하고 두 링크를 바꾼다.

```tsx
export const PaginationNavigation = ({
  currPage,
  totalPages,
  totalCount,
  slug,
  lang,
}: {
  currPage: number;
  totalPages: number;
  totalCount: number;
  slug: string;
  lang: Lang;
}) => {
```

```tsx
          href={localePath(lang, `/post/${slug}/${currPage - 1}`)}
```

```tsx
          href={localePath(lang, `/post/${slug}/${currPage + 1}`)}
```

import에 `localePath`, `Lang`을 추가한다.

`components/PostArticle/index.tsx`는 `lang`을 받아 `ArticleList`와 `PaginationNavigation`에 넘긴다.

```tsx
export default function PostArticle({
  posts,
  page,
  slug,
  totalPages,
  totalCount,
  lang,
}: {
  posts: Post[];
  page: number;
  slug: string;
  totalPages: number;
  totalCount: number;
  lang: Lang;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1">
        <ArticleList articles={posts} lang={lang} />
      </div>

      <PaginationNavigation
        currPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        slug={slug}
        lang={lang}
      />
    </div>
  );
}
```

- [ ] **Step 9: 태그 목록**

`components/Tags/Tags.tsx`:

```tsx
import TagList from "./TagList";
import { allPosts } from "@/app/lib/posts/repository";
import { allTags, postsIn } from "@/app/lib/posts/queries";
import type { Lang } from "@/app/lib/posts/types";

const Tags = ({ currTag, lang }: { currTag: string; lang: Lang }) => {
  // 태그 목록은 그 언어의 글에서만 뽑는다. 두 언어를 합치면 글이 없는 태그의
  // 목록 페이지로 가는 링크가 생긴다.
  return (
    <TagList
      currTag={currTag}
      lang={lang}
      tagNames={allTags(postsIn(allPosts(), lang))}
    />
  );
};

export default Tags;
```

`components/Tags/TagList.tsx`는 클라이언트 컴포넌트다. props와 `router.push`를 바꾼다.

```tsx
interface TagListProps {
  currTag: string;
  tagNames: string[];
  lang: Lang;
}

export default function TagList({ currTag, tagNames, lang }: TagListProps) {
  const [activeTag, setActiveTag] = useState(currTag);
  const router = useRouter();

  const handleClick = (tag: string) => {
    if (tag === currTag) return;

    setActiveTag(tag);
    router.push(localePath(lang, `/post/${tag}/1`));
  };
```

import에 `localePath`, `Lang`을 추가한다.

- [ ] **Step 10: 검색**

`components/Search/components/Search.tsx`에서 `SearchModal`과 바깥 `Search` 컴포넌트 모두 `lang`을 받게 한다.

바깥 컴포넌트의 props에 `lang: Lang`을 더하고 `SearchModal`에 넘긴다. `SearchModal` 안에서:

```tsx
        <div className="text-lg font-bold mb-4 dark:text-gray-500">
          {messages(lang).searchTitle}
        </div>
        <input
          onChange={(e) => setSearchValue(e.target.value)}
          ref={searchInputRef}
          type="search"
          placeholder={messages(lang).searchPlaceholder}
          className="w-full border rounded px-3 py-2 mb-4 "
        />
```

결과 항목이 글로 이동하는 부분에서 경로를 `localePath(lang, \`/${item.slug}\`)`로 바꾼다. 파일의 해당 줄을 찾아 고친다:

```bash
grep -n "item.slug" components/Search/components/Search.tsx
```

import에 `localePath`, `messages`, `Lang`을 추가한다.

- [ ] **Step 11: 모바일 메뉴**

`components/Button/MenuToggleButton.tsx`가 `lang`을 받게 하고, `aria-label` 두 개와 메뉴 안 링크를 바꾼다.

```tsx
const MenuToggleButton = ({ lang }: { lang: Lang }) => {
```

```tsx
          aria-label={messages(lang).openMenu}
```

```tsx
                aria-label={messages(lang).closeMenu}
```

메뉴 안의 `<Link href="...">` 들을 `localePath(lang, ...)`로 감싼다. 어떤 링크가 있는지 먼저 본다:

```bash
grep -n "Link href" components/Button/MenuToggleButton.tsx
```

import에 `localePath`, `messages`, `Lang`을 추가한다.

- [ ] **Step 12: 헤더**

`components/Layout/Header.tsx`가 `lang`을 받게 한다. 검색 인덱스도 그 언어 글로 만든다.

```tsx
export default function Header({ lang }: { lang: Lang }) {
  // 빌드 타임에 만든 검색 인덱스를 클라이언트 컴포넌트에 넘긴다.
  // 별도 JSON 파일과 fetch가 필요 없고, 모달을 열면 즉시 검색된다.
  // 보고 있는 언어의 글만 담는다 — 한국어 화면에서 영어 글이 나오면 혼란스럽다.
  const index = searchIndex(postsIn(allPosts(), lang));

  return (
    <header className="pt-10 pb-10 flex justify-between items-center">
      <Link href={localePath(lang, "/")}>
```

```tsx
          <Link className="p-4" href={localePath(lang, "/post/all/1")}>
            {"Posts"}
          </Link>
          <Link className="p-4" href={localePath(lang, "/about")}>
            {"About"}
          </Link>
          <Search index={index} lang={lang} />
          <Theme />
```

```tsx
        <div className="sm:hidden flex items-center">
          <Search index={index} lang={lang} />
          <Theme />
          <MenuToggleButton lang={lang} />
        </div>
```

import에 `localePath`, `Lang`을 추가한다.

- [ ] **Step 13: 목록 페이지 묶음**

`components/PostPageContent.tsx`가 `lang`을 받아 `Tags`와 `PostArticle`에 넘긴다.

```tsx
interface PostPageContentProps {
  slug: string;
  page: number;
  totalPages: number;
  totalCount: number;
  posts: Post[];
  lang: Lang;
}

const PostPageContent = ({
  slug,
  page,
  totalPages,
  totalCount,
  posts,
  lang,
}: PostPageContentProps) => {
  return (
    <>
      <InnerHeader title={`Posts ${slug} ${totalCount}`} />
      <Tags currTag={slug} lang={lang} />
      <PostArticle
        posts={posts}
        page={page}
        slug={slug}
        totalPages={totalPages}
        totalCount={totalCount}
        lang={lang}
      />
    </>
  );
};
```

- [ ] **Step 14: 호출부를 컴파일러에게 물어본다**

```bash
npx tsc --noEmit
```

이제 `lang`을 빠뜨린 곳이 전부 오류로 나온다. **기존 라우트 파일 4개**(`app/page.tsx`, `app/[slug]/page.tsx`, `app/post/[slug]/[...page]/page.tsx`, `app/layout.tsx`)에서 `lang="ko"`를 넘겨 메운다. 예:

```tsx
      <MainArticleList posts={posts} lang="ko" />
```

```tsx
    <PostPageContent … lang="ko" />
```

`app/layout.tsx`의 `<Headers />`는 `<Headers lang="ko" />`로.

라우트 파일 4개 **밖에서** 오류가 나면 고치지 말고 보고하라.

- [ ] **Step 15: 화면이 그대로인지 확인한다**

```bash
npx tsc --noEmit
pnpm test
pnpm build
grep -c '<url>' out/sitemap.xml
find out -name '*.html' | wc -l
```

Expected: tsc 출력 없음, `fail 0`, 빌드 41페이지, 사이트맵 **37**, html **39**

```bash
grep -o 'href="/post/[a-z-]*/1"' out/post/all/1.html | sort -u | head -3
```

Expected: `/en`이 **붙지 않은** 경로만 나온다.

- [ ] **Step 16: 커밋 (사용자 승인 후)**

```bash
git add components app/lib/i18n/messages.ts app/page.tsx "app/[slug]/page.tsx" "app/post/[slug]/[...page]/page.tsx" app/layout.tsx
git commit -m "feat: 링크와 문구를 만드는 컴포넌트가 언어를 받게"
```

---

### Task 3: 페이지 본체를 공용 컴포넌트로 추출

**Files:**
- Create: `components/pages/HomePage.tsx`
- Create: `components/pages/ArticlePage.tsx`
- Create: `components/pages/AboutPage.tsx`
- Create: `components/pages/PostListPage.tsx`
- Modify: `app/page.tsx`, `app/[slug]/page.tsx`, `app/about/page.tsx`, `app/post/[slug]/[...page]/page.tsx`

**Interfaces:**
- Consumes: Task 2의 `lang` prop을 받는 컴포넌트들
- Produces:
  - `HomePage({ lang }: { lang: Lang })`
  - `ArticlePage({ lang, slug }: { lang: Lang; slug: string })`
  - `AboutPage({ lang }: { lang: Lang })`
  - `PostListPage({ lang, tag, page }: { lang: Lang; tag: string; page: number })`

라우트 파일은 이것들을 호출하는 몇 줄짜리가 된다. `generateStaticParams`와 `generateMetadata`는 **공용화하지 않는다** — Next가 라우트 파일에서 직접 export된 것만 읽기 때문이다.

- [ ] **Step 1: 메인 본체**

`components/pages/HomePage.tsx`:

```tsx
/****************************************
 *
 * HomePage : 메인 본체
 *
 * 라우트 파일이 아니라 여기에 둔다. 한국어(/)와 영어(/en)가 같은 화면을 쓰는데
 * 루트 레이아웃이 달라 라우트 파일을 둘로 나눠야 하기 때문이다. 본체가 하나면
 * 한쪽만 고쳐져 두 언어가 어긋나는 일이 없다.
 *
 ****************************************/

import InnerHeader from "@/components/Layout/InnerHeader";
import MainArticleList from "@/components/MainArticleList";
import { allPosts } from "@/app/lib/posts/repository";
import { postsIn } from "@/app/lib/posts/queries";
import type { Lang } from "@/app/lib/posts/types";

/** 메인에 보여줄 글 개수. 이 값만 쓴다. */
const LATEST_COUNT = 5;

const HomePage = ({ lang }: { lang: Lang }) => {
  const posts = postsIn(allPosts(), lang).slice(0, LATEST_COUNT);

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <MainArticleList posts={posts} lang={lang} />
    </>
  );
};

export default HomePage;
```

- [ ] **Step 2: 글 본체**

`components/pages/ArticlePage.tsx`:

```tsx
import { notFound } from "next/navigation";
import { allPosts } from "@/app/lib/posts/repository";
import { postBySlug, postsIn } from "@/app/lib/posts/queries";
import { renderPostBody } from "@/app/lib/posts/render";
import ArticleContent from "@/app/(ko)/[slug]/components/ArticleContent";
import type { Lang } from "@/app/lib/posts/types";

const ArticlePage = ({ lang, slug }: { lang: Lang; slug: string }) => {
  // 반드시 그 언어의 글에서 찾는다. 두 언어판은 slug이 같아서, 전체에서 찾으면
  // 정렬상 앞서는 쪽이 잡혀 한국어 주소가 영어 본문을 내보낸다.
  const post = postBySlug(postsIn(allPosts(), lang), slug);

  if (post === undefined) {
    notFound();
  }

  return <ArticleContent content={renderPostBody(post.body)} />;
};

export default ArticlePage;
```

`ArticleContent`의 import 경로는 Task 4에서 파일이 `app/(ko)/[slug]/components/`로 옮겨 간 뒤의 것이다. **Task 4를 끝낸 뒤 이 경로가 맞는지 확인한다** — Task 4 Step 6에 확인 단계가 있다.

- [ ] **Step 3: 소개 본체**

현재 `app/about/page.tsx`의 내용을 그대로 옮긴다. 파일을 읽어 `export default function Page()` 부분만 `const AboutPage = ({ lang }: { lang: Lang }) => {` 로 바꾸고 나머지 JSX는 손대지 않는다.

```bash
cat app/about/page.tsx
```

`components/pages/AboutPage.tsx`로 옮기되, `lang`은 아직 쓰지 않는다. 소개 페이지는 본문이 이름·직함·링크뿐이라 번역할 문자열이 없다. **prop은 받되 쓰지 않는 것이 맞다** — 다음에 소개글을 번역할 때 배선이 이미 돼 있다.

쓰지 않는 prop에 린트가 걸리면 이름 앞에 밑줄을 붙이지 말고, 아래 주석을 달아 둔다:

```tsx
// lang은 지금 쓰지 않는다. 소개 본문에 번역할 문자열이 없기 때문인데,
// 라우트가 넘기는 모양은 다른 페이지와 같게 두어 나중에 번역을 넣을 때 배선이 끝나 있게 한다.
```

- [ ] **Step 4: 목록 본체**

`components/pages/PostListPage.tsx`:

```tsx
import { notFound } from "next/navigation";
import PostPageContent from "@/components/PostPageContent";
import { allPosts } from "@/app/lib/posts/repository";
import { paginate, postsByTag, postsIn } from "@/app/lib/posts/queries";
import type { Lang } from "@/app/lib/posts/types";

const PostListPage = ({
  lang,
  tag,
  page,
}: {
  lang: Lang;
  tag: string;
  page: number;
}) => {
  if (!Number.isInteger(page) || page < 1) {
    notFound();
  }

  const tagged = postsByTag(postsIn(allPosts(), lang), tag);
  const { items, totalPages } = paginate(tagged, page);

  if (items.length === 0) {
    notFound();
  }

  return (
    <PostPageContent
      slug={tag}
      page={page}
      totalPages={totalPages}
      totalCount={tagged.length}
      posts={items}
      lang={lang}
    />
  );
};

export default PostListPage;
```

- [ ] **Step 5: 라우트 파일을 얇게 만든다**

`app/page.tsx`:

```tsx
import HomePage from "@/components/pages/HomePage";

export default function Page() {
  return <HomePage lang="ko" />;
}
```

`app/[slug]/page.tsx`:

```tsx
import ArticlePage from "@/components/pages/ArticlePage";
import { allPosts } from "@/app/lib/posts/repository";
import { postsIn } from "@/app/lib/posts/queries";

export function generateStaticParams() {
  return postsIn(allPosts(), "ko").map((post) => ({ slug: post.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ArticlePage lang="ko" slug={slug} />;
}
```

`app/about/page.tsx`:

```tsx
import AboutPage from "@/components/pages/AboutPage";

export default function Page() {
  return <AboutPage lang="ko" />;
}
```

`app/post/[slug]/[...page]/page.tsx`:

```tsx
import PostListPage from "@/components/pages/PostListPage";
import { allPosts } from "@/app/lib/posts/repository";
import { postListParams, postsIn } from "@/app/lib/posts/queries";

export function generateStaticParams() {
  return postListParams(postsIn(allPosts(), "ko"));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; page: string[] }>;
}) {
  const { slug, page } = await params;
  return <PostListPage lang="ko" tag={slug} page={Number(page[0])} />;
}
```

- [ ] **Step 6: 화면이 그대로인지 확인한다**

```bash
npx tsc --noEmit
pnpm test
pnpm build
grep -c '<url>' out/sitemap.xml
find out -name '*.html' | wc -l
```

Expected: tsc 출력 없음, `fail 0`, 41페이지, 사이트맵 **37**, html **39**

- [ ] **Step 7: 커밋 (사용자 승인 후)**

```bash
git add components/pages app/page.tsx "app/[slug]/page.tsx" app/about/page.tsx "app/post/[slug]/[...page]/page.tsx"
git commit -m "refactor: 페이지 본체를 언어를 받는 공용 컴포넌트로"
```

---

### Task 4: 라우트 그룹으로 루트 레이아웃 둘로

**Files:**
- Move: `app/page.tsx`, `app/[slug]/`, `app/about/`, `app/post/` → `app/(ko)/` 아래
- Create: `app/(ko)/layout.tsx`
- Create: `app/(en)/layout.tsx`
- Modify: `app/not-found.tsx`
- Delete: `app/layout.tsx` (내용은 두 그룹 레이아웃으로 간다)

**Interfaces:**
- Consumes: Task 3의 공용 페이지 컴포넌트
- Produces: `/`, `/swe-bench`, `/about`, `/post/all/1` 이 `(ko)` 그룹에서 `<html lang="ko">`로 렌더된다. 주소는 바뀌지 않는다.

- [ ] **Step 1: 지금 루트 레이아웃을 읽어 둔다**

```bash
cat app/layout.tsx
```

GA 스크립트, `ThemeProvider`, 폰트, 컨테이너(`mx-auto max-w-3xl px-6`), `Headers`/`Article`/`Footer` 구조가 들어 있다. 두 그룹 레이아웃이 이걸 **그대로** 가져가되 `lang`과 `Headers`의 prop만 달라진다.

- [ ] **Step 2: 파일을 옮긴다**

```bash
mkdir -p "app/(ko)"
git mv app/page.tsx "app/(ko)/page.tsx"
git mv "app/[slug]" "app/(ko)/[slug]"
git mv app/about "app/(ko)/about"
git mv app/post "app/(ko)/post"
```

`app/layout.tsx`, `app/not-found.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/globals.css`, `app/lib/`, `app/utils/`는 **옮기지 않는다.**

- [ ] **Step 3: 한국어 루트 레이아웃**

`app/layout.tsx`를 `app/(ko)/layout.tsx`로 옮기고 두 군데를 바꾼다.

```bash
git mv app/layout.tsx "app/(ko)/layout.tsx"
```

`import "./globals.css";` 를 `import "@/app/globals.css";` 로 바꾼다(한 단계 깊어졌다).

`<html lang="kr">` 를 `<html lang="ko">` 로 바꾼다. **`kr`은 국가 코드라 틀린 값이었다.**

`<Headers />` 를 `<Headers lang="ko" />` 로 바꾼다.

다른 import 경로(`../components/...`)도 한 단계 깊어졌으니 `@/components/...`로 바꾼다.

- [ ] **Step 4: 영어 루트 레이아웃**

`app/(en)/layout.tsx`를 만든다. `app/(ko)/layout.tsx`를 복사해 `lang`만 바꾸는 것이 아니라, **두 파일이 공통 부분을 공유**하게 한다. 공통 틀을 `components/Layout/RootShell.tsx`로 뺀다.

`components/Layout/RootShell.tsx`:

```tsx
/****************************************
 *
 * RootShell : 두 언어의 루트 레이아웃이 공유하는 틀
 *
 * <html lang>이 언어마다 달라야 해서 루트 레이아웃을 그룹별로 둘 만들어야 하는데,
 * 그 안의 GA·테마·폰트·헤더·푸터는 완전히 같다. 복사해 두면 한쪽만 고쳐진다.
 *
 ****************************************/

import { ThemeProvider } from "next-themes";
import Headers from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Article from "@/components/Layout/Article";
import { fonts } from "@/app/utils/fonts";
import type { Lang } from "@/app/lib/posts/types";

const isProd = process.env.NODE_ENV === "production";

export default function RootShell({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <html lang={lang} className={fonts.variable} suppressHydrationWarning>
      <head>
        {isProd && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASURE_ID}`}
            ></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.GA_MEASURE_ID}', {
                  page_path: window.location.pathname,
                });
              `,
              }}
            />
          </>
        )}
      </head>
      <body className="font-custom min-h-full bg-white dark:bg-black text-black dark:text-white">
        <ThemeProvider
          defaultTheme="light"
          storageKey="blog-Theme"
          attribute="class"
        >
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex flex-col justify-between min-h-screen">
              <Headers lang={lang} />
              <Article>{children}</Article>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

그러면 `app/(ko)/layout.tsx`는 이렇게 줄어든다:

```tsx
import "@/app/globals.css";
import RootShell from "@/components/Layout/RootShell";
import { generateCommonMetadata } from "@/app/utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "iaman",
    description: "This blog was created by an.",
    lang: "ko",
    path: "/",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="ko">{children}</RootShell>;
}
```

`app/(en)/layout.tsx`:

```tsx
import "@/app/globals.css";
import RootShell from "@/components/Layout/RootShell";
import { generateCommonMetadata } from "@/app/utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "iaman",
    description: "A blog by an.",
    lang: "en",
    path: "/",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>;
}
```

`generateCommonMetadata`의 `lang`·`path` 인자는 **Task 6**에서 추가한다. 이 Task에서는 아직 없으므로 **그 두 줄을 빼고** 쓴다:

```tsx
  return generateCommonMetadata({
    title: "iaman",
    description: "This blog was created by an.",
  });
```

- [ ] **Step 5: 최상위 not-found가 자기 html을 갖게 한다**

루트 레이아웃이 여러 개면 최상위 `not-found.tsx`는 어느 레이아웃에도 감싸이지 않는다. `app/not-found.tsx`를 아래로 바꾼다.

```tsx
import "@/app/globals.css";
import Link from "next/link";

/**
 * 루트 레이아웃이 (ko)/(en) 둘로 나뉘면 최상위 not-found는 어느 쪽에도 감싸이지 않아
 * <html>과 <body> 없이 렌더된다. 그래서 여기서 직접 들고 있는다.
 *
 * 이 페이지는 어떤 언어 폴더에도 속하지 않는 주소(예: /aaa)에서 나오므로
 * 언어를 알 수 없다. 영어로 적고 양쪽 홈으로 가는 링크를 둔다.
 */
export default function NotFound() {
  return (
    <html lang="en">
      <body className="font-custom bg-white dark:bg-black text-black dark:text-white">
        <div className="mx-auto max-w-3xl px-6 flex flex-col items-center justify-center min-h-screen gap-6">
          <p className="text-5xl font-black">404</p>
          <p className="font-bold text-2xl">Can Not Find This Page !</p>
          <div className="flex gap-3">
            <Link href="/">
              <button className="bg-yellow-200 rounded-lg text-base py-4 px-8 text-black">
                한국어 홈
              </button>
            </Link>
            <Link href="/en">
              <button className="bg-yellow-200 rounded-lg text-base py-4 px-8 text-black">
                English home
              </button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: 옮긴 파일을 가리키던 import를 전수 조사한다**

```bash
npx tsc --noEmit
```

`ArticleContent`·`ArticlePage` 등 경로가 깨진 곳이 나온다. Task 3이 `components/pages/ArticlePage.tsx`에 적어 둔 `@/app/(ko)/[slug]/components/ArticleContent` 가 실제 위치와 맞는지 확인한다:

```bash
ls "app/(ko)/[slug]/components/"
```

맞지 않으면 실제 경로로 고친다. 그 밖에 깨진 import도 **경로만** 고친다 — 로직은 건드리지 마라.

- [ ] **Step 7: 주소가 그대로인지 확인한다**

```bash
pnpm build
find out -name '*.html' | wc -l
grep -c '<url>' out/sitemap.xml
ls out/index.html out/swe-bench.html out/about.html out/post/all/1.html
```

Expected: html **39**, 사이트맵 **37**, 네 파일 모두 존재. `(ko)`는 주소에 나타나지 않는다.

```bash
grep -o '<html lang="[a-z]*"' out/index.html
```

Expected: `<html lang="ko"` — 이전의 `kr`이 고쳐졌다.

```bash
ls out/404.html
```

Expected: 존재한다. Cloudflare Pages가 이 파일을 쓴다.

- [ ] **Step 8: 커밋 (사용자 승인 후)**

```bash
git add app components/Layout/RootShell.tsx
git commit -m "refactor: 라우트 그룹으로 루트 레이아웃을 언어별로 분리"
```

---

### Task 5: 영어 라우트

**Files:**
- Create: `app/(en)/en/page.tsx`
- Create: `app/(en)/en/[slug]/page.tsx`
- Create: `app/(en)/en/[slug]/layout.tsx`
- Create: `app/(en)/en/about/page.tsx`
- Create: `app/(en)/en/about/layout.tsx`
- Create: `app/(en)/en/post/[slug]/[...page]/page.tsx`
- Create: `app/(en)/en/post/[slug]/[...page]/layout.tsx`

**Interfaces:**
- Consumes: Task 3의 공용 페이지 컴포넌트, Task 4의 `(en)` 루트 레이아웃
- Produces: `/en`, `/en/<slug>`, `/en/about`, `/en/post/<tag>/<page>`

**지금은 영어 글이 0편이다.** 그래서 이 Task가 끝나면 `/en`은 빈 목록을 보여 주고, `/en/<slug>`·`/en/post/...`는 **생성되는 페이지가 하나도 없다.** 정상이다 — Task 7이 영어 글 1편을 넣으면 채워진다.

- [ ] **Step 1: 메인**

`app/(en)/en/page.tsx`:

```tsx
import HomePage from "@/components/pages/HomePage";

export default function Page() {
  return <HomePage lang="en" />;
}
```

- [ ] **Step 2: 글**

`app/(en)/en/[slug]/page.tsx`:

```tsx
import ArticlePage from "@/components/pages/ArticlePage";
import { allPosts } from "@/app/lib/posts/repository";
import { postsIn } from "@/app/lib/posts/queries";

export function generateStaticParams() {
  // 영어판이 있는 글만 /en 아래에 생긴다. 없는 글은 영어 쪽에 내지 않는다.
  return postsIn(allPosts(), "en").map((post) => ({ slug: post.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ArticlePage lang="en" slug={slug} />;
}
```

`app/(en)/en/[slug]/layout.tsx` — 한국어 쪽(`app/(ko)/[slug]/layout.tsx`)을 열어 **같은 구조**로 만들되 `postsIn(allPosts(), "en")`을 쓴다.

```bash
cat "app/(ko)/[slug]/layout.tsx"
```

`postBySlug(postsIn(allPosts(), "ko"), slug)` 부분만 `"en"`으로 바꾸고 나머지(`excerptOf`, `thumbnailOf`, `absoluteUrl`, `prose` 래퍼)는 그대로 가져온다.

- [ ] **Step 3: 소개**

`app/(en)/en/about/page.tsx`:

```tsx
import AboutPage from "@/components/pages/AboutPage";

export default function Page() {
  return <AboutPage lang="en" />;
}
```

`app/(en)/en/about/layout.tsx`:

```tsx
import { generateCommonMetadata } from "@/app/utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "About by iaman",
    description: "A blog by an.",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

- [ ] **Step 4: 목록**

`app/(en)/en/post/[slug]/[...page]/page.tsx`:

```tsx
import PostListPage from "@/components/pages/PostListPage";
import { allPosts } from "@/app/lib/posts/repository";
import { postListParams, postsIn } from "@/app/lib/posts/queries";

export function generateStaticParams() {
  // 영어 글이 가진 태그의 목록만 만든다. 글이 0편이면 아무 페이지도 생기지 않는다.
  return postListParams(postsIn(allPosts(), "en"));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; page: string[] }>;
}) {
  const { slug, page } = await params;
  return <PostListPage lang="en" tag={slug} page={Number(page[0])} />;
}
```

`app/(en)/en/post/[slug]/[...page]/layout.tsx`:

```tsx
import { generateCommonMetadata } from "@/app/utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "Posts by iaman",
    description: "A blog by an.",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

- [ ] **Step 5: 확인한다**

```bash
npx tsc --noEmit
pnpm test
pnpm build
ls out/en.html out/en/about.html
```

Expected: tsc 출력 없음, `fail 0`, 빌드 성공. `out/en.html`과 `out/en/about.html`이 생긴다.

```bash
grep -o '<html lang="[a-z]*"' out/en.html
```

Expected: `<html lang="en"`

```bash
grep -o 'href="/en/post/all/1"' out/en.html | head -1
```

Expected: 영어 헤더의 Posts 링크에 `/en`이 붙어 있다.

```bash
grep -c '<url>' out/sitemap.xml
```

Expected: 아직 **37** — 사이트맵은 Task 6에서 영어를 더한다.

- [ ] **Step 6: 커밋 (사용자 승인 후)**

```bash
git add "app/(en)"
git commit -m "feat: /en 아래 영어 라우트"
```

---

### Task 6: 언어 전환 버튼과 SEO

**Files:**
- Create: `components/Layout/LanguageSwitch.tsx`
- Modify: `components/Layout/Header.tsx`
- Modify: `app/utils/metadata.ts`
- Modify: `app/(ko)/[slug]/layout.tsx`, `app/(en)/en/[slug]/layout.tsx`
- Modify: `app/sitemap.ts`

**Interfaces:**
- Consumes: `bilingualSlugs(posts)` (1단계), `localePath(lang, path)` (Task 1)
- Produces: `LanguageSwitch({ lang, bilingualSlugs }: { lang: Lang; bilingualSlugs: string[] })`

- [ ] **Step 1: 전환 버튼**

`components/Layout/LanguageSwitch.tsx`:

```tsx
"use client";

/****************************************
 *
 * LanguageSwitch : 언어 전환 버튼
 *
 * 헤더는 자기가 어떤 글 위에 있는지 모른다. 그래서 usePathname으로 현재 주소를 읽어
 * 반대 언어의 주소를 만든다.
 *
 * 글 페이지인데 반대 언어판이 없으면 버튼을 감춘다 — 눌렀더니 404가 나는 것보다 낫다.
 * 양쪽 다 있는 slug 목록은 빌드 타임에 받아 온다.
 *
 ****************************************/

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath } from "@/app/lib/i18n/paths";
import { messages } from "@/app/lib/i18n/messages";
import type { Lang } from "@/app/lib/posts/types";

/** 글 페이지의 주소는 접두사를 뺀 뒤 segment가 하나뿐이다. */
function articleSlugOf(pathWithoutPrefix: string): string | null {
  const segments = pathWithoutPrefix.split("/").filter((s) => s !== "");

  if (segments.length !== 1) {
    return null;
  }
  // /about 은 글이 아니다. /post/... 는 segment가 둘 이상이라 여기 오지 않는다.
  return segments[0] === "about" ? null : segments[0];
}

export default function LanguageSwitch({
  lang,
  bilingualSlugs,
}: {
  lang: Lang;
  bilingualSlugs: string[];
}) {
  const pathname = usePathname() ?? "/";
  const other: Lang = lang === "ko" ? "en" : "ko";

  // 현재 주소에서 접두사를 떼어 '언어 중립 경로'로 만든다.
  const neutral = lang === "en" ? pathname.replace(/^\/en(?=\/|$)/, "") || "/" : pathname;

  const slug = articleSlugOf(neutral);
  if (slug !== null && !bilingualSlugs.includes(slug)) {
    return null;
  }

  return (
    <Link
      className="p-4 text-sm font-semibold uppercase"
      href={localePath(other, neutral)}
      hrefLang={other}
      title={messages(lang).switchTo}
    >
      {other.toUpperCase()}
    </Link>
  );
}
```

- [ ] **Step 2: 헤더에 단다**

`components/Layout/Header.tsx`에서 `bilingualSlugs`를 계산해 넘긴다.

import에 추가:

```tsx
import LanguageSwitch from "@/components/Layout/LanguageSwitch";
import { bilingualSlugs } from "@/app/lib/posts/queries";
```

함수 안:

```tsx
  // 전환 버튼이 "이 글에 반대 언어판이 있나"를 판단할 재료. 빌드 타임에 만든다.
  const bothLangs = bilingualSlugs(allPosts());
```

데스크톱 메뉴의 `<Theme />` 앞에, 모바일 쪽 `<Theme />` 앞에 각각 넣는다:

```tsx
          <LanguageSwitch lang={lang} bilingualSlugs={bothLangs} />
          <Theme />
```

- [ ] **Step 3: 메타데이터가 언어와 주소를 받게 한다**

`app/utils/metadata.ts`의 `MetadataOptions`와 본문을 바꾼다.

```ts
import { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";
import { localePath } from "@/app/lib/i18n/paths";
import type { Lang } from "@/app/lib/posts/types";

export interface MetadataOptions {
  title: string;
  description: string;
  imageUrl?: string;
  type?: "article" | "website";
  /** 이 페이지의 언어. og:locale과 hreflang을 정한다. */
  lang?: Lang;
  /**
   * 언어 접두사를 뺀 경로 (예: "/swe-bench", "/about", "/").
   * 주어지면 canonical과 hreflang을 만든다. 없으면 둘 다 넣지 않는다 —
   * 틀린 canonical은 아예 없는 것보다 나쁘다.
   */
  path?: string;
  /** 반대 언어판이 있는가. 없으면 hreflang을 한쪽만 넣는다. */
  hasCounterpart?: boolean;
}

const OG_LOCALE: Record<Lang, string> = {
  ko: "ko_KR",
  en: "en_US",
};

export function generateCommonMetadata(options: MetadataOptions): Metadata {
  const {
    title,
    description,
    imageUrl = `${SITE_URL}/default-thumbnail.png`,
    type = "article",
    lang = "ko",
    path,
    hasCounterpart = false,
  } = options;

  const alternates =
    path === undefined
      ? undefined
      : {
          canonical: `${SITE_URL}${localePath(lang, path)}`,
          // 반대판이 없으면 자기 자신만 적는다. 없는 주소를 가리키면 구글이 오류로 본다.
          languages: hasCounterpart
            ? {
                ko: `${SITE_URL}${localePath("ko", path)}`,
                en: `${SITE_URL}${localePath("en", path)}`,
              }
            : { [lang]: `${SITE_URL}${localePath(lang, path)}` },
        };

  return {
    title,
    description,
    ...(alternates === undefined ? {} : { alternates }),
    openGraph: {
      title,
      description,
      siteName: "iaman Blog",
      // 크기는 적지 않는다. 글마다 대표 이미지가 달라 실제 크기를 여기서 알 수 없고,
      // 틀린 값을 적으면 공유 카드가 잘리거나 큰 이미지 카드로 안 잡힌다.
      images: [{ url: imageUrl, alt: title }],
      locale: OG_LOCALE[lang],
      type,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    icons: { icon: "/iaman.ico" },
  };
}
```

- [ ] **Step 4: 글 메타데이터가 hreflang을 내게 한다**

`app/(ko)/[slug]/layout.tsx`의 `generateCommonMetadata` 호출에 세 인자를 더한다. `counterpart`로 반대판 유무를 본다.

import에 추가:

```tsx
import { counterpart } from "@/app/lib/posts/queries";
```

```tsx
  return generateCommonMetadata({
    title: post.title,
    description: excerptOf(post),
    imageUrl: absoluteUrl(thumbnailOf(post)),
    lang: "ko",
    path: `/${post.slug}`,
    hasCounterpart: counterpart(allPosts(), post.slug, "ko") !== undefined,
  });
```

`app/(en)/en/[slug]/layout.tsx`에도 같은 모양으로 넣되 `lang: "en"`, `counterpart(allPosts(), post.slug, "en")`를 쓴다.

- [ ] **Step 5: 사이트맵에 영어를 더한다**

`app/sitemap.ts`를 아래로 바꾼다.

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";
import { allPosts } from "@/app/lib/posts/repository";
import { bilingualSlugs, postListUrls, postsIn } from "@/app/lib/posts/queries";
import { localePath } from "@/app/lib/i18n/paths";
import { LANGS } from "@/app/lib/posts/repository";
import type { Lang } from "@/app/lib/posts/types";

// 정적 export에서는 메타데이터 라우트도 빌드 타임에 고정된 정적 파일로
// 내보내야 한다는 것을 Next에 명시해야 한다.
export const dynamic = "force-static";

/** 양쪽 다 있는 글에만 alternates를 단다. 없는 주소를 가리키면 구글이 오류로 본다. */
function alternatesFor(path: string, both: boolean) {
  if (!both) {
    return undefined;
  }
  return {
    languages: {
      ko: `${SITE_URL}${localePath("ko", path)}`,
      en: `${SITE_URL}${localePath("en", path)}`,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts();
  const both = new Set(bilingualSlugs(posts));
  const entries: MetadataRoute.Sitemap = [];

  for (const lang of LANGS as Lang[]) {
    const inLang = postsIn(posts, lang);
    if (inLang.length === 0) {
      continue;
    }
    const latestDate = inLang[0]?.date;

    entries.push({
      url: `${SITE_URL}${localePath(lang, "/")}`,
      lastModified: latestDate,
    });
    entries.push({ url: `${SITE_URL}${localePath(lang, "/about")}` });

    for (const post of inLang) {
      entries.push({
        url: `${SITE_URL}${localePath(lang, `/${post.slug}`)}`,
        lastModified: post.date,
        ...(alternatesFor(`/${post.slug}`, both.has(post.slug)) ?? {}),
      });
    }

    for (const path of postListUrls(inLang)) {
      entries.push({
        url: `${SITE_URL}${localePath(lang, path)}`,
        lastModified: latestDate,
      });
    }
  }

  return entries;
}
```

- [ ] **Step 6: 확인한다**

```bash
npx tsc --noEmit
pnpm test
pnpm build
```

영어 글이 아직 0편이므로 사이트맵은 한국어만 나온다.

```bash
grep -c '<url>' out/sitemap.xml
```

Expected: **37** (영어 글 0편)

```bash
grep -o 'rel="canonical" href="[^"]*"' out/swe-bench.html
grep -o '<html lang="[a-z]*"' out/en.html
```

Expected: canonical이 `https://iaman.kr/swe-bench`, `/en`은 `lang="en"`

```bash
grep -o 'property="og:locale" content="[^"]*"' out/index.html out/en.html
```

Expected: `out/index.html`은 `ko_KR`, `out/en.html`은 `en_US`

- [ ] **Step 7: 커밋 (사용자 승인 후)**

```bash
git add components/Layout app/utils/metadata.ts app/sitemap.ts "app/(ko)/[slug]/layout.tsx" "app/(en)/en/[slug]/layout.tsx"
git commit -m "feat: 언어 전환 버튼과 hreflang·og:locale·언어별 사이트맵"
```

---

### Task 7: 시험 번역 1편과 전체 검증

**Files:**
- Create: `content/posts/en/2026/10/swe-bench.md`

**Interfaces:**
- Consumes: 앞선 모든 Task

- [ ] **Step 1: 원문을 읽는다**

```bash
cat content/posts/ko/2026/10/swe-bench.md
```

- [ ] **Step 2: 영어판을 쓴다**

`content/posts/en/2026/10/swe-bench.md`를 만든다. frontmatter 규칙:

- `slug`은 **원문과 똑같이** `swe-bench`. 그게 두 판을 잇는 열쇠다
- `date`, `tags`, `thumbnail`은 원문과 같게 둔다. 썸네일 그림에는 글씨가 없어 언어와 무관하다
- `title`과 `description`은 영어로

본문 번역에서 지킬 것:

- **코드블록 안은 번역하지 않는다.** 식별자·명령·출력은 그대로 둔다
- 표의 구조(열 수, 구분선)를 그대로 유지한다
- 원문이 `<strong>` 태그를 쓴 곳이 있다. 그건 한국어 조사 때문에 `**`가 안 먹혀서 쓴 우회라, **영어에서는 `**`를 그대로 쓰면 된다**
- 링크 주소는 바꾸지 않는다
- `# 제목` 아래 `---` 수평선은 이 블로그의 관례이므로 유지한다

- [ ] **Step 3: 파싱되는지 먼저 본다**

```bash
pnpm test
```

Expected: `fail 0`. `content.test.ts`가 실제 글을 읽으므로 frontmatter가 틀렸으면 여기서 잡힌다.

1단계에서 넣은 `"한국어 글은 모두 lang이 ko다"` 테스트가 `ko.length === posts.length`를 단언한다. **영어 글이 생기면 이게 실패한다.** 아래로 고친다:

```ts
test("언어 폴더가 글의 lang을 정한다", () => {
  // 폴더가 언어를 정한다. 이동이나 추가가 잘못되면 글이 엉뚱한 언어로 잡힌다.
  const ko = postsIn(posts, "ko");
  const en = postsIn(posts, "en");

  assert.equal(ko.length + en.length, posts.length, "ko도 en도 아닌 글이 있다");
  assert.ok(ko.length >= 19, `한국어 글이 ${ko.length}편뿐이다 (19편 이상이어야 한다)`);
  assert.ok(
    en.every((post) => ko.some((k) => k.slug === post.slug)),
    "영어판만 있고 한국어 원문이 없는 글이 있다"
  );
});
```

import에 `postsIn`을 추가한다.

- [ ] **Step 4: 빌드하고 숫자를 센다**

```bash
pnpm build
grep -c '<url>' out/sitemap.xml
find out -name '*.html' | wc -l
```

Expected: 사이트맵이 **37에서 늘어난다** — 영어 글 1편 + `/en` + `/en/about` + `/en/post/all/1` + 그 글의 태그 목록 2개(`swe-bench`, `ai`) = **+6 → 43**. 숫자가 다르면 어디가 빠졌는지 확인한다.

```bash
ls out/en/swe-bench.html out/en/post/all/1.html
```

Expected: 둘 다 존재

- [ ] **Step 5: hreflang이 양쪽을 가리키는지 본다**

```bash
grep -o 'hreflang="[a-z]*" href="[^"]*"' out/swe-bench.html
grep -o 'hreflang="[a-z]*" href="[^"]*"' out/en/swe-bench.html
```

Expected: 두 파일 모두 `ko` → `https://iaman.kr/swe-bench`, `en` → `https://iaman.kr/en/swe-bench`

```bash
grep -o 'hreflang="[a-z]*"' out/npm-tgz.html
```

Expected: `ko` 하나만 — 영어판이 없는 글은 한쪽만 가리킨다

- [ ] **Step 6: 전환 버튼이 올바르게 나타나고 사라지는지 본다**

```bash
grep -c '>EN</a>' out/swe-bench.html
grep -c '>EN</a>' out/npm-tgz.html
grep -c '>KO</a>' out/en/swe-bench.html
```

Expected: 첫 번째 **1**(영어판 있음), 두 번째 **0**(없음), 세 번째 **1**

> 전환 버튼은 클라이언트 컴포넌트라 `usePathname()`이 서버 렌더에서도 현재 경로를 준다. 0이 나와야 할 곳에 1이 나오면 `bilingualSlugs` 전달이 끊긴 것이다.

- [ ] **Step 7: 한국어 쪽이 그대로인지 확인한다**

```bash
ls out/index.html out/swe-bench.html out/about.html out/post/all/1.html
grep -o '<html lang="[a-z]*"' out/index.html
grep -c '<li class="relative -mx-4' out/index.html
```

Expected: 네 파일 존재, `lang="ko"`, 메인 카드 **5**장

```bash
grep -o 'href="/en/' out/index.html | wc -l
```

Expected: **1** — 한국어 메인에서 `/en`으로 가는 링크는 전환 버튼 하나뿐이다

- [ ] **Step 8: 눈으로 확인한다**

```bash
pnpm dev
```

확인할 것:

1. `http://localhost:3000/swe-bench` 에서 헤더에 `EN` 버튼이 보이고, 누르면 `/en/swe-bench`로 간다
2. 거기서 `KO`를 누르면 돌아온다
3. `http://localhost:3000/npm-tgz` 에는 전환 버튼이 **없다**
4. `http://localhost:3000/en` 에 영어 글 1편만 보인다
5. `/en` 헤더의 Posts·About·로고가 전부 `/en` 아래로 간다
6. `/en`에서 날짜가 `2026-10-12 (3 days ago)` 처럼 영어로 나온다
7. 한국어 쪽은 이전과 똑같다

확인 후 서버를 끈다.

- [ ] **Step 9: 커밋 (사용자 승인 후)**

```bash
git add content/posts/en app/lib/posts/content.test.ts
git commit -m "post: SWE-bench 글 영어판"
```

---

## Self-Review

**1. Spec coverage**

| 설계 항목 | 담당 |
|---|---|
| 결정 1 — 한국어 무접두사 + `/en` | Task 1 (`localePath`), Task 5 (라우트) |
| 결정 4 — 라우트 그룹으로 루트 레이아웃 분리 | Task 4 |
| 결정 4의 거친 부분 — `not-found` | Task 4 Step 5, Step 7 (`404.html` 확인) |
| 결정 5 — 영어판 없는 글은 영어 쪽에 안 냄 | Task 5 Step 2·4 (`postsIn(…, "en")`), Task 7 Step 5 |
| 결정 6 — 라이브러리 없이 사전 | Task 2 Step 2 |
| 언어 전환 버튼 | Task 6 Step 1·2, Task 7 Step 6 |
| 검색 인덱스 언어별 | Task 2 Step 12 |
| `<html lang>` (`kr` 오타 포함) | Task 4 Step 3, Step 7 |
| hreflang | Task 6 Step 3·4, Task 7 Step 5 |
| `og:locale` | Task 6 Step 3, Step 6 |
| canonical | Task 6 Step 3 |
| 사이트맵 양 언어 + alternates | Task 6 Step 5, Task 7 Step 4 |
| 시험 번역 1편 | Task 7 |
| 기존 주소 보존 | Task 2 Step 15, Task 3 Step 6, Task 4 Step 7, Task 7 Step 7 |
| 1단계 후속 권고 — `CardDateArea` 필수 prop | Task 2 Step 3 |
| 1단계 후속 권고 — 문구 이중화 해소 | Task 2 Step 6·10·11 |

**빠진 것 하나를 기록한다** — 1단계 최종 리뷰가 지적한 **썸네일 PNG 경로 충돌**(`/uploads/<연>/<월>/<slug>.png`가 두 언어에서 겹친다)은 이 계획에 넣지 않았다. 시험 번역이 **원문과 같은 썸네일을 공유**하기 때문이다(Task 7 Step 2). 언어별로 다른 그림을 쓰고 싶어지면 그때 별도로 다룬다. `SearchEntry`에 `lang`을 넣는 것도 넣지 않았다 — 인덱스를 언어별로 만들어 넘기므로(Task 2 Step 12) 항목에 언어 표시가 필요 없다.

**2. Placeholder scan** — "TBD", "적절히 처리", 코드 없는 코드 단계 없음. `cat`/`grep`으로 기존 파일을 확인하라는 단계는 조사 작업이지 코드가 아니다. Task 3 Step 3과 Task 5 Step 2는 기존 파일 내용을 옮기는 작업이라 원문을 읽는 단계를 함께 뒀다.

**3. Type consistency**

- `localePath(lang: Lang, path: string): string` — Task 1 정의, Task 2·4·6에서 사용. 일치
- `LanguageSwitch({ lang, bilingualSlugs })` — Task 6 Step 1 정의, Step 2에서 사용. prop 이름 일치
- `bilingualSlugs(posts: Post[]): string[]` — 1단계 산출물, Task 6에서 사용
- `HomePage({ lang })` / `ArticlePage({ lang, slug })` / `AboutPage({ lang })` / `PostListPage({ lang, tag, page })` — Task 3 정의, Task 3 Step 5와 Task 5에서 사용. 인자 이름 일치 (`tag`이지 `slug`이 아니다)
- `RootShell({ lang, children })` — Task 4 Step 4 정의, 두 그룹 레이아웃이 사용
- `MetadataOptions`에 `lang`·`path`·`hasCounterpart` — Task 6 Step 3 정의, Step 4와 Task 4 Step 4에서 사용. **Task 4는 이 셋이 아직 없는 시점이라 넘기지 않는다** — Task 4 Step 4에 그 단서가 적혀 있다
- `CardDateArea({ date, className?, lang })` — Task 2 Step 3에서 `lang`을 필수로. 호출부는 Task 2 Step 5·7에서 전달
- `messages(lang).searchTitle` / `.switchTo` — Task 2 Step 2 정의, Step 10과 Task 6 Step 1에서 사용
