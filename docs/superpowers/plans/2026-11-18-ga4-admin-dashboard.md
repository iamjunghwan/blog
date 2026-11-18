# GA4 관리자 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `iaman.kr/admin`에서 Google 로그인한 본인만 GA4 방문 통계(방문자·조회수·세션, 아티클 조회수, 국가, 유입 채널·소스)를 본다.

**Architecture:** 정적 페이지 `/admin`이 빌드 때 공개 글 목록만 받고, 브라우저에서 Google Identity Services로 `analytics.readonly` 토큰을 얻어 GA4 Data API `batchRunReports`를 한 번 부른다. 요청·응답·집계는 `app/lib/analytics/`의 순수 함수로 두고 네트워크 없이 테스트한다. 서버·비밀키·환경변수는 만들지 않는다.

**Tech Stack:** Next.js 16 (App Router, `output: "export"`), React 19, Tailwind 3, `next/script`, Google Identity Services, GA4 Data API v1beta, `node:test` + tsx

설계: [docs/superpowers/specs/2026-11-18-ga4-admin-dashboard-design.md](../specs/2026-11-18-ga4-admin-dashboard-design.md)

## Global Constraints

- GA4 속성 ID `433431799`, OAuth 클라이언트 ID `131871495844-jjum07lvadb8iju1t8093s8kaca1udht.apps.googleusercontent.com`, 범위 `https://www.googleapis.com/auth/analytics.readonly` — `config.ts` 상수. 환경변수로 받지 않는다
- 새 npm 의존성 없음. GA4는 `fetch`로 직접 부른다
- `pnpm build`는 네트워크·환경변수 없이 성공해야 한다
- 토큰은 React state(메모리)에만. localStorage·sessionStorage·쿠키에 저장하지 않는다
- 기간 7·28·90일, 기본 28일. `startDate: "{N}daysAgo"`, `endDate: "today"`
- `/admin`은 `robots.txt`에서 Disallow, 메타데이터 `noindex, nofollow`, 사이트맵에 넣지 않는다
- admin 화면 글자는 폰트 서브셋(`scripts/fonts.ts`의 `UI_SOURCES`)에 넣지 않는다 — 혼자 보는 페이지 때문에 모든 방문자의 폰트를 키우지 않는다
- 이 저장소는 Next 16이다. 코드 작성 전 `node_modules/next/dist/docs/`의 해당 문서를 확인한다 (AGENTS.md)
- **커밋은 사용자 승인 후에만** (CLAUDE.md). 각 Task의 커밋 단계에서 변경을 보여 주고 승인을 받는다

## File Structure

| 파일 | 상태 | 책임 |
|---|---|---|
| `app/lib/analytics/config.ts` | 생성 | 공개 설정 상수, 기간 타입 |
| `app/lib/analytics/ga4.ts` | 생성 | 요청 본문, 응답 파싱, `fetchStats`(fetch 주입 가능) |
| `app/lib/analytics/ga4.test.ts` | 생성 | 위 함수 테스트 |
| `app/lib/analytics/articles.ts` | 생성 | 경로 → 글, 글 단위 ko·en 합산 |
| `app/lib/analytics/articles.test.ts` | 생성 | 위 함수 테스트 |
| `components/Admin/StatTables.tsx` | 생성 | 요약 카드 + 표 4개 (표시만) |
| `components/Admin/AdminDashboard.tsx` | 생성 | `"use client"` — GIS 로드, 로그인, 기간, 화면 상태 |
| `app/(ko)/admin/page.tsx` | 생성 | 라우트, noindex 메타데이터, 글 목록 전달 |
| `app/robots.ts` | 수정 | `/admin` Disallow |

---

### Task 1: GA4 요청·응답 모듈

