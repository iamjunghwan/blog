# /admin 색인 상태 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** /admin 아티클 표에 글마다 ko·en 구글 색인 상태를 보인다.

**Architecture:** GA4와 같은 브라우저 OAuth 토큰에 `webmasters.readonly` 범위를 더해, Search Console URL Inspection API를 글 주소마다 부른다(동시 6개). 요청·분류·동시성은 `app/lib/analytics/searchConsole.ts`의 순수 함수로 두고 fetch 주입으로 테스트한다. UI는 토큰을 얻은 직후 한 번 불러와 표를 채운다.

**Tech Stack:** Next.js 16 (`output: "export"`), React 19, Search Console API v1, `node:test` + tsx

설계: [docs/superpowers/specs/2026-11-18-search-console-index-design.md](../specs/2026-11-18-search-console-index-design.md)

## Global Constraints

- 엔드포인트 `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`, 본문 `{ inspectionUrl, siteUrl: "https://iaman.kr/" }`, `languageCode`는 보내지 않는다
- 범위 `https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly` (공백 구분)
- 분류: `verdict === "PASS"` → `indexed`; `coverageState === "URL is unknown to Google"` → `unknown`; 그 밖 → `notIndexed`; HTTP 실패·네트워크·형식 오류 → `error`; 조회 전 → `pending`
- 표시: `pending` `…` / `indexed` `✅ 색인` / `notIndexed` `⏳ 미색인` / `unknown` `❌ 모름` / `error` `–` / 그 언어판 없음 → 빈 칸
- 동시 호출 6개. 색인은 토큰을 얻은 직후 한 번만, 기간 탭 전환에는 다시 부르지 않는다
- 색인 조회 실패가 GA4 통계 표시를 막지 않는다
- 새 npm 의존성 없음. 토큰은 메모리에만
- **이 브랜치(`feat/ga4-admin`) 안의 커밋은 사용자가 승인했다.** main 병합·푸시는 별도 승인

## File Structure

| 파일 | 상태 | 책임 |
|---|---|---|
| `app/lib/analytics/config.ts` | 수정 | 범위 추가, `SEARCH_CONSOLE_SITE` |
| `app/lib/analytics/searchConsole.ts` | 생성 | 글 주소, 요청 본문, 응답 분류, `inspectUrl`, `inspectAll` |
| `app/lib/analytics/searchConsole.test.ts` | 생성 | 위 테스트 |
| `components/Admin/StatTables.tsx` | 수정 | 색인 ko·en 칸 |
| `components/Admin/AdminDashboard.tsx` | 수정 | 색인 state와 effect |

---

### Task 1: Search Console 조회 모듈

**Files:**
- Modify: `app/lib/analytics/config.ts` (`OAUTH_SCOPE` 줄, 파일 끝)
- Create: `app/lib/analytics/searchConsole.ts`
- Test: `app/lib/analytics/searchConsole.test.ts`

**Interfaces:**
- Consumes: `SITE_URL` (`@/app/lib/site`, 값 `"https://iaman.kr"`), `localePath(lang, path)` (`@/app/lib/i18n/paths` — ko는 그대로, en은 `/en` 접두), `Lang`
- Produces: `SEARCH_CONSOLE_SITE: string`; `type IndexState = "pending" | "indexed" | "notIndexed" | "unknown" | "error"`; `type IndexStatus = { state: IndexState; detail: string; lastCrawl?: string }`; `INSPECT_ENDPOINT: string`; `articleUrl(slug: string, lang: Lang): string`; `inspectRequestBody(url: string): { inspectionUrl: string; siteUrl: string }`; `parseInspection(json: unknown): IndexStatus`; `inspectUrl(token: string, url: string, fetchImpl?: typeof fetch): Promise<IndexStatus>`; `inspectAll(token: string, urls: string[], onResult: (url: string, status: IndexStatus) => void, options?: { concurrency?: number; fetchImpl?: typeof fetch }): Promise<void>`

- [ ] **Step 1: 설정 수정**

`app/lib/analytics/config.ts`의 `OAUTH_SCOPE`를 바꾸고 파일 끝에 상수를 더한다:

```ts
/** GA4 읽기 + Search Console 읽기. GIS는 공백으로 구분한 여러 범위를 받는다. */
export const OAUTH_SCOPE = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
].join(" ");
```

```ts
/** Search Console의 URL 접두어 속성. 끝 슬래시까지 정확히 같아야 한다. */
export const SEARCH_CONSOLE_SITE = "https://iaman.kr/";
```

- [ ] **Step 2: 실패하는 테스트 작성**

