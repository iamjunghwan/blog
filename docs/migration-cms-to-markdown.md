# CMS → Markdown 전환 기록

- 기간: 2026-08-21 ~ 2026-08-25
- 브랜치: `markdown-migration` (55커밋, 82파일, +8183/−6881)
- 대상: 아티클 16개

이 문서는 **무슨 일이 있었고 지금 무엇을 알아야 하는지**를 남긴다.
설계 의도는 [specs/2026-08-21-markdown-content-migration-design.md](superpowers/specs/2026-08-21-markdown-content-migration-design.md),
작업 단위는 [plans/2026-08-21-markdown-content-migration.md](superpowers/plans/2026-08-21-markdown-content-migration.md)에 있다.

---

## 무엇이 바뀌었나

| | 이전 | 이후 |
|---|---|---|
| 콘텐츠 저장소 | memexdata.io 헤드리스 CMS | `content/posts/` 안의 md 파일 |
| 본문 형식 | HTML 문자열 (TinyMCE 산출물) | Markdown |
| 빌드 | `API_TOKEN` 필요, 네트워크 의존 | **환경변수·네트워크 없이 빌드됨** |
| 글 개수 상한 | `size: 20` 하드코딩 (21번째부터 유실) | 없음 |
| 검색 | 브라우저가 CMS를 직접 호출 | 빌드 타임 인덱스를 props로 전달 |
| CMS 토큰 | `NEXT_PUBLIC_API_TOKEN`이 정적 번들에 노출 | 코드에서 완전 제거 |
| 사이트맵 | 빌드 *후* `public/`에 써서 배포물에 미반영 | `app/sitemap.ts`가 빌드의 일부 |
| 글 작성 | CMS UI에서만 | 저장소의 md 파일 편집 |

---

## 글 쓰는 방법

```
content/posts/<연도>/<월>/<slug>.md
```

폴더는 `date` frontmatter에서 유도한다 (파일명 접두사가 아니다).

```markdown
---
slug: nextjs-16-upgrade
title: "Next.js 16 업그레이드"
date: 2026-07-14
tags: ["nextjs", "react"]
draft: false
---

# Next.js 16 업그레이드

본문...
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `slug` | O | **공개 URL을 결정한다.** 파일명과 독립 — 파일은 옮겨도 URL이 안 깨지지만 `slug`을 바꾸면 깨진다 |
| `title` | O | 카드·검색·OG 메타데이터 |
| `date` | O | `YYYY-MM-DD`. 폴더 위치의 근거 |
| `tags` | O | YAML 배열. **`all`은 예약어** — 전체 목록 라우트(`/post/all/1`)가 쓴다 |
| `thumbnail` | X | 생략 시 본문 첫 이미지 → 그것도 없으면 `/iaman.png` |
| `draft` | X | `true`면 프로덕션 빌드에서 제외, `pnpm dev`에서는 보인다 |

- 본문 첫 줄의 `# 제목`을 지우지 말 것. 페이지가 별도 제목 엘리먼트를 렌더하지 않고, TOC 삽입 위치도 이 h1을 기준으로 잡는다.
- 이미지는 `public/uploads/<연도>/<월>/`에 넣고 `/uploads/...`로 참조한다.
- frontmatter 필수 필드가 빠지면 **파일명을 담은 에러로 빌드가 실패한다.** 조용히 사라지지 않는다.
- `pnpm dev` 실행 중에 md를 고치면 **새로고침만으로 반영된다** (캐시는 프로덕션 빌드에서만 동작).

---

## 구조

```
content/posts/<year>/<month>/*.md     ← 콘텐츠 (유일한 진실)

app/lib/posts/
  types.ts        Post · PostMeta · SearchEntry
  constants.ts    ALL_TAG        — parse와 queries가 함께 쓰는 중립 상수
  parse.ts        md 문자열 → Post, frontmatter 검증 (fs를 모름)
  thumbnail.ts    대표 이미지 결정
  render.ts       md → HTML (markdown-it → 기존 processHtml)
  repository.ts   폴더 → Post[]  — 유일한 fs 접근점
  queries.ts      조회·페이지네이션·검색 필터 (전부 순수 함수)
```

