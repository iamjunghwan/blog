# 블로그 콘텐츠를 헤드리스 CMS에서 Markdown 파일로 전환

- 작성일: 2026-08-21
- 브랜치: `markdown-migration`
- 상태: 설계 승인됨

## 배경

현재 블로그 아티클은 memexdata.io 헤드리스 CMS에 저장되어 있고, 빌드 타임에
`POST .../contents/search/v2` 호출로 전량을 받아 정적 HTML을 생성한다.
본문은 Markdown이 아니라 **HTML 문자열**(`data.content`)로 저장되어 있다.

이 구조의 문제:

- **빌드가 외부 서비스와 토큰에 의존한다.** `API_TOKEN` 없이는 로컬 빌드가 실패한다.
- **`size: 20`이 하드코딩되어 있다.** 글이 20개를 넘으면 조용히 잘린다 (현재 16개).
- **CMS 토큰이 공개 노출되어 있다.** 검색이 클라이언트에서 CMS를 직접 호출하며
  `NEXT_PUBLIC_API_TOKEN`을 쓴다. 이 접두사는 정적 JS 번들에 값이 그대로 박힌다.
- 글 작성·수정을 CMS UI에서만 할 수 있어 클로드 코드로 다룰 수 없다.

## 목표

아티클을 저장소 안의 Markdown 파일로 관리한다. CMS 의존을 **완전히 제거**한다.
기존 16개 글을 전량 마이그레이션하며, **공개 URL(`iaman.kr/<slug>`)은 하나도 깨지지 않아야 한다.**

### 범위에서 제외 (YAGNI)

- 코드 구문 하이라이팅 — 현재 없음. 나중에 독립적으로 추가 가능
- 본문 전문 검색 — 현재 제목만 검색. 인덱스에 본문을 추가하면 되는 별개 변경
- MDX (본문 내 React 컴포넌트)
- `remark`/`rehype` 파이프라인 전환 (아래 "결정 3" 참조)

## 확정된 결정

### 결정 1: 전량 마이그레이션 후 CMS 완전 제거

기존 글 16개를 전부 md로 내리고 CMS 관련 코드를 모두 삭제한다.
콘텐츠의 진실 소스를 하나로 만드는 것이 가장 단순하다.
CMS 계정 자체는 손대지 않으나 코드는 참조하지 않는다.

### 결정 2: 본문을 진짜 Markdown으로 변환

CMS 본문은 HTML이므로 `turndown`으로 md 문법으로 변환한다.
16개는 눈으로 전수 검수가 가능한 규모다.
Markdown은 raw HTML을 허용하므로, 변환이 불가능한 블록만 HTML로 남긴다.

### 결정 3: `markdown-it` + 기존 `processHtml` 재사용

`app/lib/processHtml.ts`(cheerio 기반 heading id 부여 + TOC 삽입)는 잘 동작하고 있고
"HTML을 받아 HTML을 준다"는 깔끔한 경계를 갖는다. 이를 그대로 두고 앞단에 md → HTML
변환만 추가한다.

`remark`/`rehype` 전면 교체를 택하지 않은 이유: 콘텐츠 마이그레이션과 렌더러 교체가
동시에 일어나면 문제 발생 시 원인 구분이 불가능하다. 렌더러 교체는 나중에
독립적으로 할 수 있다.

`markdown-it`은 `html: true`로 설정해 raw HTML을 통과시킨다.

### 결정 4: md 본문 첫 줄에 `# 제목`을 유지한다

현재 아티클 페이지는 **별도 제목 엘리먼트를 렌더하지 않는다.**
`ArticleContent.tsx`가 본문 HTML만 뿌리고 그 안의 `<h1>`이 제목 역할을 하며,
`processHtml`의 TOC 삽입 위치도 이 h1을 기준으로 잡혀 있다.

