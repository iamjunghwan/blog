# next/og·Satori 글 초안

**날짜** 2026-11-09
**브랜치** `main`
**파일** `content/posts/ko/2026/11/next-og-satori.md` (draft: true)

## 무엇을 했나

사용자가 직접 쓴 초안(next/og·Satori·Yoga·Grid 미지원·Puppeteer 비교)을
받아서 사실 검증 후 아티클로 정리했다.

## 검증한 것

초안의 주장을 믿지 않고 이 저장소의 실제 `next/og`로 렌더해봤다.

| 테스트 | 결과 |
|---|---|
| `display: grid` | **throw** — `Invalid value for CSS property "display". Allowed values: "flex" \| "block" \| "contents" \| "none" \| "-webkit-box". Received: "grid".` |
| `display: flex` + `flexWrap` | OK |
| `display` 없는 div에 자식 2개 | **throw** — `Expected <div> to have explicit "display: flex", "display: contents", or "display: none" if it has more than one child node.` |
| `display: block` + 자식 2개 | 위와 같은 throw (허용 목록에 `block`이 없다) |
| `transformOrigin` | **동작한다** (값을 바꾸면 출력 PNG 해시가 달라짐) |
| 한글 텍스트 | 정상 렌더 |

설치된 버전 체인:

```text
next                16.4.1
└── @vercel/og       1.0.1   (2026-08-08)
    └── satori       0.29.0  (2026-07-23)
```

`node_modules/next/dist/compiled/@vercel/og/` 안에 `yoga.wasm`과 `resvg.wasm`이
그대로 들어 있다.

## 초안에서 고친 것

1. **"Flexbox만 지원"** → 허용 값은 `flex | block | contents | none |
   -webkit-box`다. 다만 실제로 배치해주는 건 `flex` 하나다 (위 표의 네 번째 줄).
2. **"Grid 미지원은 Yoga 때문"** → 맞는 말이었지만 **2026-10-08에 바뀌었다.**
   Satori PR #841이 Yoga를 Rust 기반 **Taffy**로 교체하면서 `display: grid`와
   `display: block`이 들어왔고, Satori **0.37.0**에 릴리스됐다. `yoga.wasm` 대신
   `layout.wasm`을 싣고, breaking change다 (`flex-shrink` 기본값 1 등).
   다만 `@vercel/og` 최신(1.0.3, 2026-09-22)도 그 이전이라 `next/og`로는 아직 막힌다.
   → 이 "버전에 따라 답이 갈린다"를 글의 중심 반전으로 썼다.
3. **동적 OG 생성 전제** → 이 블로그는 정적 export라 빌드 때 한 번 뽑는다.
   동시 요청 비용 논리가 성립하지 않는다는 점을 솔직하게 덧붙였다.
4. **resvg 설명 보강** — Satori와 resvg 둘 다 WASM으로 번들돼 있다는 걸
   실제 디렉터리 목록으로 보였다.
5. **참고 링크 절 추가** — 다른 글의 `## 참고` 관례를 따랐다. Next.js 공식
   `ImageResponse` 문서에 "Advanced layouts (e.g. `display: grid`) will not work"가
   그대로 적혀 있어 본문에도 인용으로 넣었다. 외부 링크 8개는 curl로 200 확인
   (npmjs.com 2개는 봇 차단 403이지만 브라우저에서는 정상).
6. 서두를 "이 블로그 썸네일을 코드로 만들다가 막혔다"는 경험 + 실제 에러
   메시지로 바꿨다.

## Takumi 검증 (추가)

"Satori 말고 Takumi 쓰면 되지 않나"는 질문을 받고 실제로 설치해 같은 테스트를
돌렸다. (`takumi-js@2.20.0` — 스크래치 디렉터리에만 설치했고 이 저장소에는
넣지 않았다.)

| 테스트 | next/og (satori 0.29) | takumi-js 2.20 |
|---|---|---|
| `display: grid` | throw | OK |
| display 없는 div + 자식 2개 | throw | OK |
| `display: block` + 자식 2개 | throw | OK |
| WOFF2 폰트 | throw `Unsupported OpenType signature wOF2` | OK |
| 한글 (폰트 미지정) | OK (시스템 폰트 대체) | **두부** |

속도 — 1200×630 카드(자식 24개) 20장, 워밍업 3장 제외:

```text
next/og   788ms / 757ms   →  39.4ms / 37.9ms 장당
takumi    164ms / 147ms   →   8.2ms /  7.3ms 장당
```

약 5배. SVG를 만들고 다시 파싱하는 왕복이 없는 구조 차이로 설명된다.

**갈아타지 않는 쪽으로 정리했다** (결정은 사용자 몫):

- 썸네일은 빌드 때 몇 장 뽑아 PNG로 커밋한다. 20장에 0.8초냐 0.15초냐는
  체감되지 않는다.
- Takumi는 네이티브 바인딩이라 `node_modules`가 약 15MB 는다. `next/og`는
  Next.js에 이미 들어 있어 추가 의존성이 0이다.