의존 방향은 아래로만 흐른다. `repository.ts`만 `node:fs`를 만지고, `queries.ts`는 타입과 상수만 안다.
기존 `app/lib/processHtml.ts`(heading id 부여 + TOC 삽입)는 **의도적으로 손대지 않았다** — 전환 결과를 대조하는 기준선이었다.

**테스트 62개.** 순수 함수 계층 전체와, `content/posts`의 실제 글을 대상으로 하는 회귀 테스트([app/lib/posts/content.test.ts](../app/lib/posts/content.test.ts))가 포함된다. 후자는 마이그레이션 스크립트를 지운 뒤에도 실제 콘텐츠를 지키는 유일한 장치다.

---

## 변환에서 잡은 결함

md 파일만 봐서는 멀쩡하고 **렌더링해야 드러나는** 것들이었다. 검증 스크립트가 없었으면 그대로 배포됐다.

| 결함 | 원인 | 영향 |
|---|---|---|
| 코드블록 전멸 | 이 CMS의 `<pre>` 46개 중 `<code>` 자식이 **0개**. TinyMCE가 Prism으로 하이라이팅해 `<pre class="language-*">` 안에 `<span class="token">`을 직접 넣었다. `pre > code`를 요구하는 규칙(직접 만든 것과 turndown 내장 모두)이 발동하지 않음 | 16개 글 코드가 마크다운 이스케이프(`\[`, `\-`)로 오염 |
| 제목 소실 | `<h2><br>참고<br></h2>` — `<br>`이 ATX 제목을 쪼개 빈 `##`와 떠도는 문단이 됨 | 2개 글에서 소제목 사라짐 |
| `**`가 화면에 노출 | 한국어 조사가 닫는 구분자에 바로 붙어(`**...( ... )**입니다`) CommonMark 플랭킹 규칙 위반 | 4개 글 |
| `****` 파싱 붕괴 | TinyMCE가 **단어마다 개별 `<strong>`**을 씌워, 닫는 `**` 뒤에 여는 `**`가 붙음 | 2개 글 |
| 산문 속 태그명 소실 | 원본의 `&lt;iframe&gt;`(글자로 보여주려던 것)을 turndown이 실제 꺾쇠로 디코드 → `markdown-it`이 `html: true`라 진짜 태그로 파싱 | 1개 글의 문구가 화면에서 사라짐 |
| 중첩 목록 평탄화 | 원본이 `<ul>` 안에 `<ul>`을 형제로 둔 무효 마크업 (브라우저는 들여쓰기해 보여줌) | 1개 글 |

| 코드 색상 소실 | 원본은 색칠 결과를 HTML에 저장해뒀다(Prism 토큰 span 2703개). md로 펴면서 색 정보가 사라졌는데, 설계 문서에 "하이라이팅 현재 없음"이라고 **확인 없이 적어둔 탓에** 범위에서 빠져 있었다 | 46개 코드블록이 무채색. `prismjs`를 렌더 단계에 넣어 복구 |
| 코드블록 배경 소실 | `globals.css`가 `pre[class*="language-"]`를 보는데 markdown-it은 언어 클래스를 `<code>`에만 붙인다 | 배경·패딩·가로 스크롤 없이 본문에 섞여 보임. `<pre>`에도 클래스를 붙여 복구 |

**검증 스크립트 자체에도 결함이 있었다.** 코드블록 비교가 양쪽 모두 `pre > code`를 봤는데 원본에 그 구조가 없어서, **코드가 통째로 사라져도 조용히 통과**했다. 안전망이라고 만든 것이 정작 가장 큰 사고를 못 잡는 상태였다.

### 함께 해소된 기존 버그

