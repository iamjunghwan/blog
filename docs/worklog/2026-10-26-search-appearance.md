# 구글 검색 결과 다듬기 — 설명문·구조화 데이터·파비콘

**날짜** 2026-10-26
**커밋** `5d39109`
**브랜치** `main`

## 왜 했나

구글에 블로그를 검색했을 때 다른 기술 블로그처럼 나오게 하고 싶다는 요청.
목표 화면은 이런 모양이었다.

```
 (아이콘)  사이트이름
           https://example.kr
 제목
 설명 한두 줄

 About     ▸
 Resume    ▸
 ...
```

## 먼저 짚은 것 — 하단 목록(sitelinks)은 고를 수 없다

About / Resume 같은 하위 페이지 목록은 **sitelinks** 라고 하며 **구글이
알고리즘으로 자동 선택한다.** "이 5개를 보여 달라"고 지정하는 메타 태그도
구조화 데이터도 없다. 구글 John Mueller가 명시적으로 그렇게 말했다.

따라서 "최신 글 5개를 저기 띄우기"는 구현 대상이 아니다. 간접적인 영향만
가능하다 — 내부 링크 앵커 텍스트를 간결하고 정확하게, 페이지 구조를 명확하게.
게다가 sitelinks 는 보통 그 검색어에서 사이트가 압도적 1위이고 트래픽·내부
링크가 쌓였을 때 나타난다.

나머지 요소(아이콘·사이트 이름·제목·설명)는 전부 제어 가능해서 그쪽을 고쳤다.

---

## 1. 설명문

### 문제

검색 결과에 그대로 나가는 `<meta name="description">` 이 잘린 문장이었다.

```html
<meta name="description" content="This blog was created by an."/>
```

한국어 4곳, 영어 4곳(`A blog by an.`)에 **같은 문자열이 복사**돼 있었다.

### 고친 방법

`app/lib/i18n/site-copy.ts` 한 곳으로 모았다. 8곳에 흩어두면 한쪽만 고치다
또 어긋난다. 페이지 종류마다 다른 문장을 쓴다 — 같은 설명이 반복되면 구글이
무시하고 본문에서 임의로 뽑아 쓴다.

| 페이지 | 한국어 |
|---|---|
| 홈 | '왜'라는 질문으로 문제에 접근하고 해결하는 프론트엔드 엔지니어의 블로그. 궁금한 것을 파고들어 공부하고 기록합니다. |
| 소개 | …프론트엔드 엔지니어입니다. 어떤 사람이고 무엇을 공부해 왔는지 적었습니다. |
| 목록 | …글 목록. 프론트엔드, 자바스크립트, 브라우저 동작 원리를 공부하고 기록합니다. |

영어판도 같은 구조로 넣었다.

### 바뀐 파일

- `app/lib/i18n/site-copy.ts` (신규)
- `app/(ko)/layout.tsx`, `app/(ko)/page.tsx`, `app/(ko)/about/layout.tsx`,
  `app/(ko)/post/[slug]/[...page]/layout.tsx`
- `app/(en)/layout.tsx`, `app/(en)/en/page.tsx`, `app/(en)/en/about/layout.tsx`,
  `app/(en)/en/post/[slug]/[...page]/layout.tsx`
- `app/utils/metadata.ts` — `og:site_name` 도 같은 곳에서 읽게

---

## 2. 구조화 데이터 (JSON-LD)

### 문제

하나도 없었다. 구글이 검색 결과 상단의 **사이트 이름**을 정할 때 보는
공식 경로가 홈페이지의 `WebSite` 구조화 데이터인데 그게 없었다.

### 고친 방법

`app/lib/seo/json-ld.tsx` 에 빌더와 렌더 컴포넌트를 두었다.

- **홈 2장** → `WebSite` + `Person`
- **글 38장** → `BlogPosting` (제목·설명·이미지·게시일·글쓴이·태그·언어)

Next 16 문서(`node_modules/next/dist/docs/01-app/02-guides/json-ld.md`)가 권하는
대로 `next/script` 가 아니라 평범한 `<script>` 로 넣고, `<` 를 `<` 로
escape 해서 `</script>` 가 태그로 닫히지 않게 했다.

글 쪽은 `components/pages/ArticlePage.tsx` 한 곳에 넣었다. 두 언어 라우트가
모두 이 컴포넌트를 지나므로 한 번만 고치면 된다.

### 바뀐 파일

