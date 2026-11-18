# Claude Code 훅

**날짜** 2026-11-18
**브랜치** `main`

## 무엇을 했나

"지시로는 부족하고, 실수 비용이 크고, 빠르게 기계 판단이 되는 것"만 훅으로 만들었다.

| 훅 | 파일 | 하는 일 |
|---|---|---|
| `PreToolUse` (Bash) | `.claude/hooks/guard-bash.mjs` | slug 없는 `pnpm thumbnail`, main 밖의 `pnpm fonts`를 실행 전에 막는다 |
| `PostToolUse` (Edit\|Write) | `.claude/hooks/check-post.ts` | 고친 글 파일 하나를 실제 파서로 읽고, 짝의 date·tags·thumbnail 일치를 본다 |
| `SessionStart` (startup) | `.claude/hooks/session-status.mjs` | draft 글과 영어판 없는 글을 알린다. 없으면 출력하지 않는다 |

등록은 `.claude/settings.json`의 `hooks`. 타입 검사를 위해 `tsconfig.json`의 `include`에 한 줄을 더했다.

## 설계 판단

- **check-post는 draft를 보지 않는다.** 번역 중에는 갈리는 게 정상이고, 경고하면 Claude가 맞추려다
  글을 공개해 버릴 수 있다. 공개 시점의 일치는 `content.test.ts`가 본다.
- **check-post는 `parsePost`를 그대로 쓴다.** 규칙이 바뀌어도 훅을 고칠 필요가 없다. tsx로 약 1.5초.
- **session-status는 tsx 없이** frontmatter 두 줄만 정규식으로 읽는다. 세션마다 돌기 때문이다.
- 훅으로 만들지 않은 것: `git push`(settings의 `ask`로 이미 막힘), `draft: false` 차단(공개 절차와 구분 불가),
  응답마다 `pnpm test`(8초, 실패 루프 위험), tsc·lint(Superpowers verification이 맡음).

## 검증

| 경우 | 결과 |
|---|---|
| `pnpm thumbnail` / `pnpm run thumbnail && …` / `npx tsx scripts/thumbnail/main.tsx` / `… \| tail` | 막힘 (2) |
| `pnpm thumbnail <slug>`, `pnpm fonts`(main), `pnpm test` | 통과 (0) |
| 기존 글 ko·en, 글이 아닌 파일 | 통과 (0) |
| 기존 slug에 다른 date·tags인 임시 글 | 짝 불일치 보고 (2) |
| date `2099-1-1`인 임시 글 | 파서 오류 보고 (2) |
| draft만 다른 임시 글 | 통과 (0) |
| session-status, 할 일 없음 / draft 임시 글 | 출력 없음 / 두 줄 보고 |

- 이 세션에서 실제 Write 도구로 임시 글을 만들어 PostToolUse 훅이 짝 불일치를 Claude에게 전달하는 것을 확인했다.
- 테스트 명령 문자열 안의 `pnpm run thumbnail`이 PreToolUse 훅에 실제로 막히기도 했다 (명령 문자열을 보는 방식이라
  `echo pnpm thumbnail`처럼 실행이 아닌 경우도 막힌다 — 드물어서 그대로 둔다).
- **tsconfig에 `.claude/hooks/**/*.ts`를 넣었다.** TypeScript의 `**/*.ts`는 점으로 시작하는 폴더를 건너뛰어
  check-post.ts가 프로젝트 밖 파일로 취급됐다. IDE는 `@types/node`를 못 찾아 `Cannot find name 'node:fs'`를 냈고,
  처음 돌린 `tsc --noEmit`은 이 파일을 아예 검사하지 않고 통과했다. 지금은 `--listFilesOnly`로 포함을 확인했고
  `tsc --noEmit` 통과.
- 임시 글은 모두 지웠다.
