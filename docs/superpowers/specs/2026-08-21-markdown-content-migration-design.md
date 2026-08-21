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
  content/posts/*.md → repository → queries → 각 page.tsx → 정적 HTML
                          └→ scripts/build-search-index.ts → public/search-index.json
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
3. frontmatter 생성 — `tags`는 `split(",")` 후 trim·빈값 제거하여 YAML 배열로
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

빌드 타임에 정적 인덱스를 생성한다.

```
scripts/build-search-index.ts → public/search-index.json
[{ slug, title, date, tags }, ...]     // 본문 미포함
```

`useSearchData.tsx`는 CMS 대신 `/search-index.json`을 fetch한다. 모달을 열 때 가져오는
현재 동작은 유지 — 초기 번들이 커지지 않는다. **`NEXT_PUBLIC_API_TOKEN` 노출이 여기서 사라진다.**

`app/api/search/route.ts`는 삭제한다. `output: "export"`에서 route handler는 동작하지 않는
죽은 코드이며, 실제 검색은 위 클라이언트 훅이 CMS를 직접 호출하고 있었다.

## 사이트맵 (기존 버그 수정 포함)

`next-sitemap`의 `outDir` 기본값은 `public/`인데 이 프로젝트는 `output: "export"`라
실제 배포물은 `out/`이다. `public/`은 **빌드 중에 이미 `out/`으로 복사되므로**, 빌드 후에
`next-sitemap`이 `public/`에 쓰는 사이트맵은 `out/`에 반영되지 않는다.
현재 배포되는 사이트맵은 저장소에 커밋된 이전 빌드 산출물이다.

수정:

- `next-sitemap.config.js`에 `outDir: "out"` 지정 → 배포물에 직접 기록
- `additionalPaths`가 `public/search-index.json`을 읽도록 변경 (`lastmod` ← `date`)
- 커밋된 `public/sitemap.xml`, `public/sitemap-0.xml`, `public/robots.txt`는 생성물이므로
  git에서 제거하고 `.gitignore`에 추가
- **빌드 스크립트를 명시화한다:**
  ```
  "build": "node scripts/build-search-index.ts && next build && next-sitemap"
  ```
  `postbuild`를 제거한다. `.npmrc`가 없어 pnpm 10에서 pre/post 스크립트가 실제로 실행되는지
  불확실했는데, 명시하면 그 모호함이 사라지고 어떤 패키지 매니저로 돌려도 동일하게 동작한다.

## 함께 수정되는 기존 버그

전환 과정에서 자연히 해소되는 것들이다. 회귀 방지를 위해 테스트로 고정한다.

1. **태그 부분 문자열 매칭** — `app/lib/posts.ts`가 콤마 문자열에 `flatMap` + `includes`를
   쓰고 있어 `js`가 `nextjs`에 매칭된다. `tags: string[]` 정확 비교로 해소.
2. **쓰레기 라우트 생성** — `app/post/[slug]/[...page]/page.tsx`의 `generateStaticParams`가
   `slug: post.data.tags`로 **콤마 문자열 전체를 slug로** 넣어 존재하지 않는 라우트를 만든다.
3. **`size: 20` 상한** — 파일 시스템 기반이 되어 상한이 사라진다.
4. **CMS 토큰 공개 노출** — 위 "검색" 참조.
5. **사이트맵이 배포물에 반영되지 않음** — 위 "사이트맵" 참조.

## 제거 대상

| 대상 | 이유 |
|---|---|
| `app/utils/callApi.ts`, `app/utils/helperCallApi.ts` | CMS 호출 |
| `app/api/search/` | 정적 export에서 동작하지 않는 죽은 코드 |
| `scripts/callApiForCommonjs.js` | 사이트맵이 검색 인덱스를 읽는다 |
| `app/lib/posts.ts` | `queries.ts` 기반으로 재작성 |
| `type/index.ts`의 `ApiItem` / `ApiResponse` / `ApiResponseError` | CMS 응답 스키마 |
| `API_TOKEN`, `NEXT_PUBLIC_API_TOKEN` | Cloudflare 환경변수에서도 제거 |
| `formidable`, `@types/formidable`, `fs-extra`, `@next/bundle-analyzer` | 어디서도 import되지 않음 |

## 의존성

추가 (dependencies): `gray-matter`, `markdown-it`, `@types/markdown-it`

추가 (devDependencies): `turndown`, `@types/turndown`, `turndown-plugin-gfm`
— 마이그레이션 전용

유지: `cheerio` (`processHtml`과 검증 스크립트에서 사용)

## 테스트

Node 24 내장 `node:test`를 쓴다. `.ts`를 그대로 실행할 수 있어 **추가 의존성이 0개**다.
테스트 인프라가 전혀 없는 프로젝트에 순수 함수 몇 개를 검증하려고 vitest 설정을 들여올
이유가 없다.

테스트 파일은 대상 모듈 옆에 `*.test.ts`로 둔다 (`app/lib/posts/parse.test.ts` 등).
`package.json`에 `"test": "node --test \"app/**/*.test.ts\""`를 추가한다.

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

1. 의존성 정리 (추가·제거) + `node:test` 러너 설정
2. `types` / `parse` / `render` / `repository` / `queries` — TDD로
3. 픽스처 md로 페이지·컴포넌트를 `Post` 타입으로 전환
4. 검색 인덱스 생성 스크립트 + `useSearchData` 전환
5. 사이트맵 설정 + 빌드 스크립트 명시화
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
