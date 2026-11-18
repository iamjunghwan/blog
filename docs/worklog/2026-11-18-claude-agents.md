# 글 작업용 서브에이전트와 콘텐츠 검사

**날짜** 2026-11-18
**브랜치** `main`

## 무엇을 했나

장기 운영을 위해 Claude Code 환경을 정리했다. 원칙은 **중복 없이, 필요할 때만, 기계적인 건 테스트로**.

| 파일 | 상태 | 역할 |
|---|---|---|
| `.claude/agents/researcher.md` | 신규 | 공식 자료 조사 → `.local/posts/<slug>/research.md`. sonnet |
| `.claude/agents/article-writer.md` | 신규 | 기존 문체로 본문 작성. opus |
| `.claude/agents/technical-reviewer.md` | 신규 | 작성 맥락 없이 기술 주장 검증 → `.local/posts/<slug>/review.md`. opus |
| `.claude/settings.json` | 신규 | `git push`에 확인 창 강제 |
| `.claude/skills/write-post/SKILL.md` | 수정 | 에이전트를 부르는 조건과 순서 |
| `.claude/skills/publish-post/SKILL.md` | 수정 | review.md 확인, 기계 검사는 `pnpm test`에 맡김 |
| `CLAUDE.md` | 수정 | 에이전트 호출 원칙, 병렬 작업 주의 |
| `app/lib/posts/content.test.ts` | 수정 | 테스트 3개 추가 |
| `scripts/thumbnail/registry.ts` | 수정 | `MOTIF_BY_SLUG`에 `export` (테스트가 읽는다) |

## 설계 판단

- **중복 회피.** Superpowers 6.1.1은 skill만 있고 agent가 없다. 기능 개발(설계·계획·worktree·코드 리뷰)은
  Superpowers와 `/code-review`에 맡기고, 새 에이전트는 **글 전용**으로만 만들었다.
  researcher는 외부 자료만 본다 — 저장소 탐색은 기본 Explore가 한다.
- **필요할 때만.** write-post에 상황별 호출 표를 두었다. 오탈자·영어판에는 에이전트를 부르지 않는다.
- **모델.** 수집 위주인 researcher는 sonnet, 글 품질과 검증 판단이 걸린 writer·reviewer는 opus.
- **토큰.** 에이전트 사이 자료는 `.local/posts/<slug>/`(이미 gitignore) 파일 경로로만 넘긴다.
  reviewer는 지적만 반환하고, writer는 문체 가이드와 최근 글 한 편만 읽는다.
- **독립성.** reviewer는 research.md와 작성 경위를 읽지 않고, 본문을 고치지 않는다.
- **승인.** 공개는 `disable-model-invocation`이 걸린 `/publish-post`로만, 푸시는 settings.json의 `ask`로 도구 차원에서 막는다.

## 추가한 테스트

지금은 사람이 지키지만 깨져도 통과하던 규칙이다.

1. ko·en 짝은 `date`·`tags`·`thumbnail`·`draft`가 같다
2. 공개된 영어판에는 `description`이 있다
3. 공개된 글마다 `MOTIF_BY_SLUG`에 고유한 그림이 배정돼 있다

## 검증

- `pnpm test` — 150개 통과
- 각 테스트가 실제로 잡는지 규칙을 일부러 깨 확인했다 (확인 뒤 원복):
  - 영어판 Scion 글의 date를 하루 바꿈 → 1번 실패
  - 영어판 Scion 글의 description 삭제 → 2번 실패
  - registry에서 Scion 배정 제거 → 3번 실패

## 사용자가 할 일

- 새 세션에서 `/agents`로 세 에이전트가 보이는지 확인
- 다음 글을 쓸 때 write-post 흐름대로 돌려 보고, 어긋나는 규칙은 해당 파일에서 고친다
