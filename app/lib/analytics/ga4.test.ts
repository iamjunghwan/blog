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
