# 블로그 다국어(한국어·영어) 지원

- 작성일: 2026-10-15
- 상태: 설계 승인됨

## 배경

글 19편이 모두 한국어다. 해외 독자가 읽을 길이 없다.

지금 구조에서 다국어에 걸리는 지점:

- **루트 레이아웃이 하나다.** `<html lang="kr">`가 `app/layout.tsx`에 고정되어 있다.
  덧붙여 `kr`은 유효한 언어 코드가 아니다 — 한국어는 `ko`이고 `kr`은 국가 코드다.
- **글 로더가 언어를 모른다.** `loadPosts`가 `content/posts`를 재귀적으로 훑어
  전부 한 덩어리로 돌려준다.
- **UI 문자열이 컴포넌트에 박혀 있다.** 많지는 않다 — 아래 "UI 문자열" 참조.
- **`og:locale`이 `ko_KR` 고정이고 hreflang이 없다.**

제약 하나가 설계를 크게 좌우한다. **기존 한국어 주소는 이미 구글에 색인되어 있다.**
마이그레이션 때 사이트맵을 고쳐 37개 URL을 등록했으므로, 주소가 바뀌면 그 색인을 잃는다.

## 목표

글마다 한국어·영어 두 판을 두고 독자가 오갈 수 있게 한다.

- 기존 한국어 주소를 **하나도 바꾸지 않는다**
- 영어판이 있는 글만 영어 쪽에 노출한다
- 구글이 두 판을 같은 글의 번역으로 인식하게 한다 (hreflang)

### 이번 범위

시스템 전체 + **시험 번역 1편**. 19편 전량 번역은 하지 않는다.

한 편을 번역해 보고 결과와 화면을 확인한 뒤 나머지를 어떻게 채울지 정한다.
42,671자(코드 제외)를 검토 없이 한 번에 발행하는 것은 위험하고, 검토하려면
결국 19편을 다 읽어야 한다.

시험 대상은 **`swe-bench`** 로 한다. 해외 독자에게 가장 통할 주제이고,
표·코드펜스·`<strong>` 우회 등 까다로운 요소를 모두 갖고 있어 시스템 검증에도 적합하다.

### 범위에서 제외 (YAGNI)

- 세 번째 언어 — 설계는 막지 않되 지금 만들지 않는다
- 번역 자동화·기계번역 연동
- 언어별 도메인·서브도메인
- 태그 이름 번역 — slug이 곧 URL이라 번역하면 주소가 갈라진다
- 브라우저 언어 감지 후 자동 전환 — 정적 사이트라 서버 분기가 없고,
  클라이언트 리다이렉트는 뒤로가기를 망가뜨린다

## 확정된 결정

### 결정 1: 한국어는 접두사 없이, 영어만 `/en`

```
/                 /en               메인
/swe-bench        /en/swe-bench     글
/post/all/1       /en/post/all/1    목록
/about            /en/about         소개
```

기존 주소가 전부 보존된다.

**검토한 대안**

- *양쪽 다 접두사(`/ko`, `/en`).* 구조가 대칭이라 코드는 깔끔하지만 기존 주소가
  전부 바뀐다. `_redirects`로 301을 걸 수 있으나 재색인 기간 동안 순위가 흔들린다.
  19편짜리 블로그에서 감수할 거래가 아니다.
- *서브도메인(`en.iaman.kr`).* 사이트가 둘이 된다. 도메인·배포 설정이 따로 필요하고
  이 규모에 과하다.

### 결정 2: 콘텐츠는 언어 폴더로 가른다

```
content/posts/ko/2026/10/swe-bench.md
content/posts/en/2026/10/swe-bench.md
```

**읽은 폴더가 곧 언어다.** frontmatter에 적지 않는다 — 적는 걸 잊으면 틀린다.

기존 19편은 `ko/` 아래로 옮긴다. `git mv`라 이력은 보존된다.

**검토한 대안**