- `@takumi-rs/core` 첫 배포가 2025-06이고 1년 반에 397버전. 아직 어리다.
- 현재 썸네일에는 텍스트가 없어서 WOFF2 지원 이점도 지금은 의미가 없다.

→ 이 비교를 글의 한 절(`## 그럼 Takumi를 쓰면 되지 않나`)로 넣었다.

## Flexbox·Grid 절 추가

"Flexbox만 된다"가 왜 제약인지 설명 없이 넘어가고 있었다. 정의·차이·선택
기준을 한 절로 넣고 `## Grid가 막히는 지점` 앞에 뒀다 — 제약을 느끼려면
Grid가 뭘 해주는지 먼저 알아야 해서다.

담은 내용:

- Flexbox 1차원 / Grid 2차원
- 크기의 출발점이 다르다 — Flexbox는 아이템 내용, Grid는 컨테이너 트랙
- `flex-wrap`으로 줄을 바꿔도 **줄끼리 열을 맞추지 않는다** (벽돌 쌓기).
  takumi로 폭이 제각각인 아이템 6개를 flex-wrap과 grid로 각각 렌더해서
  실제로 어긋나는 걸 확인하고 텍스트 도식으로 옮겼다.
- 상황별 선택 표 8줄
- 실무에선 바깥 Grid · 안쪽 Flex로 겹쳐 쓴다
- 마무리로 이 저장소의 실제 사례 — 6×6 모티프는 Grid 문제였고, 막히니
  `position: absolute` + 좌표 계산으로 풀었다. 가운데 정렬을 직접 계산하다
  11px 밀린 버그도 Grid였으면 없었을 것이라고 연결했다.

절을 끼우면서 `## Grid가 막히는 지점`의 도입부가 두 절 앞을 가리키는
비연결이 돼서 다시 썼다.

## 전체 검증 패스 (2차)

글 전체를 문장 단위로 훑으며 주장마다 근거를 확인했다. 확인한 것 중 **7개가
사실과 달랐고 전부 고쳤다.** 1개는 사용자 확인이 필요해 남겨뒀다.

### 고친 것

1. **"Satori와 resvg 둘 다 Rust로 짜인 코드를 WASM으로 컴파일"** — 틀렸다.
   `vercel/satori`의 GitHub 언어는 **TypeScript**다. WASM으로 들어가는 건
   레이아웃(Yoga, **C++**)과 래스터화(resvg, **Rust**) 둘뿐이다.
   (`react/yoga` 언어 통계: C++ 3,473,578 바이트로 1위)
   → 세 가지 출신을 표로 정리하는 쪽으로 다시 썼다. 오히려 더 좋은 디테일이다.
2. **Takumi의 Blink 범위를 과장했다** — "Blink에서 가져온 구현을 쓴다, 그래서
   Flexbox·Grid·block·float·table·inline이 다 들어 있다"고 썼는데, 공식 문서는
   산문에서 **텍스트·인라인 레이아웃**에 한정해 Blink를 말한다. 기능표는 더
   넓은 범위를 Blink에 귀속시켜 모호하다. 모호하다는 사실까지 적었다.
3. **"Takumi가 내건 2~10배"** — 출처가 없다. Takumi 공식 비교 문서는 배수를
   내걸지 않는다 (정성적 서술만). 2차 출처에서 흘러든 숫자였다.
   → 내가 잰 5배만 남기고, 측정 조건(윈도우 노트북·이 도형 구성·1회)을 밝혔다.
4. **"썸네일 모티프는 6×6…"** — 이 글의 썸네일이 아니라 **직전 글(증분 타입
   검사)**의 모티프다. 어느 글인지 특정했다.
5. **Pretendard 서브셋 "218KB"** — 글자가 늘어 219KB가 됐다. 고정 수치 대신
   "220KB 남짓"으로 바꿨다. 글이 늘면 또 틀리기 때문.
6. **Puppeteer 비교표가 `Satori` 단독 열** — 바로 앞 문장이 "Satori든 Takumi든"
   인데 표는 Satori만 가리켰다. 열을 `Satori · Takumi`로 바꾸고 CSS 지원·서버
   환경 두 칸을 Takumi까지 맞게 고쳤다. 100개 동시 요청 문단도 같이.
7. **디렉터리 트리** — 11개 항목 중 5개만 보여주면서 생략 표시가 없었다. `...` 추가.

### 확인했고 맞았던 것

