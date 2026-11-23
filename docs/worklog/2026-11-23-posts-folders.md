# 깨진 강조 검사 · app/lib/posts 폴더 정리

**날짜** 2026-11-23

## 깨진 `**강조**` 검사

- 문제: 닫는 `**` 앞이 구두점이고 뒤가 글자면(`**파생 데이터(derived data)**로`) 강조가 안 되고 `**`가 그대로 보인다
- 어디에 둘지: agent(Sonnet) 대신 코드 검사로 했다. 문법 문제라 렌더 결과를 보면 정확히 잡히고, 비용이 없다
- `render/emphasis.ts`의 `findBrokenEmphasis`: 렌더한 HTML에서 `pre`·`code`·TOC를 빼고, 블록마다 자기 글자에 `**`가 남았는지 본다
- 검사가 도는 곳
  - hook `check-post.ts`: 글을 고친 직후
  - `content.test.ts`: 모든 글
- 공개된 Scion 글에서 두 곳을 찾아 `<strong>`으로 고쳤다
  - 처음 스캔에서는 한 곳만 보고했다. 두 번째는 첫 번째를 고칠 때 hook이 잡았다
- `/code-review`가 짚은 것: 하위 목록이 달린 항목의 바깥 줄을 건너뛰었다 → 테스트를 먼저 넣고 고쳤다

## app/lib/posts 폴더 정리

평평한 파일 18개를 파이프라인 단계별 폴더로 나눴다.

```text
load/     repository · parse
derive/   excerpt · thumbnail · markdown
query/    queries
render/   render · emphasis
(루트)    types · constants · content.test · __fixtures__
```

- `git mv`로 옮겨 이력을 유지했다
- import 60곳을 스크립트로 바꿨다. tsc, `pnpm test` 191, `pnpm build`가 통과했다
- `CLAUDE.md`, `README.md`, `docs/writing-posts.md`의 경로를 고쳤다
- 지난 계획서·기록의 옛 경로는 당시 기록이라 두었다

## 남은 것

- 일기 초안 `ai-developer-director.md`(draft)와 그 글자로 만든 폰트 서브셋은 글이 확정되면 커밋한다
