# 맨 위로 버튼 설계

- 날짜: 2026-11-24
- 범위: blog (Next판). blog-vanilla에는 넣지 않는다

## 목적

긴 아티클을 끝까지 읽은 뒤 한 번에 맨 위로 돌아가게 한다.

## 결정 사항

| 항목 | 결정 |
|---|---|
| 페이지 | 아티클 페이지만 (`/<slug>`, `/en/<slug>`). 홈·목록·소개에는 없다 |
| 표시 | 화면 한 높이쯤 내려가면 오른쪽 아래에 떠 있는 버튼이 나타난다. 맨 위 근처에서는 숨는다 |
| 감지 | IntersectionObserver. scroll 이벤트를 듣지 않는다 |
| 이동 | `window.scrollTo({ top: 0, behavior: "smooth" })`. `prefers-reduced-motion: reduce`면 `behavior: "auto"` |

## 구성

```text
components/Article/ArticleContent.tsx   맨 앞에 표식, 끝에 버튼을 둔다
components/Button/ScrollToTopButton.tsx "use client". 감지·표시·이동
components/Icon/ArrowUpIcon.tsx         위에 가로선이 있는 위쪽 화살표(⤒) SVG. 24×24, strokeWidth 1.5, stroke = currentColor (기존 아이콘과 같다)
app/lib/i18n/messages.ts                scrollToTop: ko "맨 위로", en "Back to top"
```

### 감지

- `ArticleContent` 맨 앞에 높이 0짜리 표식(`aria-hidden`)을 둔다. 위치 지정은 하지 않는다 — 글 머리에 그대로 놓인다
- 버튼은 이 표식을 IntersectionObserver(`rootMargin: "100% 0px 0px 0px"`)로 본다. 관찰 영역을 화면 위로 한 높이만큼 늘린 것이라, 표식이 화면 위로 한 높이 넘게 지나가면(`!isIntersecting && boundingClientRect.top < 0`) 보이고, 그 안으로 돌아오면 숨는다
- 표식은 ref로 잡을 수 없는 위치(서버 컴포넌트)라 버튼이 `id`로 찾는다. id는 컴포넌트 파일 안의 상수 하나로 둔다

### 버튼

- `<button type="button" aria-label={messages(lang).scrollToTop}>` 안에 `ArrowUpIcon`만 둔다. 화면에 글자는 없다 — "맨 위로"는 화면 낭독기용 이름이다
- 숨김: `opacity-0 pointer-events-none` + `tabIndex={-1}` + `aria-hidden`. 보임: 반대. 숨어 있을 때 탭 이동에서 빠진다
- 위치·모양: `fixed bottom-6 right-6`, 원형, 작게(모바일에서 본문을 가리지 않게). 라이트·다크 색은 기존 헤더 버튼과 맞춘다
- 전환: opacity transition. `motion-reduce:transition-none`

## 에러 처리

- IntersectionObserver가 없는 브라우저: 버튼을 항상 보인다 (숨기는 쪽보다 안전)
- 표식을 못 찾으면 같은 동작

## 확인

- `pnpm fonts` — "맨 위로"의 새 글자가 서브셋에 들어가야 한다. 폰트 테스트가 검사한다
- `pnpm test` → `pnpm build`
- dev 서버 브라우저 확인: 글 페이지 맨 위에서 버튼 없음 → 내리면 나타남 → 누르면 맨 위 → 다시 사라짐. 다크모드, 모바일 폭, en 글, 키보드 탭 이동, 홈·목록에는 없음

## 범위 밖

- 진행률 표시, 맨 아래로 가기, 다른 페이지 적용
- blog-vanilla 이식 (원하면 따로 한다. 넣지 않으면 비교에서 이 버튼이 차이로 잡힌다)