**Files:**
- Create: `app/lib/analytics/config.ts`
- Create: `app/lib/analytics/ga4.ts`
- Test: `app/lib/analytics/ga4.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `config.ts`: `GA4_PROPERTY_ID: string`, `OAUTH_CLIENT_ID: string`, `OAUTH_SCOPE: string`, `PERIODS: readonly [7, 28, 90]`, `type Period = 7 | 28 | 90`, `DEFAULT_PERIOD: Period`
  - `ga4.ts`: `type Row = { label: string; value: number }`, `type Summary = { users: number; views: number; sessions: number }`, `type Ga4Stats = { summary: Summary; pages: Row[]; countries: Row[]; channels: Row[]; sources: Row[] }`, `batchRequestBody(period: Period): object`, `BATCH_ENDPOINT: string`, `parseBatchResponse(json: unknown): Ga4Stats`, `class Ga4Error extends Error { status: number }`, `fetchStats(token: string, period: Period, fetchImpl?: typeof fetch): Promise<Ga4Stats>`

- [ ] **Step 1: 설정 상수 작성**

`app/lib/analytics/config.ts`:

```ts
/****************************************
 *
 * GA4 관리자 대시보드 설정
 *
 * 전부 공개 값이다. OAuth 클라이언트 ID는 브라우저에 노출되도록 만들어진 값이고,
 * 속성 ID만으로는 데이터를 읽을 수 없다 — 읽기 권한은 로그인한 계정의 GA4 권한이 정한다.
 * 그래서 환경변수로 받지 않는다. 빌드가 환경변수 없이 도는 원칙을 지킨다.
 *
 ****************************************/

export const GA4_PROPERTY_ID = "433431799";

export const OAUTH_CLIENT_ID =
  "131871495844-jjum07lvadb8iju1t8093s8kaca1udht.apps.googleusercontent.com";

export const OAUTH_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

/** 고를 수 있는 기간(일). */
export const PERIODS = [7, 28, 90] as const;

export type Period = (typeof PERIODS)[number];

export const DEFAULT_PERIOD: Period = 28;
```

- [ ] **Step 2: 실패하는 테스트 작성**

`app/lib/analytics/ga4.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BATCH_ENDPOINT,
  Ga4Error,
  batchRequestBody,
  fetchStats,
  parseBatchResponse,
} from "@/app/lib/analytics/ga4";

type Req = {
  dateRanges: { startDate: string; endDate: string }[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  limit?: number;
};

const requestsOf = (period: 7 | 28 | 90) =>
  (batchRequestBody(period) as { requests: Req[] }).requests;

test("엔드포인트는 속성 ID의 batchRunReports다", () => {
  assert.equal(
    BATCH_ENDPOINT,
    "https://analyticsdata.googleapis.com/v1beta/properties/433431799:batchRunReports"
  );
});

test("보고서 5개를 같은 기간으로 요청한다", () => {
  const requests = requestsOf(7);

  assert.equal(requests.length, 5);
  for (const request of requests) {
    assert.deepEqual(request.dateRanges, [{ startDate: "7daysAgo", endDate: "today" }]);
  }
});

test("보고서 순서와 차원·지표가 설계와 같다", () => {
  const requests = requestsOf(28);
  const shape = requests.map((r) => ({
    dimensions: (r.dimensions ?? []).map((d) => d.name),
    metrics: r.metrics.map((m) => m.name),
  }));

  assert.deepEqual(shape, [
    { dimensions: [], metrics: ["activeUsers", "screenPageViews", "sessions"] },
    { dimensions: ["pagePath"], metrics: ["screenPageViews"] },
    { dimensions: ["country"], metrics: ["activeUsers"] },
    { dimensions: ["sessionDefaultChannelGroup"], metrics: ["sessions"] },
    { dimensions: ["sessionSource"], metrics: ["sessions"] },
  ]);
  assert.equal(requests[2].limit, 10);
  assert.equal(requests[4].limit, 10);
});

const row = (label: string, value: string) => ({
  dimensionValues: [{ value: label }],
  metricValues: [{ value }],
});

test("응답을 요약과 표로 바꾼다", () => {
  const stats = parseBatchResponse({
    reports: [
      { rows: [{ metricValues: [{ value: "120" }, { value: "340" }, { value: "150" }] }] },
      { rows: [row("/scion-source-control", "90"), row("/en/scion-source-control", "30")] },
      { rows: [row("South Korea", "80"), row("United States", "20")] },
      { rows: [row("Organic Search", "100")] },
      { rows: [row("google", "95")] },
    ],
  });

  assert.deepEqual(stats.summary, { users: 120, views: 340, sessions: 150 });
  assert.deepEqual(stats.pages, [
    { label: "/scion-source-control", value: 90 },
    { label: "/en/scion-source-control", value: 30 },
  ]);
  assert.deepEqual(stats.countries[0], { label: "South Korea", value: 80 });
  assert.deepEqual(stats.channels, [{ label: "Organic Search", value: 100 }]);
  assert.deepEqual(stats.sources, [{ label: "google", value: 95 }]);
});

test("데이터가 없는 기간은 0과 빈 표다", () => {
  // GA4는 행이 없으면 rows 필드를 아예 빼고 보낸다.
  const stats = parseBatchResponse({ reports: [{}, {}, {}, {}, {}] });

  assert.deepEqual(stats.summary, { users: 0, views: 0, sessions: 0 });
  assert.deepEqual(stats.pages, []);
  assert.deepEqual(stats.countries, []);
});

test("'(not set)'은 '알 수 없음'으로 보인다", () => {
  const stats = parseBatchResponse({
    reports: [{}, {}, { rows: [row("(not set)", "3")] }, {}, {}],
  });

  assert.deepEqual(stats.countries, [{ label: "알 수 없음", value: 3 }]);
});

test("fetchStats는 토큰을 Bearer로 싣고 결과를 파싱한다", async () => {
  let seen: { url: string; init: RequestInit } | undefined;
  const fakeFetch = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify({ reports: [{}, {}, {}, {}, {}] }), { status: 200 });
  }) as unknown as typeof fetch;

  const stats = await fetchStats("tok", 28, fakeFetch);

  assert.equal(seen?.url, BATCH_ENDPOINT);
  assert.equal(seen?.init.method, "POST");
  assert.equal((seen?.init.headers as Record<string, string>).Authorization, "Bearer tok");
  assert.deepEqual(stats.summary, { users: 0, views: 0, sessions: 0 });
});

