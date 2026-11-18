# GA4 관리자 대시보드 (/admin)

**날짜** 2026-11-18
**브랜치** `feat/ga4-admin`
**설계** [specs/2026-11-18-ga4-admin-dashboard-design.md](../superpowers/specs/2026-11-18-ga4-admin-dashboard-design.md)
**계획** [plans/2026-11-18-ga4-admin-dashboard.md](../superpowers/plans/2026-11-18-ga4-admin-dashboard.md)

## 무엇을 했나

`iaman.kr/admin`에서 Google 로그인한 본인만 GA4 통계를 본다. 서버·비밀키·환경변수 없이
브라우저가 GA4 Data API를 직접 부르고, 접근 제어는 GA4 속성 권한이 한다.

| 커밋 | 내용 |
|---|---|
| `e6f60a8` | 설계·계획 문서 |
| `83f1902` | `app/lib/analytics/config.ts`, `ga4.ts` — 요청 본문·응답 파싱·`fetchStats` |
| `4e4ce76` | `app/lib/analytics/articles.ts` — 경로 → 글 단위 ko·en 합산 |
| `a25aef0` | `components/Admin/*`, `app/(ko)/admin/page.tsx`, `app/robots.ts` |
| `e24b6c0` | 최종 리뷰 반영 — 경로 보고서 정렬, GIS 로드 실패·팝업 오류 안내 |

화면: 요약 카드(방문자·조회수·세션), 아티클 조회수(글 단위 합계 + ko·en), 방문 국가 상위 10, 유입 채널, 유입 소스 상위 10. 7·28·90일 탭(기본 28일).

## 진행 방식

Superpowers의 서브에이전트 방식. 작업마다 구현 → 리뷰(스펙 + 품질), 끝에 브랜치 전체 리뷰.

- 구현: Task 1·2 haiku(계획에 전체 코드), Task 3 sonnet(여러 파일·빌드 확인)
- 작업별 리뷰: sonnet. 셋 다 첫 리뷰에서 통과
- 최종 리뷰: opus. **With fixes** — 아래 두 건을 고친 뒤 재리뷰 통과

## 최종 리뷰가 잡은 것

1. **경로 보고서에 정렬이 없었다.** `limit: 1000`만 있어 GA4가 자를 때 임의의 경로가 빠질 수 있었다.
   90일처럼 봇·404 경로가 쌓이면 글 조회수가 조용히 적게 잡힌다. 조회수 내림차순 정렬을 넣고 테스트로 고정했다.
   계획 단계의 누락이다.
2. **GIS 스크립트가 막히면 로그인 버튼이 말없이 비활성으로 남았다.** 광고 차단기가 흔히 막는 주소다. `onError`로 안내한다.
3. (같이) 팝업 차단과 창 닫힘을 다른 문구로 알린다.

미룬 것: 403일 때 "다른 계정으로 로그인" 버튼, 기간 탭의 `role="group"`, 영어판만 있는 글의 링크(지금은 없음),
/admin 방문이 GA4 요약에 섞이는 것.

## 검증

- `pnpm test` 167개 통과 (기존 150 + ga4 9 + articles 8) — 색인 추가 후 181개
- `npx tsc --noEmit -p .` 통과
- `pnpm build` 성공. `out/admin.html`에 `noindex, nofollow`, `out/robots.txt`에 `Disallow: /admin`, 사이트맵에 /admin 없음

## 사용자 확인 중 겪은 것

- 첫 로그인에서 `403 access_denied` ("Google 인증 절차를 완료하지 않았습니다") — OAuth 동의 화면이 테스트 모드인데
  로그인 계정이 테스트 사용자에 없었다. Google 인증 플랫폼 → 대상 → 테스트 사용자에 추가하면 된다. 앱은 게시하지 않는다
  (`analytics.readonly`는 민감 범위라 게시하면 검수가 필요).

## 추가 — 색인 상태 (Search Console)

첫 화면을 보고 "새 글 조회가 0인 게 색인 때문인가"를 확인하려고 붙였다.
설계 [specs/2026-11-18-search-console-index-design.md](../superpowers/specs/2026-11-18-search-console-index-design.md),
계획 [plans/2026-11-18-search-console-index.md](../superpowers/plans/2026-11-18-search-console-index.md).

| 커밋 | 내용 |
|---|---|
| `872139d` | 설계·계획 |
| `94916e0` | `searchConsole.ts` — URL Inspection API, 상태 분류, 동시 6개 `inspectAll` |
| `fc844cb` | 아티클 표에 색인 ko·en 칸 (`✅ 색인` / `⏳ 미색인` / `❌ 모름` / `–`, 마우스 올리면 상세·크롤링 날짜) |
| `d0bf7f8` | 최종 리뷰 반영 — 전부 같은 이유로 실패하면 표 위 한 줄 안내, 취소 시 남은 조회 중단, 표 가로 스크롤 |

- 같은 브라우저 토큰에 `webmasters.readonly`를 더했다. 서버 없음 유지
- 색인은 로그인 직후 한 번만. 기간 탭 전환에는 다시 부르지 않는다. 48회/로그인, 하루 한도 2,000
- 최종 리뷰(opus)가 잡은 것: 권한·API·범위 중 하나만 빠져도 48칸이 이유 없이 `–`가 된다 — 첫 실행에서 가장 흔할 실패라
  "Search Console 권한이 없습니다…" 한 줄을 띄운다
- 사용자 설정: Search Console API 사용 설정, 데이터 액세스에 `webmasters.readonly`, 로그인 계정이 `https://iaman.kr/` 속성 사용자
- 검증: `pnpm test` 181개, tsc 통과. 브라우저 호출(CORS 포함)은 사람이 확인

## 남은 일

- [ ] localhost에서 로그인 → 카드·표 확인, 기간 탭 전환, GA4 화면의 28일 수치와 대략 일치하는지
- [ ] main 병합 → 배포 후 `https://iaman.kr/admin`에서 같은 확인
- [ ] 색인 칸이 채워지는지, 권한 오류 시 안내 한 줄이 보이는지
- [ ] 화면을 보고 더하거나 뺄 것 정하기 (일별 추이, 기기, 검색 노출·클릭 등)