전환 과정에서 원래 사이트에 있던 문제들도 드러났다.

- **사이트맵이 배포물에 반영되지 않았다.** `next-sitemap`이 빌드 *후* `public/`에 썼지만 `public/`은 이미 `out/`으로 복사된 뒤였다. 배포되던 사이트맵은 저장소에 커밋된 옛 파일 — 글 12개만 담고 있었고(당시 16개), `/post/javascript,browser/1` 같은 404 URL을 구글에 제출하고 있었다.
- **태그 필터가 부분 문자열 매칭이었다.** 콤마 문자열에 `includes()`를 써서 `js`가 `nextjs` 태그 글에 매칭됐다.
- **쓰레기 라우트 생성.** `generateStaticParams`가 콤마로 이은 태그 문자열과 아티클 slug을 목록 라우트로 넣어, 404를 렌더하는 정적 페이지들을 만들었다.
- **404가 HTTP 200이었다.** `not-found` 컴포넌트를 직접 렌더해서 소프트 404가 됐다. 이제 `notFound()`로 실제 404를 반환한다.
- **카드 썸네일이 깨져 있었다.** `imgCheck`가 무조건 `"/" + src`를 해서, `src`가 이미 `/`로 시작하는 2026년 글들은 `//uploads/...`(프로토콜 상대 URL)가 됐다.
- **홈에서 글이 정확히 4개일 때 4번째가 사라졌다.** `posts.length > 4` 게이트가 아랫줄을 아예 렌더하지 않았다.
- **CMS 토큰이 공개 노출.** 검색이 클라이언트에서 `NEXT_PUBLIC_API_TOKEN`으로 CMS를 호출했고, 이 접두사는 값을 정적 JS에 그대로 박는다.

---

## 삭제된 것

**파일 16개** — CMS 호출(`callApi.ts`, `helperCallApi.ts`, `articleService.ts`, `getTagsArticle.ts`), 죽은 코드(`app/api/search/route.ts`는 정적 export에서 동작 불가, `app/lib/posts.ts`의 `generateStaticParamsWithPagination`은 아무도 import 안 함, `usePaginationState`는 props를 state로 복사만 하는 항등 함수), CMS 타입(`type/index.ts`), 사이트맵 설정(`next-sitemap.config.js`, `callApiForCommonjs.js`), 저장소에 커밋돼 있던 빌드 산출물(`public/sitemap*.xml`, `public/robots.txt`), `package-lock.json`(pnpm 저장소인데 남아 있었음).

**의존성 7개** — `formidable`, `@types/formidable`, `fs-extra`, `@next/bundle-analyzer`(전부 미사용이었음), `dayjs`, `next-sitemap`, `@types/markdown-it`(markdown-it 15가 자체 타입 내장).

---

## 검증한 것

- `pnpm test` 66개 통과 · `npx tsc --noEmit` 클린 · `pnpm build` **환경변수 없이** exit 0
- 검증 스크립트: 원본 HTML과 렌더된 md를 텍스트·헤딩·링크·이미지·코드블록 단위로 대조 → **16/16 통과**
- **기존 배포 사이트맵의 아티클 URL 12개 전부 보존**, md의 16개 slug 전부 정적 페이지 생성
- `out/sitemap.xml` 30 URL, **콤마 0개**, 글별 `lastmod` · `out/robots.txt` · `out/404.html` 생성
- 참조 자산 13개 전부 `public/`에 존재
- 실제 서빙 확인: TOC 링크, 코드블록 46개(언어 부착 · 구문 색상), 이미지, `<video>`, 표, 태그 필터(javascript 13 · react 5 · browser 2 · nextjs 1 · cloudflare 1 · graphql 1), 페이지네이션, 검색 인덱스 직렬화, **리터럴 `**` 0개**, CMS 흔적 0건

---

## 남은 작업

### 배포 전 (수동)

Cloudflare Pages 대시보드에서:

