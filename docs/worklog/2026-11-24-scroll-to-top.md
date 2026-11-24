# 맨 위로 버튼

## 한 일

- 아티클 페이지 오른쪽 아래에 맨 위로 버튼(⤒)을 달았다
- `components/Icon/ArrowUpToLineIcon.tsx`, `components/Button/ScrollToTopButton.tsx`를 만들었다
- `ArticleContent`에 표식 div와 버튼을 넣었다
- 문구와 보임 판단은 앞선 작업(12ff978)의 `messages`, `app/lib/scroll/scroll-to-top.ts`를 쓴다

## 방식

- 글 머리의 표식을 IntersectionObserver로 본다. scroll 이벤트는 듣지 않는다
- 관찰 영역을 화면 위로 한 높이 늘려, 표식이 벗어나면 한 화면 넘게 내려온 것으로 본다
- 숨어 있을 때는 투명하고, 탭 이동과 낭독기에서도 빠진다
- 감지할 수 없으면 항상 보인다
- `z-40`이라 메뉴와 검색 모달(`z-50`) 아래에 놓인다

## 확인

- `pnpm test`: 197개 통과
- `pnpm build`: 성공
- 빌드 결과: 글(`out/Oxc.html`, `out/en/Oxc.html`)에는 표식과 `aria-label`이 있고, `index.html`·`about.html`에는 없다
- dev 서버(이미 떠 있던 3000번)에서 글 HTML에는 표식과 버튼이 있고 홈에는 없다

## 아직 안 한 것

- 브라우저 확인은 아직 하지 않았다
  1. 맨 위에서는 버튼이 없다
  2. 한 높이쯤 내리면 ⤒ 버튼이 나타난다
  3. 누르면 부드럽게 올라가고 버튼이 사라진다
  4. 다크모드 색
  5. 모바일 폭(375px)에서 본문을 크게 가리지 않는다
  6. 숨어 있을 때 Tab이 가지 않고 보일 때는 간다
  7. `/en/<글>`에서도 동작한다
  8. 홈·목록·소개에는 버튼이 없다
  9. 검색 모달·메뉴를 열면 버튼이 아래에 깔린다
