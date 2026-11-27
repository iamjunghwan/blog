# 2026-11-27 클로드를 사용한 뒤 느낀 점 — 영어판과 썸네일

## 영어판

- `content/posts/en/2026/11/after-using-claude.md`를 `pnpm new-post ... en`으로 만들었다
- 제목은 "What Changed After I Started Using Claude". `date`·`tags`·`draft`는 원문과 같다
- 4절의 링크는 영어판 `/en/ai-developer-responsibility`로 걸고, 링크 문구를 그 글의 영어 제목에 맞췄다

## 썸네일

- 태그 폴백(`ai` → `nodes`)을 타면 `ai-developer-responsibility`와 같은 그림이 되므로 새 그림을 그렸다
- `Direct` 모티프: 위의 상자(나)가 아래 다섯 결과물로 선을 뻗고, 체크된 것만 아래 막대로 모인다.
  정리의 "방향을 정하고 결과를 확인하는 감독"을 옮긴 장면이다. 색은 `#f0abfc`
- `registry.ts`에 `direct`를 등록하고 `after-using-claude`에 배정했다
- `pnpm thumbnail after-using-claude` → `public/uploads/2026/11/after-using-claude.png`, ko·en frontmatter 갱신

## 확인

- `pnpm test` 205개 통과