`app/lib/analytics/searchConsole.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INSPECT_ENDPOINT,
  articleUrl,
  inspectAll,
  inspectRequestBody,
  inspectUrl,
  parseInspection,
} from "@/app/lib/analytics/searchConsole";

const result = (indexStatusResult: object) => ({ inspectionResult: { indexStatusResult } });

test("글 주소는 언어에 따라 /en 접두가 붙는다", () => {
  assert.equal(articleUrl("focus-trap", "ko"), "https://iaman.kr/focus-trap");
  assert.equal(articleUrl("focus-trap", "en"), "https://iaman.kr/en/focus-trap");
});

test("요청 본문은 주소와 URL 접두어 속성이다", () => {
  assert.deepEqual(inspectRequestBody("https://iaman.kr/oxc"), {
    inspectionUrl: "https://iaman.kr/oxc",
    siteUrl: "https://iaman.kr/",
  });
});

test("PASS는 색인됨이고 마지막 크롤링 날짜를 남긴다", () => {
  assert.deepEqual(
    parseInspection(
      result({
        verdict: "PASS",
        coverageState: "Submitted and indexed",
        lastCrawlTime: "2026-11-10T03:12:45Z",
      })
    ),
    { state: "indexed", detail: "Submitted and indexed", lastCrawl: "2026-11-10" }
  );
});

test("구글이 모르는 주소는 unknown이다", () => {
  assert.deepEqual(
    parseInspection(result({ verdict: "NEUTRAL", coverageState: "URL is unknown to Google" })),
    { state: "unknown", detail: "URL is unknown to Google" }
  );
});

test("발견됐지만 색인 안 된 주소는 notIndexed다", () => {
  assert.deepEqual(
    parseInspection(
      result({ verdict: "NEUTRAL", coverageState: "Discovered - currently not indexed" })
    ),
    { state: "notIndexed", detail: "Discovered - currently not indexed" }
  );
});

test("형식이 어긋난 응답은 error다", () => {
  assert.deepEqual(parseInspection({}), { state: "error", detail: "응답 형식 오류" });
});

test("inspectUrl은 Bearer 토큰과 본문을 POST로 보낸다", async () => {
  let seen: { url: string; init: RequestInit } | undefined;
  const fakeFetch = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify(result({ verdict: "PASS", coverageState: "Submitted and indexed" })));
  }) as unknown as typeof fetch;

  const status = await inspectUrl("tok", "https://iaman.kr/oxc", fakeFetch);

  assert.equal(seen?.url, INSPECT_ENDPOINT);
  assert.equal(seen?.init.method, "POST");
  assert.equal((seen?.init.headers as Record<string, string>).Authorization, "Bearer tok");
  assert.deepEqual(JSON.parse(String(seen?.init.body)), {
    inspectionUrl: "https://iaman.kr/oxc",
    siteUrl: "https://iaman.kr/",
  });
  assert.equal(status.state, "indexed");
});

test("inspectUrl은 실패 상태 코드와 네트워크 오류를 error로 돌려준다", async () => {
  const forbidden = (async () => new Response("no", { status: 403 })) as unknown as typeof fetch;
  const offline = (async () => {
    throw new TypeError("Failed to fetch");
  }) as unknown as typeof fetch;

  assert.deepEqual(await inspectUrl("tok", "https://iaman.kr/a", forbidden), {
    state: "error",
    detail: "HTTP 403",
  });
  assert.deepEqual(await inspectUrl("tok", "https://iaman.kr/a", offline), {
    state: "error",
    detail: "네트워크 오류",
  });
});

test("inspectAll은 모든 주소를 조회하고 동시 호출을 제한한다", async () => {
  let inFlight = 0;
  let peak = 0;
  const fakeFetch = (async () => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 5));
    inFlight -= 1;
    return new Response(JSON.stringify(result({ verdict: "PASS", coverageState: "Submitted and indexed" })));
  }) as unknown as typeof fetch;
  const urls = Array.from({ length: 10 }, (_, i) => `https://iaman.kr/p${i}`);
  const seen: string[] = [];

  await inspectAll(
    "tok",
    urls,
    (url, status) => {
      seen.push(url);
      assert.equal(status.state, "indexed");
    },
    { concurrency: 3, fetchImpl: fakeFetch }
  );

  assert.deepEqual([...seen].sort(), [...urls].sort());
  assert.equal(peak, 3);
});
```

- [ ] **Step 3: 실패 확인**

Run: `npx tsx --test app/lib/analytics/searchConsole.test.ts`
Expected: FAIL — `Cannot find module '@/app/lib/analytics/searchConsole'`

- [ ] **Step 4: 구현**

`app/lib/analytics/searchConsole.ts`:

```ts
/****************************************
 *
 * Search Console URL Inspection — 글 주소별 구글 색인 상태
 *
 * GA4와 같은 브라우저 토큰(webmasters.readonly 범위)으로 부른다.
 * languageCode를 보내지 않는다 — 기본 en-US라야 coverageState 비교가 안정적이다.
 * fetch를 인자로 받아 네트워크 없이 테스트한다.
 *
 ****************************************/

