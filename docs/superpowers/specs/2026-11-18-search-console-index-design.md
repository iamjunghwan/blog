# /admin 색인 상태 설계

**날짜** 2026-11-18
**상태** 승인됨
**선행** [2026-11-18-ga4-admin-dashboard-design.md](2026-11-18-ga4-admin-dashboard-design.md)

## 목표

/admin 아티클 표에서 글마다 구글 색인 여부를 본다. 새 글이 조회 0인 이유가 "아직 색인 안 됨"인지 바로 알기 위해서다.

## 방식 — Search Console URL Inspection API

| 방식 | 판단 |
|---|---|
| **A. URL Inspection API (주소별)** | **채택.** 색인됨 / 발견·크롤링됐지만 미색인 / 구글이 모름을 구분하고 마지막 크롤링 시각을 준다 |
| B. Search Analytics API (페이지별 노출·클릭) | 호출 한 번이지만 노출 0이 미색인을 뜻하지 않는다. "검색에서 얼마나 보이나"는 나중에 따로 |

GA4와 같은 브라우저 토큰으로 부른다. 서버·비밀키 없음.

- 엔드포인트: `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`
- 본문: `{ inspectionUrl, siteUrl: "sc-domain:iaman.kr" }` (도메인 속성. 처음엔 URL 접두어 `https://iaman.kr/`로 잘못 잡아 403이 났다)
- `languageCode`는 보내지 않는다 — 기본 `en-US`라야 `coverageState` 문자열 비교가 안정적이다
- 범위 추가: `https://www.googleapis.com/auth/webmasters.readonly`
- 한도: 속성당 분당 600, 하루 2,000. 글 24편 × 2개 언어 = 48회

## 상태 분류

`inspectionResult.indexStatusResult`에서:

| 조건 | 상태 | 표시 |
|---|---|---|
| (조회 전) | `pending` | `…` |
| `verdict === "PASS"` | `indexed` | `✅ 색인` |
| `coverageState === "URL is unknown to Google"` | `unknown` | `❌ 모름` |
| 그 밖의 verdict | `notIndexed` | `⏳ 미색인` |
| HTTP 실패·네트워크 오류·형식 오류 | `error` | `–` |
| 그 언어판이 없음 | (키 없음) | 빈 칸 |

칸의 `title`(마우스 올림)에 `coverageState`와 마지막 크롤링 날짜(`lastCrawlTime` 앞 10자)를 보인다.

## 불러오기

- 색인은 기간과 무관하므로 **토큰을 얻은 직후 한 번**. 기간 탭 전환에는 다시 부르지 않는다
- 존재하는 글 주소만 조회한다 (ko `https://iaman.kr/<slug>`, en `https://iaman.kr/en/<slug>`)
- 동시 6개로 제한해 나눠 부르고, 도착하는 대로 표를 채운다
- 실패해도 GA4 통계는 그대로. 해당 칸만 `–`

## 코드

| 파일 | 변경 |
|---|---|
| `app/lib/analytics/config.ts` | `OAUTH_SCOPE`에 `webmasters.readonly`를 공백으로 덧붙임, `SEARCH_CONSOLE_SITE` |
| `app/lib/analytics/searchConsole.ts` | 신규 — 주소 만들기, 요청 본문, 응답 → 상태, `inspectUrl`, `inspectAll`(동시성 제한) |
| `app/lib/analytics/searchConsole.test.ts` | 신규 |
| `components/Admin/StatTables.tsx` | 아티클 표에 색인 ko·en 칸 |
| `components/Admin/AdminDashboard.tsx` | 색인 상태 state와 로딩 effect |

## 사용자 설정

1. Google Cloud(`iaman-blog-analytics`) → **Google Search Console API** 사용 설정
2. Google 인증 플랫폼 → 데이터 액세스 → 범위 `https://www.googleapis.com/auth/webmasters.readonly` 추가
3. 로그인 계정이 Search Console 도메인 속성 `iaman.kr`의 사용자여야 한다

## 테스트

`searchConsole.test.ts` — 요청 본문, 주소 만들기, 상태 분류 4종 + 형식 오류, `inspectUrl`의 Bearer·POST·실패 처리, `inspectAll`의 전수 호출과 동시성 상한. 네트워크 없이 fetch 주입.
UI 배선은 브라우저에서 사람이 확인한다.