- *접미사 `swe-bench.en.md`.* 파일을 안 옮겨도 되고 번역이 원문 옆에 놓인다.
  대신 폴더에 두 언어가 섞이고 파일명 파싱이 필요하다.
- *한국어는 루트, 영어만 `en/`.* URL 구조를 그대로 비추지만, 루트를 재귀 스캔하면
  `en/`까지 빨려 들어간다. "`en/`은 제외"라는 예외가 생기고, 이런 예외는 나중에
  글이 조용히 사라지는 사고로 돌아온다. 언어가 늘면 예외도 는다.

URL이 비대칭인 것은 라우팅 쪽 사정이다. 콘텐츠 트리까지 그 비대칭을 따라갈 이유는 없다.

### 결정 3: 두 판을 잇는 열쇠는 slug

같은 글의 한국어판과 영어판은 **frontmatter `slug`가 같아야 한다.**

지금 slug이 이미 `npm-tgz`, `swe-bench`, `code-caching`처럼 영문이라 영어 쪽에서도
어색하지 않다. 영어판에 다른 slug을 주고 싶으면 별도 연결 필드가 필요한데,
지금은 필요 없다.

중복 검사 기준을 slug 단독에서 **`(slug, lang)` 쌍**으로 넓힌다. 지금 기준 그대로면
`ko/swe-bench.md`와 `en/swe-bench.md`가 중복으로 잡혀 빌드가 깨진다.

### 결정 4: 루트 레이아웃을 라우트 그룹으로 둘로 나눈다

`<html lang>`은 루트 레이아웃이 정하는데 지금은 하나뿐이다. Next의 라우트 그룹은
괄호 폴더가 URL에 나타나지 않으면서 루트 레이아웃을 여러 개 둘 수 있다.

```
app/
  (ko)/layout.tsx                  <html lang="ko">
  (ko)/page.tsx                    →  /
  (ko)/[slug]/                     →  /swe-bench
  (ko)/about/                      →  /about
  (ko)/post/[slug]/[...page]/      →  /post/all/1

  (en)/layout.tsx                  <html lang="en">
  (en)/en/page.tsx                 →  /en
  (en)/en/[slug]/                  →  /en/swe-bench
  (en)/en/about/                   →  /en/about
  (en)/en/post/[slug]/[...page]/   →  /en/post/all/1

  sitemap.ts  robots.ts            (레이아웃 밖이라 그대로)
```

페이지 본체는 `components/pages/` 아래로 빼서 `lang`을 받게 하고, 라우트 파일은
그것을 호출하는 몇 줄짜리로 둔다. 중복은 라우트 파일에만 생긴다.

```
components/pages/HomePage.tsx          { lang }
components/pages/ArticlePage.tsx       { lang, slug }
components/pages/AboutPage.tsx         { lang }
components/pages/PostListPage.tsx      { lang, tag, page }
```

`generateStaticParams`와 `generateMetadata`는 공용화하지 않는다. 라우트마다 `lang`이
고정이고, Next가 라우트 파일에서 직접 export된 것만 읽기 때문이다.

**검토한 대안** — 루트 레이아웃 하나를 두고 영어 페이지에서 JS로
`document.documentElement.lang`을 바꾸는 방법. 파일은 안 늘지만 정적 HTML에는
`lang="ko"`가 박힌 채 나간다. SEO가 목적인데 크롤러에게 틀린 언어를 주는 셈이다.

**알려진 거친 부분 두 가지**

1. 루트 레이아웃이 여러 개면 최상위 `not-found.tsx`가 어느 레이아웃에도 감싸이지
   않아 `<html>` 없이 렌더된다. 그룹마다 `not-found.tsx`를 두고, 최상위 것은
   자기 `<html>`과 `<body>`를 직접 들고 있게 한다.
2. 한국어↔영어 이동은 전체 페이지 새로고침이 된다. 루트 레이아웃이 다르면 Next가
   소프트 내비게이션을 하지 못한다. 언어 전환은 드문 동작이라 허용한다.

### 결정 5: 영어판이 없는 글은 영어 쪽에 내지 않는다

