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
  options: {
    concurrency?: number;
    fetchImpl?: typeof fetch;
    /** false가 되면 새 주소를 더 조회하지 않는다(진행 중인 호출은 끝까지 간다). */
    shouldContinue?: () => boolean;
  } = {}
): Promise<void> {
  const { concurrency = DEFAULT_CONCURRENCY, fetchImpl = fetch, shouldContinue = () => true } = options;
  let next = 0;

  async function worker(): Promise<void> {
    while (next < urls.length && shouldContinue()) {
      const url = urls[next];

      next += 1;
      onResult(url, await inspectUrl(token, url, fetchImpl));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
}

/**
 * 모든 주소가 같은 이유로 실패했으면 표 위에 띄울 한 줄, 아니면 null.
 * 조회 중(pending)이 남아 있거나 하나라도 성공했으면 null.
 */
export function indexFailure(index: Record<string, IndexStatus>): string | null {
  const statuses = Object.values(index);

  if (statuses.length === 0 || statuses.some((status) => status.state !== "error")) {
    return null;
  }
  const detail = statuses[0].detail;

  if (statuses.some((status) => status.detail !== detail)) {
    return "색인 상태를 불러오지 못했습니다.";
  }
  if (detail === "HTTP 403") {
    return "Search Console 권한이 없습니다. API 사용 설정, 데이터 액세스 범위(webmasters.readonly), 속성 사용자 여부를 확인해 주세요.";
  }
  return `색인 상태를 불러오지 못했습니다 (${detail}).`;
}