- 에러 메시지 2개 — 실제 렌더 출력과 글자 단위로 일치
- Next.js 공식 문서 인용문 — `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md`와 일치
- PR #841 제목·머지일(2026-10-08)·릴리스 버전(0.37.0)·`layout.wasm`·`flex-shrink: 1`
- 버전 체인 next 16.4.1 → @vercel/og 1.0.1(2026-08-08) → satori 0.29.0(2026-07-23)
- `@vercel/og` 1.0.3이 2026-09-22로 Taffy 교체 이전
- "두 달 반 앞선" — 07-23 → 10-08 계산 맞음
- Yoga = Meta, React Native가 쓴다
- 본문 `at()` 코드 — `scripts/gen-thumbnail.tsx:331-334`와 일치
- "11px 밀린 적이 있다" — SPAN 382 vs 캔버스 360, 초과 22px의 절반. 맞음
- `@vercel/og`가 시스템 폰트를 찾는다는 주장 — 번들에 `FontDetect`·`SystemFont`
  심볼이 실제로 있다
- `flex-wrap`이 줄끼리 열을 안 맞춘다 — takumi로 양쪽 렌더해 눈으로 확인
- "CSS Grid가 나온 지 10년이 다 된" — Chrome 57(2017-03) 기준 9년 8개월
- takumi 타입 정의의 "compatible with `next/og`'s `ImageResponse`" 문구
- 외부 링크 전부 200 (npmjs.com만 봇 차단 403)

### 남긴 것 — 사용자 확인 필요

**서두가 실제 경험이 아니다.** "평소 쓰던 대로 `display: grid`를 적었다, 그리고
빌드가 멈췄다"고 썼는데, `scripts/gen-thumbnail.tsx`는 처음부터
`position: absolute`로 짜여 있고 git 기록에도 grid를 시도한 흔적이 없다.
에러 자체는 내가 재현해 확인한 진짜지만, "내 빌드가 멈췄다"는 사건은 내가
지어낸 것이다. 사용자 초안의 실제 출발점은 "썸네일을 고민하던 도중 Satori를
알게 되었다"였다.

→ **확인 결과 겪지 않았다. 3차 패스에서 전부 제거했다.**

## 지어낸 서사 제거 (3차)

사용자 확인 결과 **`display: grid`를 적었다가 막힌 적 없음.** "격자를 짜려다
Grid가 막혀 있는 걸 알았다"도 사실이 아님. 관련 서술을 전부 들어냈다.

### 지운 것

1. **서두** — "평소 쓰던 대로 `display: grid`를 적었다. 그리고 빌드가 멈췄다"
   → 초안의 실제 출발점("썸네일을 고민하다 Satori를 알게 됐다")으로 되돌리고,
   훅은 Next.js 공식 문서의 `will not work` 한 줄로 바꿨다. 지어낸 사건 없이
   같은 질문("왜 못 쓰나")에 도달한다.
2. **`### 내가 필요했던 건 어느 쪽이었나` 소절 통째로 삭제** — 6×6 모티프,
   `at()` 코드, `position: absolute`, 11px 밀림까지. 개별 사실은 맞지만
   **"Grid가 막혀서 좌표를 직접 계산했다"는 인과가 지어낸 것**이다. 스크립트는
   처음부터 절대좌표로 작성됐지 Grid를 시도했다 물러난 게 아니다.
3. **`## Grid가 막히는 지점` 도입부** — 지운 소절을 가리키던 "좌표를 직접
   계산한 건 어쩔 수 없어서였다" 제거.
4. **에러 메시지의 프레이밍** — "그래서 아까 그 에러 메시지가 나온다"(= 내가
   겪은 것)를 "문서만 믿지 말고 실제로 렌더해봤다"(= 확인 삼아 돌린 것)로
   바꿨다. 이게 실제로 한 일이다.

### 함께 맞춘 것

- Flexbox·Grid 절 끝에 한 줄 다리 추가 — 소절이 빠져 글과의 연결이 끊겨서.
  "Flexbox만 된다"가 왜 뼈아픈지를 경험담 없이 설명한다.
- 정리의 "둘 다 WASM으로 번들돼 있다" → 2차 수정(Satori=TypeScript)과 어긋나
  바로잡음.
- 정리의 "Blink의 레이아웃을 쓴다" → 본문에서 이미 범위를 좁혔으므로 맞춤.
- Pretendard 서브셋 용량 수치 제거 — 글자가 늘 때마다 218~219KB를 오간다.

구조: h2 9개 / h3 5개 (소절 하나 감소), 404줄.

## 검증

- `pnpm fonts` — 서브셋 218KB / 1501자 (한글 771자)
- `pnpm test` — 117/117 통과
- `pnpm build` — 성공 (draft라 페이지는 안 늘어남)
- 마크다운 강조 깨짐 — 본문 렌더 후 코드블록 제외 리터럴 `*` 0건 (링크 31개, 표 5개, 인용 2개, h2 9개, h3 5개 정상 렌더)

## 남은 것

- `draft: true` 상태다. 공개하려면 그 줄을 지운다.
- 썸네일 없음. `scripts/gen-thumbnail.tsx`에 모티프를 추가하고
  `pnpm thumbnail next-og-satori`를 돌려야 한다.
- 영어판 없음.
- Takumi 전환은 보류. 요청마다 이미지를 만들거나 Grid·WOFF2가 필요해지면 재검토.