1. **`API_TOKEN`, `NEXT_PUBLIC_API_TOKEN` 삭제**
2. **`GA_MEASURE_ID`는 반드시 남길 것.** [app/layout.tsx](../app/layout.tsx)가 빌드 타임에 인라인하고 프로덕션에서만 동작해서 로컬에서는 어떤 설정으로도 확인되지 않는다. 같이 지우면 `gtag/js?id=undefined`가 배포되고 애널리틱스가 조용히 죽는다. 배포 후 `curl -s https://iaman.kr/ | grep gtag`로 실제 측정 ID를 확인할 것.
3. **CMS 토큰 폐기 검토.** `NEXT_PUBLIC_` 토큰은 그동안 정적 번들에 공개돼 있었다.

### 배포 후 알아둘 것

- **소프트 404였던 URL 12개가 실제 404가 된다.** 옛 `generateStaticParams`가 모든 글에 대해 `/post/<slug>/1`을 만들었고(예: `/post/code-caching/1`) 전부 사이트맵에 제출돼 있었다. 200을 반환하며 not-found UI를 보여주던 것들이라 진짜 404가 되는 게 개선이지만, Search Console에 404 12건이 새로 잡힌다. 유입 링크가 있는 것만 `_redirects`를 고려하면 된다.
- **`/sitemap-0.xml`이 사라진다.** `/sitemap.xml`은 같은 경로에 남지만 `<sitemapindex>`에서 평면 `<urlset>`으로 형태가 바뀐다. Search Console 등록은 유효하고, 자식 사이트맵이 한 주기 fetch 실패로 보고될 수 있다.

### 배포 안정화 후 정리

지금은 안전망이라 남겨둔다. 지우면 되돌릴 수 없다.

- `migration/cms-dump.json` (216KB, CMS 원본 응답 16건)
- `scripts/migrate-from-cms.ts`, `scripts/verify-migration.ts`
- `package.json`의 `migrate`, `verify-migration` 스크립트
- `turndown`, `@types/turndown`, `turndown-plugin-gfm` 의존성
- `types/turndown-plugin-gfm.d.ts`

정리 후에는 [app/lib/posts/content.test.ts](../app/lib/posts/content.test.ts)가 실제 콘텐츠를 지키는 유일한 장치가 된다.

---

## 알려진 한계

- **표와 동영상 1개는 md 안에 raw HTML로 남아 있다.** `turndown-plugin-gfm`은 첫 행이 전부 `<th>`인 표만 변환하는데 이 표들은 `<td>`만 쓴다. 무손실이고 `markdown-it`이 `html: true`로 그대로 렌더한다. 손으로 md 표로 바꿔도 된다.
- **플랭킹 규칙 때문에 일부 강조가 `<strong>`/`<em>` HTML로 들어가 있다.** 그대로 두면 정상 렌더된다.
- `thumbnail.ts`의 코드 펜스 판정은 4칸 이상 들여쓴 indented code block을 다루지 않고, 백틱 펜스의 info string에 백틱이 있는 경우를 CommonMark와 다르게 본다. 실제 콘텐츠에는 해당 사례가 없다.
- 컴포넌트·페이지 단위 자동 테스트가 없다(테스트 하네스 부재). `page : X of Y (Z)`와 `Posts <slug> <count>` 문자열은 `InnerHeader`가 공백으로 분해해 파싱하는 형식 계약인데 이를 고정하는 테스트가 없다 — 이 두 문자열을 바꿀 때 주의할 것.
- 원점 문자열 `https://iaman.kr`이 4곳에 중복돼 있다 (`app/sitemap.ts`, `app/robots.ts`, `app/utils/metadata.ts`, `app/[slug]/layout.tsx`).
- `app/[slug]/layout.tsx`가 메타데이터 `description`에 URL 문자열을 넘긴다. 기존 동작을 그대로 보존한 것이고, CMS의 `desc` 필드는 16건 전부 미입력 기본값(`"string text"`)이라 이관할 내용이 없었다.
