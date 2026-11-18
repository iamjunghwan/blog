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