영어 목록에는 영어판이 있는 글만 나온다. 처음에는 1편뿐이다.

목록에 다 내고 본문만 한국어로 보여주면 독자가 읽지 못할 글을 클릭하게 된다.
구글에도 한국어 본문이 영어 페이지로 올라가 품질 신호가 나빠진다.

### 결정 6: i18n 라이브러리를 쓰지 않는다

갈라지는 문자열이 적다. 객체 두 개로 충분하다.

```ts
// app/lib/i18n/messages.ts
export const MESSAGES = { ko: { … }, en: { … } } as const;
```

| 키 | ko | en |
|---|---|---|
| `allPosts` | 모든 글 보기 → | All posts → |
| `searchPlaceholder` | 검색어를 입력하세요 | Search posts |
| `openMenu` / `closeMenu` | 메뉴 열기 / 메뉴 닫기 | Open menu / Close menu |
| `today` / `yesterday` / `daysAgo` | 오늘 / 어제 / N일 전 | Today / Yesterday / N days ago |

`Posts`, `About`, `The Latest Article`은 지금도 영어라 양쪽이 같다.
페이지네이션 `page : X of Y (Z)`도 그대로 둔다.

날짜의 절대 표기(`2026-10-14`)는 언어 중립이라 바꾸지 않는다. 상대 표기만
`relativeLabel(date, now, lang)`로 언어를 받는다.

## 콘텐츠 계층

**타입**

```ts
export type Lang = "ko" | "en";

export type PostMeta = {
  …기존 필드…
  lang: Lang;
  /** content/posts 기준 상대 경로. 생성 스크립트가 원본 파일을 되찾는 데 쓴다. */
  fileName: string;
};
```

**로더**

`loadPosts(dir, includeDrafts)`는 지금처럼 한 폴더를 훑는다. 언어별로 두 번 부르고
합친다. 읽은 폴더가 `lang`이 되므로 파일명이나 frontmatter를 파싱하지 않는다.

**조회**

`queries.ts`의 기존 함수는 전부 `posts` 배열을 인자로 받으므로 **그대로 쓴다.**
호출부가 걸러서 넘긴다. 새로 필요한 것은 둘뿐이다.

```ts
postsIn(posts: Post[], lang: Lang): Post[]
counterpart(posts: Post[], slug: string, lang: Lang): Post | undefined
```

`counterpart`는 언어 전환 버튼이 "반대 판이 있는가"를 판단하는 데 쓴다.

**태그와 페이지네이션도 언어별로 갈린다.** `allTags`·`postListParams`에 그 언어의
글만 넘기므로, 영어 쪽에는 영어 글이 가진 태그의 목록 페이지만 생성된다.
영어판이 1편(`swe-bench`, 태그 `swe-bench`·`ai`)뿐인 초기에는
`/en/post/all/1`, `/en/post/swe-bench/1`, `/en/post/ai/1` 세 개가 만들어진다.

## 언어 전환 버튼

헤더에 둔다. 한국어 화면이면 `EN`, 영어 화면이면 `KO`.

헤더는 자기가 어떤 글 위에 있는지 모른다. 그래서:

- 빌드 때 **양쪽 다 있는 slug 배열**을 헤더에 넘긴다 (검색 인덱스를 넘기는 방식과 동일)
- 버튼은 클라이언트 컴포넌트로 `usePathname()`을 읽어 상대 주소를 만든다
  (`/swe-bench` ↔ `/en/swe-bench`)
- 글 페이지인데 그 slug이 배열에 없으면 **버튼을 감춘다.** 눌러서 404가 나는 것보다 낫다
- 메인·목록·소개는 양쪽이 항상 있으므로 늘 보인다

## 검색

헤더가 빌드 타임에 만드는 검색 인덱스를 **언어별로** 만든다. 한국어 화면에서
영어 글이 검색되면 혼란스럽다.

## SEO