따라서 md 본문은 `# 제목`으로 시작하고, frontmatter의 `title`은 카드·메타데이터·검색용으로
쓴다. 중복이지만 렌더 결과가 현재와 동일하게 보존된다.

## 파일 형식

```
content/posts/2026-07-nextjs-16-upgrade.md
```

```markdown
---
slug: nextjs-16-upgrade
title: Next.js 16 업그레이드
date: 2026-07-14
tags: [nextjs, react]
thumbnail: /uploads/2026/07/hero.png
draft: false
---

# Next.js 16 업그레이드

본문...
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `slug` | O | 공개 URL. **파일명과 독립** — 파일명을 바꿔도 URL이 안 깨진다 |
| `title` | O | 카드·검색·OG 메타데이터용 |
| `date` | O | `YYYY-MM-DD`. 시각은 쓰이지 않음 (현재도 `dayjs`로 날짜만 렌더) |
| `tags` | O | YAML 배열. CMS의 콤마 문자열을 대체 |
| `thumbnail` | X | 생략 시 본문 첫 이미지 → 없으면 `/iaman.png` |
| `draft` | X | 기본 `false`. `true`면 프로덕션 빌드에서 제외, dev에서는 표시 |

파일명은 `YYYY-MM-<slug>.md`. 연도별 폴더 중첩은 하지 않는다 — 16개 규모에서는
평면이 편하고 파일명 접두 날짜로 정렬이 해결된다.

> **2026-08-25 수정:** 사용자 요청으로 위 결정을 뒤집었다. 이제
> `content/posts/<year>/<month>/<slug>.md` — 파일명은 slug만 쓰고 연/월은
> 폴더가 나타내며, 그 폴더는 `date` frontmatter에서 유도한다(파일명 접두사가
> 아니다). `loadPosts`(`app/lib/posts/repository.ts`)가 재귀 탐색으로 바뀌었다.
> 위 문단은 당시의 결정 기록으로 남겨둔다.

## 아키텍처

```
content/posts/*.md                 ← 콘텐츠 소스 (유일한 진실)

app/lib/posts/
  types.ts        Post, PostMeta 타입
  parse.ts        md 문자열 → { meta, body }   · 순수 함수, fs를 모른다
  render.ts       md 본문 → HTML               · markdown-it → processHtml
  repository.ts   폴더 → Post[]                · 유일한 fs 접근점
  queries.ts      bySlug / byTag / allTags / paginate
```

기존 `app/lib/posts.ts`(파일)를 삭제하고 `app/lib/posts/`(디렉토리)를 만든다.
같은 이름의 파일과 디렉토리는 공존할 수 없으므로 **삭제가 선행되어야 한다.**

```ts
type PostMeta = {
  slug: string
  title: string
  date: string        // YYYY-MM-DD
  tags: string[]
  thumbnail?: string
  draft: boolean
}
type Post = PostMeta & { body: string }   // body = 렌더 전 md
```

### 모듈 책임

- **`parse.ts`** — 문자열 in, 객체 out. `gray-matter`로 frontmatter를 읽는다.
  `slug`·`title`·`date` 누락 시 **파일명을 포함한 에러를 던져 빌드를 실패시킨다.**
  조용히 넘기면 글이 사이트에서 사라지는데 아무도 모른다.
- **`repository.ts`** — `content/posts`를 읽어 `Post[]`를 만든다. `date` 내림차순 정렬,
  `process.env.NODE_ENV === "production"`일 때 `draft: true` 제외 (dev에서는 미리보기용으로 포함).
  모듈 레벨 캐시로 빌드 중 반복 파싱을 막는다.
- **`queries.ts`** — 현재 `helperCallApi()`의 자리를 대체한다. 지금 각 페이지가 전체
  목록을 받아 각자 filter/slice 하는 로직을 여기로 모은다. 4곳에 흩어진
  `pageSize: 5`도 여기로 통합한다.

### 데이터 흐름

```
빌드 타임:
  content/posts/*.md → repository → queries → 각 page.tsx  → 정적 HTML
                                        ├→ Header.tsx     → <Search index={...}>
                                        └→ app/sitemap.ts → out/sitemap.xml
```

`fetch`가 완전히 사라진다. 빌드가 네트워크·토큰과 무관해지고 로컬에서 `pnpm build`가 그냥 된다.

### 타입 교체

기존 `ApiItem`(`data.title.KO`, `uid`, 콤마 문자열 `tags`)은 CMS 응답 스키마라 md에 맞지 않는다.
`Post`로 교체하며, 이를 쓰는 컴포넌트 6개의 prop 타입을 함께 바꾼다:
`ArticleCard`, `MainArticleList`, `ArticleList`, `PostPageContent`, `useSearchData`, `TagList`.
`data.title.KO` → `title`, `data.slug` → `slug`로 평탄화되어 코드가 짧아진다.

### 썸네일 추출

현재 `imgCheck`는 HTML 문자열에서 정규식으로 첫 `<img>`를 찾는다. 이제 md 본문이 대상이므로
다시 작성한다. 우선순위: `thumbnail` frontmatter → md 이미지 문법 `![](...)` →
raw HTML `<img>` → `/iaman.png`.

## 마이그레이션

변환과 검증을 **별도 스크립트로 분리**한다. 변환을 여러 번 다시 돌리며 검증 결과가
나아지는지 볼 수 있어야 한다.

### `scripts/migrate-from-cms.ts` (`API_TOKEN` 필요, 1회 실행)

1. CMS 호출 (`size: 100`으로 올려 전량 확보) → **원본 응답을 `migration/cms-dump.json`에
   그대로 저장하고 커밋한다.** 변환이 잘못돼도 CMS 재호출 없이 다시 시도할 수 있고,
   나중에 CMS 계정이 사라져도 원본이 남는다.
2. `turndown` + `turndown-plugin-gfm`으로 HTML → md 변환
   - **코드블록 언어**: `<pre><code class="language-*">`에 클래스가 있으면 복원, 없으면
     언어 없는 fence로 남기고 해당 글·위치를 리포트에 출력해 수동 보정한다.
   - **이미지 경로 정규화**: CMS에는 상대경로(`uploads/2026/07/x.png`)로 저장되어 있다
     (`imgCheck`가 `"/" + srcValue`를 하는 것이 근거). md에서는 절대경로 `/uploads/...`로 통일한다.
   - **보존 태그 명시**: `iframe`, `style` 속성이 붙은 요소 등 md로 표현 불가한 것은
     turndown `keep()`으로 raw HTML 유지한다. 조용히 버려지는 것보다 남는 것이 낫다.
3. frontmatter 생성
   - `tags`는 `split(",")` 후 trim·빈값 제거하여 YAML 배열로
   - **`date`는 두 후보가 있다.** 카드는 `createdAt`(최상위)을 렌더하고, 기존 사이트맵은
     `data.date`를 `lastmod`로 썼다. `data.date`는 `ApiItem` 타입에 선언되어 있지 않지만
     배포된 사이트맵에 실제 날짜가 들어 있으므로 존재한다. 두 값이 다를 수 있으므로
     스크립트가 **글별로 둘 다 출력하고 불일치를 리포트**한다.
     기본값은 `createdAt`(현재 화면에 보이는 날짜를 보존) — 불일치가 있으면 실제 값을
     보고 판단한다.
4. `content/posts/YYYY-MM-<slug>.md` 기록
5. **변환 리포트 출력** — 글별 경고 (언어 없는 코드블록, 보존된 raw HTML, 변환 실패 요소)

### `scripts/verify-migration.ts` (여러 번 실행)

`migration/cms-dump.json`의 원본 HTML과 새 md를 렌더한 HTML을 **구조적으로** 비교한다.
문자 단위 완전 일치는 목표가 아니다 — turndown 왕복에서 공백·속성 순서는 반드시 달라진다.

| 비교 항목 | 판정 |
|---|---|
| 텍스트 전문 (cheerio `.text()`, 공백 정규화) | 완전 일치 필수 — 다르면 글자 유실 |
| 헤딩 목록 (레벨 + 텍스트 + 순서) | 완전 일치 필수 — TOC가 깨진다 |
| 링크 `href` 목록 | 완전 일치 필수 |
| 이미지 `src` 목록 | 완전 일치 필수 |
| 코드블록 개수와 내용 | 완전 일치 필수 |
| 그 외 태그 구조 | 차이를 리포트로 출력, 사람이 판단 |

추가로 **md의 모든 `/uploads/...` 경로가 `public/`에 실제로 존재하는지 확인한다.**
이미지 깨짐은 배포 후에야 눈에 띄는 종류의 사고다.

`migration/` 폴더와 두 스크립트는 커밋해두고, 검증이 끝나고 배포가 안정된 뒤
**별도 커밋으로 정리한다.** 마이그레이션 도중에 지우면 되돌릴 수 없다.

## 검색

**별도 인덱스 파일도, fetch도 만들지 않는다.** `components/Layout/Header.tsx`는 서버
컴포넌트이므로 빌드 타임에 글 목록을 읽어 클라이언트 컴포넌트 `<Search>`에 props로 넘긴다.

```tsx
// Header.tsx (서버 컴포넌트)
const index = searchIndex();          // queries.ts: PostMeta에서 body 제외한 목록
<Search index={index} />
```

16개 × `{ slug, title, date, tags }` ≈ 1.3KB다. `Header`가 데스크톱·모바일 두 곳에서
렌더되므로 페이지당 약 2.6KB가 RSC 페이로드에 실린다 (gzip 후 훨씬 작다).
이 비용으로 다음을 모두 없앤다:

- 정적 인덱스 파일과 그것을 만드는 prebuild 스크립트
- `useSearchData`의 fetch — **모달을 열고 응답을 기다리는 지연이 사라져 검색이 즉시 동작한다**
- `NEXT_PUBLIC_API_TOKEN` 노출

`useSearchData`는 `open` 대신 `index`를 받아 순수 클라이언트 필터링만 한다.
디바운스(500ms)는 그대로 유지한다 — 입력마다 리렌더를 막는 역할은 여전히 유효하다.

전문 검색이 필요해지면 이 props에 본문 텍스트를 추가하는 것으로 시작하고, 크기가 문제가
되는 시점에 비로소 별도 파일로 분리한다. 지금 16개 규모에서는 불필요한 구조다.

`app/api/search/route.ts`는 삭제한다. `output: "export"`에서 route handler는 동작하지 않는
죽은 코드이며, 실제 검색은 위 클라이언트 훅이 CMS를 직접 호출하고 있었다.

## 사이트맵: `next-sitemap` 제거, Next 내장 메타데이터 라우트로 전환

### 현재 상태 (배포된 사이트맵에서 확인한 실측)

`public/sitemap-0.xml`을 열어 확인한 사실:

- **아티클이 12개만 등재되어 있다** (현재 16개). 최근 4개 글은 구글에 제출되지 않고 있다.
- **존재하지 않는 태그 페이지가 등재되어 있다** — `/post/javascript,browser/1`,
  `/post/react,javascript/1`. `generateStaticParams`의 콤마 문자열 버그가 실제 정적 페이지를
  만들고, `next-sitemap`이 `out/`을 스캔해 그것까지 사이트맵에 넣었다.
- `lastmod`에 실제 날짜가 들어 있다 → CMS에 **`data.date` 필드가 존재한다.**
  `type/index.ts`의 `ApiItem`에는 선언되어 있지 않고, 카드는 `createdAt`을 렌더한다.
  두 날짜는 다를 수 있다 (아래 "마이그레이션" 참조).

원인은 `next-sitemap`의 `outDir` 기본값이 `public/`인데 이 프로젝트는 `output: "export"`라
실제 배포물이 `out/`이라는 점이다. `public/`은 **빌드 중에 이미 `out/`으로 복사되므로**,
빌드 후에 `public/`에 쓰인 사이트맵은 그 빌드의 배포물에 반영되지 않는다.
지금 배포되는 사이트맵은 저장소에 커밋된 이전 빌드 산출물이다.

### 전환 방식

`next-sitemap`을 제거하고 Next 내장 메타데이터 라우트를 쓴다.

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { allPosts, tagPageUrls } from "@/app/lib/posts/queries";

const BASE = "https://iaman.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts();
  return [
    { url: BASE, lastModified: posts[0].date },
    { url: `${BASE}/about` },
    ...posts.map((p) => ({ url: `${BASE}/${p.slug}`, lastModified: p.date })),
    ...tagPageUrls(),   // /post/all/N, /post/<tag>/N — queries가 계산
  ];
}
```

```ts
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
```

| | `next-sitemap` 유지 | `app/sitemap.ts` |
|---|---|---|
| 출력 위치 | 빌드 **후** `public/`에 씀 → 배포물에 미반영 (`outDir`로 우회해야 함) | Next 빌드의 일부 → `out/sitemap.xml`로 정확히 생성. **버그가 사라진다** |
| 데이터 소스 | CJS 설정 파일이라 TS `queries.ts`를 쓸 수 없음 → 파싱 로직 중복 | `queries.ts`를 그대로 import |
| URL 목록 | `out/` 폴더 스캔 → 쓰레기 라우트까지 등재 | `queries.ts`가 계산 → **쓰레기 URL이 생길 수 없다** |
| 의존성 | `next-sitemap` + `postbuild` + `scripts/callApiForCommonjs.js` | 없음 |

즉 사이트맵은 md 전환에서 **코드가 줄어드는 쪽**이다. `next-sitemap`을 남기면 오히려
CJS 설정 파일에서 md를 다시 파싱하는 코드를 짜야 한다.

### 연쇄 정리

- `next-sitemap` 의존성, `next-sitemap.config.js`, `postbuild` 스크립트,
  `scripts/callApiForCommonjs.js` 전부 삭제
- 빌드 스크립트는 `"build": "next build"`로 되돌아간다. `postbuild`가 사라지므로
  pnpm 10에서 pre/post 스크립트가 실행되는지에 대한 불확실성도 함께 없어지고,
  빌드 경로에 `tsx` 같은 실행 도구가 끼지 않는다.
- **`public/robots.txt`, `public/sitemap.xml`, `public/sitemap-0.xml` 삭제는 필수다**
  (선택이 아님). `public/`의 파일과 `app/robots.ts` 같은 메타데이터 라우트가 같은 경로를
  차지하면 Next 빌드가 충돌 에러를 낸다. `.gitignore`에 추가할 필요도 없다 —
  생성물이 `out/`에만 존재하게 된다.
- `sitemap-0.xml`은 없어지지만 **`/sitemap.xml` 경로는 유지되므로** Search Console에
  등록된 URL은 변경하지 않아도 된다.
- `changefreq` / `priority`는 넣지 않는다 — 구글이 둘 다 무시한다.

## 함께 수정되는 기존 버그

전환 과정에서 자연히 해소되는 것들이다. 회귀 방지를 위해 테스트로 고정한다.

1. **태그 부분 문자열 매칭** — `app/lib/posts.ts`가 콤마 문자열에 `flatMap` + `includes`를
   쓰고 있어 `js`가 `nextjs`에 매칭된다. `tags: string[]` 정확 비교로 해소.
2. **쓰레기 라우트 생성** — `app/post/[slug]/[...page]/page.tsx`의 `generateStaticParams`가
   `slug: post.data.tags`로 **콤마 문자열 전체를 slug로** 넣어 존재하지 않는 라우트를 만든다.
   이 페이지들이 실제로 생성되어 **구글에 제출되는 사이트맵에까지 들어가 있다**
   (`/post/javascript,browser/1` 등). 404 URL을 사이트맵에 넣는 것은 SEO에 해롭다.
3. **`size: 20` 상한** — 파일 시스템 기반이 되어 상한이 사라진다.
4. **CMS 토큰 공개 노출** — 위 "검색" 참조.
5. **사이트맵이 배포물에 반영되지 않음** — 배포된 사이트맵에 아티클이 12개만 들어 있다
   (현재 16개). 위 "사이트맵" 참조.

## 제거 대상

| 대상 | 이유 |
|---|---|
| `app/utils/callApi.ts`, `app/utils/helperCallApi.ts` | CMS 호출 |
| `app/api/search/` | 정적 export에서 동작하지 않는 죽은 코드 |
| `scripts/callApiForCommonjs.js` | `next-sitemap`이 제거된다 |
| `next-sitemap.config.js`, `next-sitemap` 의존성, `postbuild` 스크립트 | `app/sitemap.ts`로 대체 |
| `public/robots.txt`, `public/sitemap.xml`, `public/sitemap-0.xml` | 메타데이터 라우트와 경로 충돌. 삭제 필수 |
| `app/lib/posts.ts` | `queries.ts` 기반으로 재작성 |
| `type/index.ts`의 `ApiItem` / `ApiResponse` / `ApiResponseError` | CMS 응답 스키마 |
| `API_TOKEN`, `NEXT_PUBLIC_API_TOKEN` | Cloudflare 환경변수에서도 제거 |
| `formidable`, `@types/formidable`, `fs-extra`, `@next/bundle-analyzer` | 어디서도 import되지 않음 |

## 의존성

추가 (dependencies): `gray-matter`, `markdown-it`

`@types/markdown-it`은 추가하지 않는다. `markdown-it` 15는 `dist/markdown-it.d.mts`로
자체 타입을 제공하고, TypeScript는 패키지 자체 타입을 `@types/*`보다 먼저 해석한다.
`@types/markdown-it`의 최신 버전은 14.x라 버전도 어긋난다. (구현 중 실측으로 확인)

추가 (devDependencies): `tsx` (테스트·스크립트 실행),
`turndown`, `@types/turndown`, `turndown-plugin-gfm` (마이그레이션 전용)

제거: `next-sitemap`, `formidable`, `@types/formidable`, `fs-extra`,
`@next/bundle-analyzer`

유지: `cheerio` (`processHtml`과 검증 스크립트에서 사용)

`@types/markdown-it`은 devDependencies로 옮겨도 되지만, 기존 `package.json`이 이미
`@types/*`를 dependencies에 두는 방식이라 그 관례를 따른다.

## 테스트

테스트 프레임워크는 Node 내장 `node:test`(+ `node:assert/strict`)를 쓰고,
실행만 `tsx`로 한다.

```
"test": "tsx --test \"app/**/*.test.ts\""
```

**`tsx`가 필요한 이유 (실측으로 확인):** Node 24는 `.ts`를 직접 실행할 수 있지만
import 지정자가 확장자를 포함해야 한다. 검증 결과:

| import 형태 | `node file.ts` |
|---|---|
| `from "./b"` | 실패 (ERR_MODULE_NOT_FOUND) |
| `from "./b.js"` | 실패 |
| `from "./b.ts"` | 성공 |

또한 Node는 `tsconfig.json`의 `paths`를 읽지 않으므로 이 프로젝트가 쓰는 `@/` 별칭이
동작하지 않는다. 즉 내장 러너만 쓰려면 **프로덕션 코드의 import 스타일을 전부 바꾸고**
`allowImportingTsExtensions`를 켜야 하며, 그 형태가 Next 빌드에서도 문제없는지 추가로
검증해야 한다. `tsx` devDependency 하나가 이 셋을 모두 없애고 기존 관례(`@/` 별칭,
extensionless)를 그대로 유지시킨다. (`tsx --test`로 별칭 + extensionless 동작 확인)

`tsx`는 마이그레이션·검증 스크립트 실행에도 같이 쓴다. **빌드 경로에는 들어가지 않는다** —
devDependency이며 `next build`는 `tsx`를 거치지 않는다.

테스트 파일은 대상 모듈 옆에 `*.test.ts`로 둔다 (`app/lib/posts/parse.test.ts` 등).

| 대상 | 검증 내용 |
|---|---|
| `parse.ts` | 필수 필드 누락 시 파일명 포함 에러, `tags` 배열 파싱, `draft` 기본값, 날짜 형식 |
| `render.ts` | md → HTML, raw HTML 통과, h2/h3 id 부여, TOC 삽입 위치 |
| `queries.ts` | 태그 정확 매칭 (`js` ≠ `nextjs`), 페이지네이션 경계, `draft` 제외, 날짜 정렬 |
| 썸네일 추출 | frontmatter 우선 → md 이미지 문법 → raw `<img>` → 기본 이미지 |

## 작업 순서

`API_TOKEN`을 **2026-08-24(월)** 에 확보할 수 있으므로, 토큰이 필요한 단계를 분리한다.
전체 단계 중 토큰이 필요한 것은 8단계 하나뿐이다.

### 1부: 토큰 없이 진행 (지금)

손으로 작성한 **픽스처 md 2~3개**를 상대로 개발한다.

1. 의존성 정리 (추가·제거) + `tsx --test` 러너 설정
2. `types` / `parse` / `render` / `repository` / `queries` — TDD로
3. 픽스처 md로 페이지·컴포넌트를 `Post` 타입으로 전환
4. `Header` → `<Search index={...}>` props 전달로 검색 전환
5. `app/sitemap.ts` + `app/robots.ts` 추가, `next-sitemap` 제거,
   `public/`의 사이트맵·robots 산출물 삭제, 빌드 스크립트 단순화
6. CMS 코드 제거
7. `scripts/migrate-from-cms.ts` / `scripts/verify-migration.ts` 작성
   (실행은 못 하지만 코드는 미리 준비)

### 2부: 토큰 확보 후 (2026-08-24 월)

8. `migrate-from-cms.ts` 실행 → `migration/cms-dump.json` + md 16개 생성
9. `verify-migration.ts` 실행 → 리포트 확인 → 수동 보정 (반복)
10. 픽스처 md 제거
11. `pnpm build` → `npx serve out`으로 육안 확인
12. 배포 후 `migration/` 및 마이그레이션 스크립트 정리 (별도 커밋)

## 검증 기준 (완료 조건)

- `pnpm test` 전부 통과
- `verify-migration.ts`의 필수 항목(텍스트·헤딩·링크·이미지·코드블록)이 16개 글 전부 일치
- 모든 `/uploads/...` 경로가 `public/`에 존재
- `pnpm build`가 **환경변수 없이** 성공
- 기존 URL 16개가 전부 200 응답
- 태그 페이지·페이지네이션·검색·TOC·다크모드가 육안으로 정상
- `out/sitemap.xml`(배포물)에 16개 slug가 각 글의 `date`를 `lastmod`로 하여 포함
- `out/sitemap.xml`에 **콤마가 포함된 URL이 없음** (`/post/javascript,browser/1` 같은
  쓰레기 라우트가 사라졌는지 확인)
- `out/robots.txt`가 생성되고 `Sitemap: https://iaman.kr/sitemap.xml`을 가리킴
- `out/`에 생성되지 않은 정적 라우트가 없는지 — 태그 페이지 목록을 기존 배포물과 비교
  (콤마 라우트를 제외하면 동일해야 한다)
