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