| 항목 | 내용 |
|---|---|
| `<html lang>` | `ko` / `en` (`kr` 오타 수정) |
| `hreflang` | 양쪽 다 있는 글에만 서로를 가리킨다 (`alternates.languages`) |
| `og:locale` | `ko_KR` / `en_US` |
| `canonical` | 페이지마다 자기 주소 |
| `sitemap.xml` | 영어 페이지도 등록, 양쪽 있는 글은 alternates로 묶는다 |
| `robots.txt` | 변경 없음 |

## 테스트

| 대상 | 확인할 것 |
|---|---|
| `parse` | 읽은 폴더가 `lang`이 되는가, `fileName`이 상대 경로인가 |
| `repository` | `(slug, lang)` 쌍이 중복이면 빌드 실패, 같은 slug 다른 언어는 통과 |
| `queries` | `postsIn` 필터, `counterpart`가 짝을 찾고 없으면 `undefined` |
| `relative` | 영어 문구 (Today / Yesterday / N days ago), 경계값은 기존과 동일 |
| `content.test` | 기존 19편이 전부 `ko`로 읽히는가 (회귀) |

컴포넌트 테스트 기반은 이 저장소에 없다(`pnpm test`의 글로브가 `app/**/*.test.ts`).
전환 버튼과 라우트는 빌드 산출물 검증으로 확인한다 — `/en/swe-bench`가 생성되는가,
`<html lang>`이 맞는가, hreflang이 양쪽을 가리키는가.

## 영향 범위

| 파일 | 변경 |
|---|---|
| `content/posts/**` | 19편을 `ko/` 아래로 이동 |
| `content/posts/en/2026/10/swe-bench.md` | 신규 — 시험 번역 |
| `app/lib/posts/types.ts` | `Lang`, `lang`, `fileName` |
| `app/lib/posts/parse.ts` | `lang`·`fileName`을 인자로 받아 채운다 |
| `app/lib/posts/repository.ts` | 언어별 로드, 쌍 단위 중복 검사 |
| `app/lib/posts/queries.ts` | `postsIn`, `counterpart` |
| `app/lib/i18n/messages.ts` | 신규 |
| `app/lib/date/relative.ts` | `lang` 인자 |
| `app/layout.tsx` | `(ko)`/`(en)` 두 루트 레이아웃으로 분리 |
| 라우트 4종 × 2 | `(ko)` 이동 + `(en)/en` 추가 |
| 페이지 본체 | `lang`을 받는 공용 컴포넌트로 추출 |
| `components/Layout/Header.tsx` | 전환 버튼, 언어별 검색 인덱스 |
| `components/Layout/LanguageSwitch.tsx` | 신규 |
| `app/sitemap.ts` | 영어 페이지 + alternates |
| `app/utils/metadata.ts` | `locale`, `alternates.languages` |
| `scripts/gen-thumbnail.tsx` | 경로 재조립 제거, `fileName` 사용 |
| `scripts/new-post.ts` | 언어 인자 추가 — `pnpm new-post <slug> "<제목>" <태그> [ko\|en]`, 기본 `ko`. 해당 언어 폴더에 뼈대를 만든다 |

## 위험과 대응

- **기존 19편 이동 중 유실.** `git mv`로 옮기고, 회귀 테스트가 19편이 모두
  `ko`로 읽히는지 확인한다. 빌드 산출물의 URL 수가 이전과 같아야 한다.
- **라우트 그룹 전환 시 `not-found` 깨짐.** 그룹별 `not-found.tsx`를 두고
  빌드 산출물에 `404.html`이 남는지 확인한다 (Cloudflare Pages가 이 파일을 쓴다).
- **영어 라우트가 빈 목록을 렌더.** 영어 글이 1편뿐이라 페이지네이션이
  1페이지만 생긴다. `paginate`가 빈 배열에서 `notFound()`로 떨어지는 기존 동작을
  유지하는지 확인한다.
- **썸네일.** 영어판은 한국어판과 같은 대표 이미지를 쓴다. 그림에 글씨가 없으므로
  언어와 무관하다. 별도 작업이 없다.