test("fetchStats는 실패 상태 코드를 Ga4Error로 던진다", async () => {
  const fakeFetch = (async () =>
    new Response("forbidden", { status: 403 })) as unknown as typeof fetch;

  await assert.rejects(fetchStats("tok", 7, fakeFetch), (error: unknown) => {
    assert.ok(error instanceof Ga4Error);
    assert.equal(error.status, 403);
    return true;
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npx tsx --test app/lib/analytics/ga4.test.ts`
Expected: FAIL — `Cannot find module '@/app/lib/analytics/ga4'`

- [ ] **Step 4: 구현**

`app/lib/analytics/ga4.ts`:

```ts
/****************************************
 *
 * GA4 Data API — 요청 본문, 응답 파싱, 호출
 *
 * 공식 Node 라이브러리는 브라우저에서 돌지 않고 쓰는 엔드포인트가 하나뿐이라
 * fetch로 직접 부른다. fetch를 인자로 받아 네트워크 없이 테스트한다.
 *
 ****************************************/

import { GA4_PROPERTY_ID, type Period } from "@/app/lib/analytics/config";

export type Row = { label: string; value: number };

export type Summary = { users: number; views: number; sessions: number };

export type Ga4Stats = {
  summary: Summary;
  /** 경로별 조회수. 글 단위 집계는 articles.ts가 한다. */
  pages: Row[];
  countries: Row[];
  channels: Row[];
  sources: Row[];
};

export const BATCH_ENDPOINT = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:batchRunReports`;

/** 경로 행 상한. 글 24편 × 2개 언어 + 목록·홈을 넉넉히 덮는다. */
const PAGE_LIMIT = 1000;
const TOP_LIMIT = 10;

const metric = (name: string) => ({ name });
const dimension = (name: string) => ({ name });
const byMetricDesc = (name: string) => [{ metric: { metricName: name }, desc: true }];

/**
 * 보고서 5개(batchRunReports 한도). 순서가 곧 parseBatchResponse의 해석 순서다.
 * 방문자 합계는 첫 보고서에서만 쓴다 — 국가별 activeUsers를 더하면 중복 집계된다.
 */
export function batchRequestBody(period: Period): object {
  const dateRanges = [{ startDate: `${period}daysAgo`, endDate: "today" }];

  return {
    requests: [
      {
        dateRanges,
        metrics: [metric("activeUsers"), metric("screenPageViews"), metric("sessions")],
      },
      {
        dateRanges,
        dimensions: [dimension("pagePath")],
        metrics: [metric("screenPageViews")],
        limit: PAGE_LIMIT,
      },
      {
        dateRanges,
        dimensions: [dimension("country")],
        metrics: [metric("activeUsers")],
        orderBys: byMetricDesc("activeUsers"),
        limit: TOP_LIMIT,
      },
      {
        dateRanges,
        dimensions: [dimension("sessionDefaultChannelGroup")],
        metrics: [metric("sessions")],
        orderBys: byMetricDesc("sessions"),
      },
      {
        dateRanges,
        dimensions: [dimension("sessionSource")],
        metrics: [metric("sessions")],
        orderBys: byMetricDesc("sessions"),
        limit: TOP_LIMIT,
      },
    ],
  };
}

type ApiRow = {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
};
type ApiReport = { rows?: ApiRow[] };

const toNumber = (value: string | undefined) => Number(value ?? 0) || 0;

/** GA4가 값을 모를 때 주는 표기. 화면에는 한국어로 보인다. */
const labelOf = (value: string | undefined) =>
  value === undefined || value === "(not set)" ? "알 수 없음" : value;

function rowsOf(report: ApiReport | undefined): Row[] {
  return (report?.rows ?? []).map((row) => ({
    label: labelOf(row.dimensionValues?.[0]?.value),
    value: toNumber(row.metricValues?.[0]?.value),
  }));
}

export function parseBatchResponse(json: unknown): Ga4Stats {
  const reports = ((json as { reports?: ApiReport[] })?.reports ?? []) as ApiReport[];
  const totals = reports[0]?.rows?.[0]?.metricValues ?? [];

  return {
    summary: {
      users: toNumber(totals[0]?.value),
      views: toNumber(totals[1]?.value),
      sessions: toNumber(totals[2]?.value),
    },
    pages: rowsOf(reports[1]),
    countries: rowsOf(reports[2]),
    channels: rowsOf(reports[3]),
    sources: rowsOf(reports[4]),
  };
}

/** GA4가 실패 상태로 답했다. 화면이 401(만료)과 403(권한 없음)을 구분하는 데 쓴다. */
export class Ga4Error extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "Ga4Error";
  }
}

export async function fetchStats(
  token: string,
  period: Period,
  fetchImpl: typeof fetch = fetch
): Promise<Ga4Stats> {
  const response = await fetchImpl(BATCH_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(batchRequestBody(period)),
  });

  if (!response.ok) {
    throw new Ga4Error(response.status, await response.text());
  }

  return parseBatchResponse(await response.json());
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx tsx --test app/lib/analytics/ga4.test.ts`
Expected: PASS — 8 tests

- [ ] **Step 6: 커밋 (사용자 승인 후)**

```bash
git add app/lib/analytics/config.ts app/lib/analytics/ga4.ts app/lib/analytics/ga4.test.ts
git commit -m "✨ feat: GA4 batchRunReports 요청·응답 모듈을 더한다"
```

---

### Task 2: 경로 → 글 단위 집계

**Files:**
- Create: `app/lib/analytics/articles.ts`
- Test: `app/lib/analytics/articles.test.ts`

**Interfaces:**
- Consumes: `Row` from `@/app/lib/analytics/ga4` (Task 1), `Lang` from `@/app/lib/posts/types`
- Produces: `type ArticleRef = { slug: string; title: string; lang: Lang }`, `type ArticleViews = { slug: string; title: string; total: number; ko: number; en: number }`, `pathToArticle(path: string): { slug: string; lang: Lang } | null`, `articleViews(pages: Row[], articles: ArticleRef[]): ArticleViews[]`

- [ ] **Step 1: 실패하는 테스트 작성**

`app/lib/analytics/articles.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { articleViews, pathToArticle, type ArticleRef } from "@/app/lib/analytics/articles";

test("경로에서 언어와 slug을 읽는다", () => {
  assert.deepEqual(pathToArticle("/focus-trap"), { slug: "focus-trap", lang: "ko" });
  assert.deepEqual(pathToArticle("/en/focus-trap"), { slug: "focus-trap", lang: "en" });
});

test("끝 슬래시와 퍼센트 인코딩을 정리한다", () => {
  assert.deepEqual(pathToArticle("/focus-trap/"), { slug: "focus-trap", lang: "ko" });
  assert.deepEqual(pathToArticle("/en/Object-Map/"), { slug: "Object-Map", lang: "en" });
  assert.deepEqual(pathToArticle("/%ED%95%9C%EA%B8%80"), { slug: "한글", lang: "ko" });
});

test("글 모양이 아닌 경로는 null이다", () => {
  assert.equal(pathToArticle("/"), null);
  assert.equal(pathToArticle("/en"), null);
  assert.equal(pathToArticle("/en/"), null);
  assert.equal(pathToArticle("/post/all/1"), null);
  assert.equal(pathToArticle("/en/post/react/1"), null);
});

test("잘못된 퍼센트 인코딩에도 던지지 않는다", () => {
  assert.deepEqual(pathToArticle("/bad%E0"), { slug: "bad%E0", lang: "ko" });
});

const ARTICLES: ArticleRef[] = [
  { slug: "scion", title: "Scion 글", lang: "ko" },
  { slug: "scion", title: "Scion post", lang: "en" },
  { slug: "oxc", title: "Oxc 글", lang: "ko" },
  { slug: "oxc", title: "Oxc post", lang: "en" },
  { slug: "only-ko", title: "한국어만", lang: "ko" },
];

test("글 단위로 ko·en을 합산하고 합계 내림차순으로 정렬한다", () => {
  const result = articleViews(
    [
      { label: "/scion", value: 90 },
      { label: "/en/scion", value: 30 },
      { label: "/scion/", value: 5 },
      { label: "/oxc", value: 200 },
    ],
    ARTICLES
  );

  assert.deepEqual(result.slice(0, 2), [
    { slug: "oxc", title: "Oxc 글", total: 200, ko: 200, en: 0 },
    { slug: "scion", title: "Scion 글", total: 125, ko: 95, en: 30 },
  ]);
});

test("글이 아닌 경로와 없는 글은 버린다", () => {
  const result = articleViews(
    [
      { label: "/", value: 500 },
      { label: "/about", value: 40 },
      { label: "/admin", value: 3 },
      { label: "/post/all/1", value: 60 },
      { label: "/en/only-ko", value: 7 },
    ],
    ARTICLES
  );

  assert.equal(result.reduce((sum, a) => sum + a.total, 0), 0);
});

test("조회수 0인 글도 뒤에 남는다", () => {
  const result = articleViews([{ label: "/scion", value: 1 }], ARTICLES);

  assert.deepEqual(
    result.map((a) => [a.slug, a.total]),
    [
      ["scion", 1],
      ["oxc", 0],
      ["only-ko", 0],
    ]
  );
});

test("한국어판이 없으면 영어 제목을 쓴다", () => {
  const result = articleViews([], [{ slug: "en-only", title: "English only", lang: "en" }]);

  assert.equal(result[0].title, "English only");
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx tsx --test app/lib/analytics/articles.test.ts`
Expected: FAIL — `Cannot find module '@/app/lib/analytics/articles'`

- [ ] **Step 3: 구현**

`app/lib/analytics/articles.ts`:

```ts
/****************************************
 *
 * GA4 경로별 조회수 → 글 단위 조회수
 *
 * 블로그 주소 규칙: 한국어 `/<slug>`, 영어 `/en/<slug>` (app/lib/i18n/paths.ts).
 * 같은 slug의 두 언어판을 한 줄로 합치고, 조회수 0인 글도 남긴다.
 *
 ****************************************/

import type { Row } from "@/app/lib/analytics/ga4";
import type { Lang } from "@/app/lib/posts/types";

/** 빌드 때 페이지가 클라이언트로 넘기는 글 정보. 본문은 싣지 않는다. */
export type ArticleRef = { slug: string; title: string; lang: Lang };

export type ArticleViews = {
  slug: string;
  title: string;
  total: number;
  ko: number;
  en: number;
};

function decode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * 글 모양의 경로면 언어와 slug을, 아니면 null.
 * 실제로 있는 글인지는 여기서 보지 않는다 — /about도 글 모양이다. articleViews가 거른다.
 */
export function pathToArticle(path: string): { slug: string; lang: Lang } | null {
  const segments = path.split("/").filter((segment) => segment !== "");

  if (segments.length === 1 && segments[0] !== "en") {
    return { slug: decode(segments[0]), lang: "ko" };
  }
  if (segments.length === 2 && segments[0] === "en") {
    return { slug: decode(segments[1]), lang: "en" };
  }
  return null;
}

export function articleViews(pages: Row[], articles: ArticleRef[]): ArticleViews[] {
  const bySlug = new Map<string, ArticleViews>();
  const known = new Set(articles.map((a) => `${a.lang}:${a.slug}`));

  for (const article of articles) {
    const entry = bySlug.get(article.slug);

    if (!entry) {
      bySlug.set(article.slug, { slug: article.slug, title: article.title, total: 0, ko: 0, en: 0 });
    } else if (article.lang === "ko") {
      // 제목은 한국어판이 우선이다.
      entry.title = article.title;
    }
  }

  for (const page of pages) {
    const target = pathToArticle(page.label);

    if (!target || !known.has(`${target.lang}:${target.slug}`)) {
      continue;
    }
    const entry = bySlug.get(target.slug)!;

    entry[target.lang] += page.value;
    entry.total += page.value;
  }

  // 같은 합계면 입력 순서를 유지한다 (Array.prototype.sort는 안정 정렬).
  return [...bySlug.values()].sort((a, b) => b.total - a.total);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx tsx --test app/lib/analytics/articles.test.ts`
Expected: PASS — 8 tests

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add app/lib/analytics/articles.ts app/lib/analytics/articles.test.ts
git commit -m "✨ feat: GA4 경로별 조회수를 글 단위로 합산한다"
```

---

### Task 3: /admin 페이지와 화면

**Files:**
- Create: `components/Admin/StatTables.tsx`
- Create: `components/Admin/AdminDashboard.tsx`
- Create: `app/(ko)/admin/page.tsx`
- Modify: `app/robots.ts:12` (rules 배열)

**Interfaces:**
- Consumes: Task 1의 `OAUTH_CLIENT_ID`, `OAUTH_SCOPE`, `PERIODS`, `Period`, `DEFAULT_PERIOD`, `fetchStats`, `Ga4Error`, `Ga4Stats`, `Row`; Task 2의 `ArticleRef`, `ArticleViews`, `articleViews`; 기존 `allPosts()` (`app/lib/posts/repository.ts`), `InnerHeader` (`components/Layout/InnerHeader.tsx`, props `{ title: string }`)
- Produces: 라우트 `/admin`

- [ ] **Step 1: Next 16 문서 확인**

`node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md`의 `onReady`·`strategy` 절과
`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`의 `robots` 절을 읽는다.
아래 코드와 다른 API 변경이 있으면 문서를 따른다.

- [ ] **Step 2: 표시 컴포넌트 작성**

`components/Admin/StatTables.tsx`:

```tsx
import type { Ga4Stats, Row } from "@/app/lib/analytics/ga4";
import type { ArticleViews } from "@/app/lib/analytics/articles";

const format = (value: number) => value.toLocaleString("ko-KR");

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{format(value)}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function RowTable({ rows, valueLabel }: { rows: Row[]; valueLabel: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">데이터 없음</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500">
          <th className="py-1 font-normal">항목</th>
          <th className="py-1 text-right font-normal">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-gray-100 dark:border-gray-900">
            <td className="py-1">{row.label}</td>
            <td className="py-1 text-right tabular-nums">{format(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ArticleTable({ articles }: { articles: ArticleViews[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500">
          <th className="py-1 font-normal">글</th>
          <th className="py-1 text-right font-normal">합계</th>
          <th className="py-1 text-right font-normal">ko</th>
          <th className="py-1 text-right font-normal">en</th>
        </tr>
      </thead>
      <tbody>
        {articles.map((article) => (
          <tr key={article.slug} className="border-b border-gray-100 dark:border-gray-900">
            <td className="py-1">
              <a href={`/${article.slug}`} className="hover:underline">
                {article.title}
              </a>
            </td>
            <td className="py-1 text-right tabular-nums font-bold">{format(article.total)}</td>
            <td className="py-1 text-right tabular-nums">{format(article.ko)}</td>
            <td className="py-1 text-right tabular-nums">{format(article.en)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StatTables({
  stats,
  articles,
}: {
  stats: Ga4Stats;
  articles: ArticleViews[];
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-3 max-[500px]:grid-cols-1">
        <Card label="방문자" value={stats.summary.users} />
        <Card label="조회수" value={stats.summary.views} />
        <Card label="세션" value={stats.summary.sessions} />
      </div>
      <Section title="아티클 조회수">
        <ArticleTable articles={articles} />
      </Section>
      <div className="grid grid-cols-3 gap-6 max-[800px]:grid-cols-1">
        <Section title="방문 국가">
          <RowTable rows={stats.countries} valueLabel="방문자" />
        </Section>
        <Section title="유입 채널">
          <RowTable rows={stats.channels} valueLabel="세션" />
        </Section>
        <Section title="유입 소스">
          <RowTable rows={stats.sources} valueLabel="세션" />
        </Section>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 클라이언트 대시보드 작성**

`components/Admin/AdminDashboard.tsx`:

```tsx
"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import InnerHeader from "@/components/Layout/InnerHeader";
import StatTables from "@/components/Admin/StatTables";
import {
  DEFAULT_PERIOD,
  OAUTH_CLIENT_ID,
  OAUTH_SCOPE,
  PERIODS,
  type Period,
} from "@/app/lib/analytics/config";
import { Ga4Error, fetchStats, type Ga4Stats } from "@/app/lib/analytics/ga4";
import { articleViews, type ArticleRef } from "@/app/lib/analytics/articles";

/** Google Identity Services 중 쓰는 부분만 타입을 적는다. */
type TokenResponse = { access_token?: string; error?: string };
type TokenClient = { requestAccessToken: () => void };
type TokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: { initTokenClient: (config: TokenClientConfig) => TokenClient };
      };
    };
  }
}

type View =
  | { kind: "signedOut"; message?: string }
  | { kind: "loading" }
  | { kind: "ready"; stats: Ga4Stats }
  | { kind: "error"; message: string };

function messageFor(error: unknown): string {
  if (error instanceof Ga4Error && error.status === 403) {
    return "이 계정은 GA4 속성 권한이 없습니다.";
  }
  if (error instanceof Ga4Error) {
    return `통계를 불러오지 못했습니다 (HTTP ${error.status}).`;
  }
  return "통계를 불러오지 못했습니다. 네트워크를 확인해 주세요.";
}

const tabClass = (active: boolean) =>
  `rounded-full px-3 py-1 text-sm border ${
    active
      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
      : "border-gray-300 dark:border-gray-700"
  }`;

export default function AdminDashboard({ articles }: { articles: ArticleRef[] }) {
  const [gisReady, setGisReady] = useState(false);
  // 토큰은 메모리에만 둔다. 새로고침하면 다시 로그인한다.
  const [token, setToken] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [view, setView] = useState<View>({ kind: "signedOut" });
  const [attempt, setAttempt] = useState(0);

  const signIn = useCallback(() => {
    const oauth2 = window.google?.accounts.oauth2;

    if (!oauth2) {
      return;
    }
    oauth2
      .initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: OAUTH_SCOPE,
        callback: (response) => {
          if (response.access_token) {
            setToken(response.access_token);
          } else {
            setView({ kind: "signedOut", message: "로그인하지 못했습니다." });
          }
        },
        error_callback: () => {
          setView({ kind: "signedOut", message: "로그인 창이 닫혔습니다." });
        },
      })
      .requestAccessToken();
  }, []);

  useEffect(() => {
    if (token === null) {
      return;
    }
    let cancelled = false;

    setView({ kind: "loading" });
    fetchStats(token, period)
      .then((stats) => {
        if (!cancelled) {
          setView({ kind: "ready", stats });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof Ga4Error && error.status === 401) {
          setToken(null);
          setView({ kind: "signedOut", message: "로그인이 만료됐습니다. 다시 로그인해 주세요." });
          return;
        }
        setView({ kind: "error", message: messageFor(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [token, period, attempt]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" onReady={() => setGisReady(true)} />
      <InnerHeader title="Admin" />
      <main className="space-y-6 pb-12">
        {view.kind === "signedOut" ? (
          <section className="flex flex-col items-start gap-3">
            {view.message && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {view.message}
              </p>
            )}
            <button
              type="button"
              onClick={signIn}
              disabled={!gisReady}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm disabled:opacity-50"
            >
              Google로 로그인
            </button>
          </section>
        ) : (
          <>
            <nav aria-label="기간" className="flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={p === period}
                  onClick={() => setPeriod(p)}
                  className={tabClass(p === period)}
                >
                  {p}일
                </button>
              ))}
            </nav>
            {view.kind === "loading" && <p className="text-sm text-gray-500">불러오는 중…</p>}
            {view.kind === "error" && (
              <div role="alert" className="flex items-center gap-3 text-sm">
                <span className="text-red-600 dark:text-red-400">{view.message}</span>
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="underline"
                >
                  다시 시도
                </button>
              </div>
            )}
            {view.kind === "ready" && (
              <StatTables stats={view.stats} articles={articleViews(view.stats.pages, articles)} />
            )}
          </>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 4: 라우트 작성**

`app/(ko)/admin/page.tsx`:

```tsx
import type { Metadata } from "next";
import AdminDashboard from "@/components/Admin/AdminDashboard";
import { allPosts } from "@/app/lib/posts/repository";
import type { ArticleRef } from "@/app/lib/analytics/articles";

// 혼자 보는 페이지다. 검색엔진에 올리지 않는다 (robots.ts에서도 막는다).
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  // 클라이언트로는 slug·제목·언어만 넘긴다. 본문을 HTML에 싣지 않는다.
  const articles: ArticleRef[] = allPosts()
    .filter((post) => !post.draft)
    .map(({ slug, title, lang }) => ({ slug, title, lang }));

  return <AdminDashboard articles={articles} />;
}
```

- [ ] **Step 5: robots.txt에서 /admin 막기**

`app/robots.ts`의 rules를 바꾼다:

```ts
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin" }],
```

- [ ] **Step 6: 정적 검증**

Run: `npx tsc --noEmit -p .`
Expected: 출력 없음

Run: `pnpm test`
Expected: 전부 PASS (기존 150 + Task 1·2의 16 = 166)

Run: `pnpm build`
Expected: 성공. 이어서 아래로 결과물을 확인한다:

```bash
ls out/admin.html out/admin/index.html 2>/dev/null   # 둘 중 하나가 있다
grep -c 'noindex' out/admin.html out/admin/index.html 2>/dev/null   # 1 이상
grep 'Disallow: /admin' out/robots.txt               # 한 줄
grep -c '/admin' out/sitemap.xml                     # 0
```

- [ ] **Step 7: 브라우저 확인 (사람)**

Run: `pnpm dev` → `http://localhost:3000/admin`

확인 목록:
1. "Google로 로그인" 버튼이 잠시 뒤 활성화된다 (GIS 로드)
2. 로그인 → 동의 → 요약 카드 3개와 표 4개가 나온다
3. 7·28·90일 탭을 바꾸면 숫자가 바뀐다
4. 아티클 표에 공개 글 24편이 모두 있고 ko·en 합이 합계와 같다
5. GA4 권한이 없는 다른 구글 계정으로 로그인하면 "이 계정은 GA4 속성 권한이 없습니다"
6. 다크 모드에서 표와 카드가 읽힌다

`redirect_uri_mismatch`나 `origin` 오류가 나면 OAuth 클라이언트의 승인된 JavaScript 원본에
`http://localhost:3000`이 있는지 확인한다.

- [ ] **Step 8: 커밋 (사용자 승인 후)**

```bash
git add components/Admin app/\(ko\)/admin/page.tsx app/robots.ts
git commit -m "✨ feat: GA4 통계를 보는 /admin 페이지를 더한다"
```

배포 후 `https://iaman.kr/admin`에서 Step 7의 1~4를 다시 확인한다.
