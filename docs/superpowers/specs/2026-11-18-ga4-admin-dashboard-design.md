# GA4 관리자 대시보드 설계

**날짜** 2026-11-18
**상태** 승인됨 — 1차 구현 후 화면을 보며 점진적으로 더하고 뺀다

## 목표

블로그 방문 통계(방문자, 아티클 조회수, 방문 국가, 유입 경로)를 `iaman.kr/admin`에서 **본인만** 본다.

## 전제

- 수집은 이미 된다. `components/Layout/RootShell.tsx`가 프로덕션에서 gtag를 싣고, 배포 사이트의 측정 ID는 `G-1T06N6S30J`.
- 블로그는 서버 없는 정적 사이트(`output: "export"`)다. 이 원칙을 유지한다 — 서버 코드·비밀키·환경변수를 새로 만들지 않는다.

## 방식 — 브라우저에서 Google 로그인으로 GA4 Data API 직접 호출

검토한 대안:

| 방식 | 판단 |
|---|---|
| **A. 브라우저 OAuth + GA4 Data API 직접 호출** | **채택.** 서버·비밀키 없음. 접근 제어는 GA4 속성 권한이 한다 |
| B. Cloudflare Pages Function + Access + 서비스 계정 | 첫 서버 코드, 비밀키 관리, WebCrypto로 JWT 서명 직접 구현, Zero Trust 설정이 필요 |
| C. Function이 HTML까지 렌더 | B의 비용에 더해 블로그 레이아웃·다크 모드와 분리됨 |

"본인만"은 Google이 보장한다. GA4 속성 권한이 없는 계정은 로그인해도 403을 받는다.
페이지 자체는 누구나 열 수 있지만 로그인 버튼만 보인다.

## 구조

```
app/(ko)/admin/page.tsx            /admin. noindex 메타데이터, 글 목록(slug·title·lang)을 빌드 때 넘긴다
components/Admin/
  AdminDashboard.tsx               "use client" — 로그인, 기간 탭, 화면 상태
  StatTables.tsx                   요약 카드 + 표 4개 (표시만)
app/lib/analytics/
  config.ts                        GA4 속성 ID, OAuth 클라이언트 ID (공개 값, 상수)
  ga4.ts                           기간 → 요청 본문, 응답 → 타입 있는 결과 (순수 함수)
  ga4.test.ts
  articles.ts                      경로별 조회수 → 글 단위 합산 + ko·en (순수 함수)
  articles.test.ts
app/robots.ts                      /admin Disallow
```

**설정 값** (`config.ts`)

| 이름 | 값 |
|---|---|
| GA4 속성 ID | `433431799` |
| OAuth 클라이언트 ID | `131871495844-jjum07lvadb8iju1t8093s8kaca1udht.apps.googleusercontent.com` |
| OAuth 범위 | `https://www.googleapis.com/auth/analytics.readonly` |

둘 다 비밀이 아니다 (클라이언트 ID는 브라우저에 노출되도록 만들어진 값). 환경변수로 받지 않아 `pnpm build`는
지금처럼 네트워크·환경변수 없이 돈다.

## 흐름

```
빌드: page.tsx가 repository에서 공개 글을 읽어 { slug, title, lang }[]만 클라이언트에 넘긴다
접속: Google Identity Services 스크립트 (admin 페이지에서만 로드)
      → [Google로 로그인] → initTokenClient로 analytics.readonly 액세스 토큰 (1시간)
      → POST https://analyticsdata.googleapis.com/v1beta/properties/433431799:batchRunReports
      → ga4.ts가 응답 정리 → articles.ts가 글 목록과 합침 → 화면
```

GA4 공식 Node 라이브러리는 브라우저에서 돌지 않고 엔드포인트가 하나뿐이므로 `fetch`로 직접 부른다. 새 의존성 없음.

## 데이터

`batchRunReports` 한 번에 보고서 5개(API 한도).

| 영역 | 차원 × 지표 | 표시 |
|---|---|---|
| 요약 | 없음 × `activeUsers`, `screenPageViews`, `sessions` | 숫자 카드 3개 |
| 아티클 조회수 | `pagePath` × `screenPageViews` | 글 단위 합계 내림차순, ko·en 병기. 공개 글 전부(0회 포함) |
| 방문 국가 | `country` × `activeUsers` | 상위 10 |
| 유입 채널 | `sessionDefaultChannelGroup` × `sessions` | 전부 |
| 유입 소스 | `sessionSource` × `sessions` | 상위 10 |

- **기간**: 7·28·90일 탭, 기본 28일. `startDate: "{N}daysAgo"`, `endDate: "today"`. 오늘 값은 GA4 처리 지연으로 덜 잡힐 수 있다.
- **방문자 합계는 요약 보고서에서만** 쓴다. 국가별 `activeUsers`를 더하면 중복 집계된다.
- **경로 → 글**: `/slug`는 ko, `/en/slug`는 en. 끝 슬래시를 떼고 `decodeURIComponent` 후 비교한다.
  글이 아닌 경로(홈, 목록, about, admin)는 아티클 표에서 빠지고 요약에만 반영된다.
- **이번에 넣지 않는 것**: 일별 추이, 기기·브라우저, 체류 시간. 보고서 5개가 한도라 넣으려면 두 번째 호출이 필요하다.
  화면을 보고 필요하면 더한다.

## 상태와 오류

| 상태 | 화면 |
|---|---|
| 처음 | "Google로 로그인" 버튼 |
| 불러오는 중 | 카드·표 자리에 로딩 표시 |
| 정상 | 카드 + 표 4개 + 기간 탭 |
| 401 (토큰 만료) | 토큰 폐기, 로그인 버튼 + "다시 로그인해 주세요" |
| 403 (권한 없음) | "이 계정은 GA4 속성 권한이 없습니다" |
| 팝업 닫음·네트워크·할당량 | 오류 메시지 + 다시 시도 |

- 토큰은 **메모리에만** 둔다. localStorage에 저장하지 않는다 — 새로고침하면 다시 로그인한다.
- /admin 방문도 GA4에 잡힌다. 글이 아니므로 아티클 표에는 안 나오고 요약에 조금 섞인다. 필요하면 다음 단계에서 뺀다.

## 테스트

- `ga4.test.ts` — 기간별 요청 본문, 응답 파싱(빈 응답, `(not set)`, 행 없는 보고서)
- `articles.test.ts` — ko·en 합산, 끝 슬래시·인코딩, 글이 아닌 경로 제외, 0회 글 포함, 정렬
- 네트워크 없이 기존 `pnpm test`에서 돈다.
- 실제 로그인·API 호출은 자동화하지 않는다. localhost와 배포 사이트에서 사람이 확인한다.

## 사용자 설정 (완료 여부는 구현 시 확인)

1. Google Cloud 프로젝트에서 **Google Analytics Data API** 사용 설정
2. OAuth 동의 화면 — 외부, 테스트 모드, 본인 계정을 테스트 사용자로, 범위 `analytics.readonly`
3. OAuth 클라이언트 ID(웹) — 승인된 JavaScript 원본에 `https://iaman.kr`, `http://localhost:3000` ← 받음
4. GA4 속성 ID 확인 ← 받음
