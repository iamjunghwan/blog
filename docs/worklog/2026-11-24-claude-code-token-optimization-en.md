# Claude Code 토큰 절약 글 영어판과 공개

## 한 일

- `pnpm new-post claude-code-token-optimization "How to Spend Fewer Tokens in Claude Code" ai en`으로 영어판 뼈대를 만들고 본문을 옮겼다. 절·표·코드블록 위치는 원문과 1:1
- 한국어판이 그 뒤 바뀌어(날짜 11-24, 11절에 "새 세션의 시작 상태"·"최근 24시간 사용량" 소절 추가) 영어판을 다시 맞췄다
- 본문 이미지 2장(`/context`, `/usage` 캡처)을 사용자 요청으로 빼고 PNG도 지웠다. 내용은 표가 대신한다
- 11절 두 소절을 technical-reviewer로 따로 검토했다(`.local/posts/<slug>/review.md` 끝 절). 지적 5건을 ko·en에 반영했다
  - "8시간 넘게 이어진 세션" → "요청이 8개 이상의 시간대에 걸친 세션" (원문 "requests in 8 or more separate hours")
  - 비중 설명을 "그 줄의 조건에 해당하는 사용량"으로 좁혔다
  - 합계 39.9k는 화면 표시값, 줄 합은 40.1k(반올림)라고 밝혔다
  - "Fix 1 of 5"가 VS Code 버튼이고 터미널에서는 `f to fix` 힌트라고 설명을 붙였다
- 썸네일: 새 모티프 `Resend`(쌓이는 요청)를 만들어 slug으로 배정했다. 처음엔 태그 폴백(`nodes`)으로 뽑았으나 `ai-developer-responsibility`와 겹쳐 바꿨다
- `pnpm fonts`, ko·en `draft: false`

## 판단

- 사용량 화면 문구("현재 세션(5시간)", "모든 모델 / Fable")는 영어 UI 문구를 확인하지 못해 풀어 썼다
- 영어판 표의 `≤`는 폰트 서브셋에 없어 "up to"로 썼다
- 태그 폴백은 반드시 다른 글과 겹친다. 새 글은 처음부터 새 모티프로 간다

## 확인

- `pnpm test` 191개 통과, `pnpm build` 통과 (`/claude-code-token-optimization`, `/en/claude-code-token-optimization` 생성)