import { SEARCH_CONSOLE_SITE } from "@/app/lib/analytics/config";
import { SITE_URL } from "@/app/lib/site";
import { localePath } from "@/app/lib/i18n/paths";
import type { Lang } from "@/app/lib/posts/types";

export type IndexState = "pending" | "indexed" | "notIndexed" | "unknown" | "error";

export type IndexStatus = {
  state: IndexState;
  /** Search Console의 coverageState 원문, 또는 오류 설명 */
  detail: string;
  /** 마지막 크롤링 날짜 YYYY-MM-DD */
  lastCrawl?: string;
};

export const INSPECT_ENDPOINT =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

const UNKNOWN_TO_GOOGLE = "URL is unknown to Google";

/** 속성당 분당 600회 한도 안에서 한 번에 몰리지 않게 한다. */
const DEFAULT_CONCURRENCY = 6;

export function articleUrl(slug: string, lang: Lang): string {
  return `${SITE_URL}${localePath(lang, `/${slug}`)}`;
}

export function inspectRequestBody(inspectionUrl: string) {
  return { inspectionUrl, siteUrl: SEARCH_CONSOLE_SITE };
}

type IndexStatusResult = {
  verdict?: string;
  coverageState?: string;
  lastCrawlTime?: string;
};

export function parseInspection(json: unknown): IndexStatus {
  const result = (json as { inspectionResult?: { indexStatusResult?: IndexStatusResult } })
    ?.inspectionResult?.indexStatusResult;

  if (!result || typeof result.verdict !== "string") {
    return { state: "error", detail: "응답 형식 오류" };
  }

  const detail = result.coverageState ?? result.verdict;
  const state: IndexState =
    result.verdict === "PASS"
      ? "indexed"
      : result.coverageState === UNKNOWN_TO_GOOGLE
        ? "unknown"
        : "notIndexed";
  const lastCrawl = result.lastCrawlTime?.slice(0, 10);

  return lastCrawl ? { state, detail, lastCrawl } : { state, detail };
}

/** 실패해도 던지지 않는다. 한 주소의 실패가 표 전체를 막지 않게 error 상태로 돌려준다. */
export async function inspectUrl(
  token: string,
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<IndexStatus> {
  try {
    const response = await fetchImpl(INSPECT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inspectRequestBody(url)),
    });

    if (!response.ok) {
      return { state: "error", detail: `HTTP ${response.status}` };
    }
    return parseInspection(await response.json());
  } catch {
    return { state: "error", detail: "네트워크 오류" };
  }
}

