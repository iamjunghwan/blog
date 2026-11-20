# 글: JavaScript sort는 어떻게 정렬할까

**날짜** 2026-11-20
**글** `content/posts/ko/2026/11/js-sort-timsort.md` (`draft: true`, 미커밋 — 사용자 요청으로 운영 배포 보류)

## 진행

1. `pnpm new-post js-sort-timsort` (main)
2. 조사(researcher) 2회 — 스펙·V8 블로그·`array-sort.tq`(main, TimSort 시절 `ae348e30`)·`listsort.txt`(main, 3.9)·de Gouw 2015
3. 초안(article-writer) → 다듬기 → 기술 검토(technical-reviewer) → 구조 재작성(article-writer)
4. 썸네일: 새 모티프 `Merge` (정렬된 run 두 개가 하나로 합쳐지는 막대, 왼쪽 run은 채움·오른쪽은 테두리)
5. `pnpm fonts` — 새 글자 11자, `pnpm test` 185 통과, tsc 통과

로컬 실측(Node 24.18.0 / V8 13.6): `.local/posts/js-sort-timsort/local-check.md`

## 조사에서 바뀐 것

- **V8은 이제 TimSort가 아니다.** Node 블로그(26→27 alpha)와 현재 `array-sort.tq` 기준 PowerSort.
  CL 7742184, 2026-04 main 병합. 글은 "TimSort 본문 + PowerSort 마지막 절"로 정했다 (사용자 승인)
- 스택 규칙 `|A|>|B|+|C|`, `|B|>|C|`와 minrun 상위 6비트 계산은 옛 `listsort.txt`(3.9)에만 있다
- V8 TimSort 시절 `MergeCollapse`는 네 run까지 검사 — 2015년 버그를 고친 형태
- `(a,b) => a > b`가 V8 7.0에서 깨졌다는 공식 자료는 없다 → MDN의 "엔진마다 다르다" + 로컬 결과(정렬 안 됨)

## 기술 검토가 잡은 것

- galloping 예시가 "미리 잘라내기"에서 전부 잘려 병합이 안 일어나는 입력이었다 → 겹치는 run으로 교체
- 삽입 정렬만 쓰는 길이: TimSort 시절 64 미만, **현재 V8은 16 미만**(`kMaxInlineSortLength`)
- "32~64는 실험값"은 과장 — 실험은 16~128이 비슷, 범위는 계산식에서
- PowerSort가 작은 배열을 빠르게 했다는 건 별도 변경(Maglev·Turbofan 인라인)
- "순수 병합 정렬은 입력과 무관하게 n log n 근처" → 실측(정렬 4,932 / 무작위 8,697)으로 정정
- ES2019 출처는 MDN, V8 문서는 Chrome 70

## 사용자 피드백

- "minrun을 먼저 말하고 아래서 설명해 매끄럽지 않다" → 용어를 처음 나오는 곳에서 설명하도록 재구성.
  run 찾기 → minrun(왜·삽입 정렬·실험·계산식) → 스택 규칙 → 병합 세부 → 열 장 예제(복습) 순

## 남은 일

- [ ] 사용자 검토 후 커밋: `📝 post: JavaScript sort 내부 동작` / `✨ feat: 썸네일에 Merge 모티프를 더한다` / `🎨 thumbnail: JavaScript sort의 대표 이미지` / 폰트 서브셋
- [ ] 영어판(translate-post), 공개 여부는 사용자가 정한다