- `app/lib/seo/json-ld.tsx` (신규)
- `app/(ko)/page.tsx`, `app/(en)/en/page.tsx` — 홈에 `WebSite`
- `components/pages/ArticlePage.tsx` — 글에 `BlogPosting`

---

## 3. 파비콘

### 문제 세 가지

1. `/favicon.ico` 가 **404** 였다
2. `public/iaman.ico` 는 **256x256 한 장** — 구글 권장은 48의 배수
3. 원본 `iaman.png`(2400x2400)는 **가로의 57%만 그림**이고 나머지가 투명 여백.
   그대로 줄이면 48px 안에서 점이 된다. 게다가 선화가 검은색이라
   **다크 배경에서 사라진다** (이 저장소에서 기본 썸네일로 이미 겪은 문제)

### 고친 방법

`scripts/gen-icons.ts` (`pnpm icons`)

1. 투명 여백을 잘라낸다 (`sharp.trim()`)
2. 흰 바탕을 깔고 그림을 가운데에, 둘레 12% 여백
3. 48·96 을 담은 `.ico`, 180(apple), 192(icon) 로 출력

`.ico` 는 sharp 가 못 써서 직접 만들었다 — 포맷이 단순하다
(6바이트 헤더 + 이미지당 16바이트 목록 + PNG 원본).

Next 의 파일 규약(`app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`)을
쓰므로 `metadata.ts` 의 수동 `icons: { icon: "/iaman.ico" }` 는 걷어냈다.
라우트 그룹 `(ko)`/`(en)` 양쪽에 태그가 붙는 것을 산출물로 확인했다.

### 바뀐 파일

- `scripts/gen-icons.ts` (신규), `package.json` 에 `icons` 스크립트
- `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` (신규)
- `app/utils/metadata.ts` — 수동 아이콘 제거
- `sharp` 를 devDependency 로 추가 (이미 next 의존성으로 받아져 있어 다운로드 없음)

---

## 검증

| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 0 |
| `pnpm test` | 107 / 107 |
| `pnpm build` | 76장 성공 |
| 사이트맵 | 74 URL (한국어 37 그대로) + hreflang 84줄 |
| 구조화 데이터 | 76장 중 40장 (홈 2 + 글 38), 전부 JSON 파싱 확인 |
| 아이콘 태그 | `(ko)`·`(en)` 양쪽 `<head>` 에 3종 출력 확인 |
| 48px 가독성 | 축소본 육안 확인 |

회귀 없음 — 한국어 주소·영어 주소·404 전부 그대로.

---

## 아직 남은 것

### 🔴 Google Analytics 가 동작하지 않는다 (이 작업 중 발견)

배포본 `https://iaman.kr/` 의 HTML:

```
https://www.googletagmanager.com/gtag/js?id=undefined
gtag('config', 'undefined', ...)
```

`components/Layout/RootShell.tsx:33` 의 `process.env.GA_MEASURE_ID` 가 빌드
시점에 비어 있다. 로컬이 아니라 **실제 배포본**이 그렇다.

검색 노출을 늘리려는데 유입을 측정할 수단이 없는 상태고, sitelinks 가 뜨는
조건 중 하나가 트래픽이라 직결된다.

**확인할 곳:** Cloudflare Pages → Settings → Environment variables.
`GA_MEASURE_ID` 가 Production 스코프에 있는지. 이전에 `API_TOKEN` /
`NEXT_PUBLIC_API_TOKEN` 을 지울 때 같이 지워졌을 수 있다.

### 🟡 Search Console

사용자가 예전에 등록했다고 함. HTML 에 인증 메타 태그는 없지만 DNS·파일
인증이면 태그가 없는 것이 정상이다. 배포 후 다음을 확인하면 좋다.

- 색인 현황 (`site:iaman.kr` 로도 대략 확인 가능)
- 사이트맵 `https://iaman.kr/sitemap.xml` 제출 상태
- URL 검사로 새 구조화 데이터 인식 여부

### 🟡 리치 결과 테스트

배포 후 [Rich Results Test](https://search.google.com/test/rich-results) 와
[Schema Markup Validator](https://validator.schema.org/) 에 글 URL 을 넣어
`BlogPosting` 이 제대로 읽히는지 확인.

### 참고 — 반영까지 걸리는 시간

구조화 데이터와 설명문은 구글이 다시 크롤링해야 검색 결과에 반영된다.
보통 며칠에서 몇 주. 파비콘은 더 느릴 수 있다.
