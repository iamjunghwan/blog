# 글: JavaScript sort 다듬기 · 영어판 · 공개

**날짜** 2026-11-23
**글** `content/posts/ko/2026/11/js-sort-timsort.md`, `content/posts/en/2026/11/js-sort-timsort.md` (`draft: false`)

## 한국어판 다듬기 (사용자 피드백)

- 1절 표: 설명만 있던 예시 두 줄을 실제 코드로 바꿨다
  - `["a2", "b1", "c2", "d1"].sort((x, y) => x[1] - y[1])`
  - `const a = [2, 1]; a.sort() === a`
- `toSorted` 문단을 `sort`와 비교하는 표로 바꿨다. 빈 슬롯 처리(`<1 empty item>` 대 `undefined`)는 Node 24로 확인했다
- 3절 제목 "왜 n log n인가" → "sort의 시간복잡도" (사용자 결정)
- 4절 끝 두 문단을 다시 썼다. "3절의 두 알고리즘"은 틀린 참조여서 고쳤고, 이어지는 5~8절 순서와 V8 버전 기준을 풀어 썼다
- 5절 "내림차순은 왜 엄격한 것만 보나": 뒤집는 이유, 함정, 해결 순서로 다시 썼다. 목록의 "엄격한 내림차순" 글자에 이 소제목 링크를 걸었다
  - 링크 id가 깨지지 않도록 제목에서 따옴표를 뺐다
- "적응형(adaptive)" 문장에 정의를 붙였다
- 정리: `sort` 사용 체크리스트 표를 넣었다
- 전체 검토로 세 곳을 고쳤다: 첫 문장 표기, `slug가`, "이득이다"

## 해 보고 되돌린 것

- 비교 부분 색 박스(인라인 style div): 사용자가 별로라고 해 되돌렸다
  - Tailwind는 `content/`를 읽지 않아서 글 안에서는 클래스를 쓸 수 없다. 인라인 style만 가능하다
- 정리의 객체 배열·배열의 배열 정렬 예시: 넣었다가 되돌렸다

## 영어판

- translate-post 절차대로 만들었다. 구조는 1:1(소제목 30개)
- 3절 제목은 내용에 맞게 "The Time Complexity of Sorting"으로 했다
- `≈`가 폰트 서브셋에 없어 테스트가 실패했다 → `about`, `~`로 바꿨다

## 공개

- 기술 검토(`.local/posts/js-sort-timsort/review.md`)의 지적은 모두 반영되어 있다
- 썸네일 `merge` 모티프가 있다
- `pnpm fonts` → `pnpm test` 185 통과 → `pnpm build` 통과
- ko·en 모두 `draft: false`