/** 주소들을 동시 concurrency개씩 조회하고, 하나 끝날 때마다 onResult로 알린다. */
export async function inspectAll(
  token: string,
  urls: string[],
  onResult: (url: string, status: IndexStatus) => void,
  options: { concurrency?: number; fetchImpl?: typeof fetch } = {}
): Promise<void> {
  const { concurrency = DEFAULT_CONCURRENCY, fetchImpl = fetch } = options;
  let next = 0;

  async function worker(): Promise<void> {
    while (next < urls.length) {
      const url = urls[next];

      next += 1;
      onResult(url, await inspectUrl(token, url, fetchImpl));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx tsx --test app/lib/analytics/searchConsole.test.ts`
Expected: PASS — 9 tests

Run: `pnpm test`
Expected: 176 pass (기존 167 + 9)

- [ ] **Step 6: 커밋**

```bash
git add app/lib/analytics/config.ts app/lib/analytics/searchConsole.ts app/lib/analytics/searchConsole.test.ts
git commit -m "✨ feat: Search Console로 글 주소별 색인 상태를 조회한다"
```

---

### Task 2: 아티클 표에 색인 칸

**Files:**
- Modify: `components/Admin/StatTables.tsx` (`ArticleTable`, `StatTables` props)
- Modify: `components/Admin/AdminDashboard.tsx` (state, effect, `<StatTables>` 호출)

**Interfaces:**
- Consumes: Task 1의 `articleUrl`, `inspectAll`, `type IndexStatus`; 기존 `ArticleRef`, `ArticleViews`
- Produces: `StatTables` props `{ stats: Ga4Stats; articles: ArticleViews[]; index: Record<string, IndexStatus> }`

- [ ] **Step 1: StatTables에 색인 칸 추가**

`components/Admin/StatTables.tsx` 맨 위 import에 더한다:

```tsx
import { articleUrl, type IndexStatus } from "@/app/lib/analytics/searchConsole";
```

`ArticleTable` 위에 더한다:

```tsx
const INDEX_LABEL: Record<IndexStatus["state"], string> = {
  pending: "…",
  indexed: "✅ 색인",
  notIndexed: "⏳ 미색인",
  unknown: "❌ 모름",
  error: "–",
};

/** status가 없으면 그 언어판이 없는 글이다 — 빈 칸. */
function IndexCell({ status }: { status: IndexStatus | undefined }) {
  if (!status) {
    return <td className="py-1 pl-3" />;
  }
  const title = status.lastCrawl
    ? `${status.detail} · 마지막 크롤링 ${status.lastCrawl}`
    : status.detail;

  return (
    <td className="py-1 pl-3 text-right whitespace-nowrap" title={title}>
      {INDEX_LABEL[status.state]}
    </td>
  );
}
```

`ArticleTable`을 다음으로 바꾼다:

```tsx
function ArticleTable({
  articles,
  index,
}: {
  articles: ArticleViews[];
  index: Record<string, IndexStatus>;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500">
          <th className="py-1 font-normal">글</th>
          <th className="py-1 text-right font-normal">합계</th>
          <th className="py-1 text-right font-normal">ko</th>
          <th className="py-1 text-right font-normal">en</th>
          <th className="py-1 pl-3 text-right font-normal">색인 ko</th>
          <th className="py-1 pl-3 text-right font-normal">색인 en</th>
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
            <IndexCell status={index[articleUrl(article.slug, "ko")]} />
            <IndexCell status={index[articleUrl(article.slug, "en")]} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

`StatTables`의 props에 `index`를 더하고 `ArticleTable`로 넘긴다:

```tsx
export default function StatTables({
  stats,
  articles,
  index,
}: {
  stats: Ga4Stats;
  articles: ArticleViews[];
  index: Record<string, IndexStatus>;
}) {
```

```tsx
        <ArticleTable articles={articles} index={index} />
```

- [ ] **Step 2: AdminDashboard에 색인 state와 effect 추가**

import에 더한다:

```tsx
import { articleUrl, inspectAll, type IndexStatus } from "@/app/lib/analytics/searchConsole";
```

다른 `useState` 옆에 더한다:

```tsx
  // 글 주소 → 색인 상태. 기간과 무관해 토큰을 얻은 직후 한 번만 채운다.
  const [index, setIndex] = useState<Record<string, IndexStatus>>({});
```

GA4를 부르는 기존 effect 뒤에 더한다:

```tsx
  useEffect(() => {
    if (token === null) {
      return;
    }
    let cancelled = false;
    const urls = articles.map((article) => articleUrl(article.slug, article.lang));
    const pending: IndexStatus = { state: "pending", detail: "조회 중" };

    setIndex(Object.fromEntries(urls.map((url) => [url, pending])));
    inspectAll(token, urls, (url, status) => {
      if (!cancelled) {
        setIndex((prev) => ({ ...prev, [url]: status }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token, articles]);
```

`<StatTables ... />` 호출에 `index={index}`를 더한다:

```tsx
              <StatTables
                stats={view.stats}
                articles={articleViews(view.stats.pages, articles)}
                index={index}
              />
```

- [ ] **Step 3: 정적 검증**

Run: `npx tsc --noEmit -p .` → 출력 없음
Run: `pnpm test` → 176 pass
Run: `pnpm build` → 성공

- [ ] **Step 4: 커밋**

```bash
git add components/Admin/StatTables.tsx components/Admin/AdminDashboard.tsx
git commit -m "✨ feat: /admin 아티클 표에 색인 상태를 보인다"
```

- [ ] **Step 5: 브라우저 확인 (사람)**

사전 설정: Search Console API 사용 설정, 데이터 액세스에 `webmasters.readonly` 추가.
`pnpm dev` → `http://localhost:3000/admin` → 다시 로그인(동의 화면에 Search Console 권한이 추가로 보인다).
색인 ko·en 칸이 `…`에서 상태로 채워지는지, 마우스를 올리면 문구와 크롤링 날짜가 보이는지, 기간 탭을 바꿔도 색인 칸은 다시 `…`가 되지 않는지 확인한다.
