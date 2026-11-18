# 글 작업용 Claude skills

**날짜** 2026-11-18
**브랜치** `main`

## 무엇을 했나

글 하나의 흐름(작성 → 영어판 → 공개)을 프로젝트 skill 세 개로 나눴다.
CLAUDE.md는 매 세션 읽히므로 짧게 두고, 작업별 세부 절차는 필요할 때만 로드되는 skill로 뺐다.

```
.claude/skills/
  write-post/SKILL.md       한국어 글 쓰기 — 절차, 구조, 사실 검증
  write-post/style.md       문체 상세 (SKILL.md가 필요할 때 읽는다)
  write-post/thumbnail.md   썸네일 — 글에 맞는 모티프 배정·생성, pnpm thumbnail <slug>
  translate-post/SKILL.md   영어판 — frontmatter 규칙, 옮기는 원칙, 소제목 대응
  publish-post/SKILL.md     공개 체크리스트 — 썸네일 확인, 폰트, test·build, draft 해제, 커밋
```

publish-post는 나머지를 품는 상위 skill이 아니라 **마지막 관문**이다. 만들지 않고 확인만 한다.
빠진 것이 있으면 해당 절차로 돌려보낸다.

## 썸네일 연동

썸네일 그림은 `scripts/thumbnail/registry.ts`가 slug 배정 → 태그 폴백 → `nodes` 순으로 정한다.
그런데 **그림 24종이 글 24편에 하나씩 이미 배정돼 있어서, 태그 폴백은 항상 다른 글과 같은 그림을 고른다.**
`news`·`md`처럼 폴백 목록에 없는 태그는 `nodes`로 떨어져 역시 겹친다. Scion 글도 그래서 `tiers`를 새로 그렸다.

그래서 태그 폴백에 맡기지 않고 **글쓰기의 마지막 단계로 썸네일을 넣었다.** 글 내용을 가장 잘 알 때 그림을 정한다.
처음엔 별도 skill(post-thumbnail)로 뺐다가, 사용자 의견에 따라 write-post의 보조 문서로 합쳤다.

- write-post 6단계 — 핵심 장면을 사용자와 정하고 `thumbnail.md` 절차로 만든다
  (`motifs.tsx` + `registry.ts` 네 줄 → `pnpm thumbnail <slug>` → PNG 확인)
- publish-post 2단계 — 배정과 PNG가 있는지 확인만. 없으면 `thumbnail.md` 절차로 돌려보낸다

| skill | 로드 방식 | 이유 |
|---|---|---|
| write-post | 요청이 맞으면 자동, `/write-post` | 자주 쓰는 작업 |
| translate-post | 요청이 맞으면 자동, `/translate-post <slug>` | 같은 이유 |
| publish-post | **`/publish-post <slug>`로만** (`disable-model-invocation: true`) | 썸네일 재생성·draft 해제·커밋처럼 부작용이 있다 |
## 확인한 사실

- `pnpm thumbnail <slug>`는 같은 slug의 ko·en 두 판 frontmatter를 함께 고친다 (`scripts/thumbnail/main.tsx`).
- 새 글은 `registry.ts`의 `TAG_FALLBACK`으로 임시 그림을 받고, 겹치면 경고가 나온다.
- 폰트 서브셋만 따로 커밋한 이력이 없어 공개 커밋에 함께 넣도록 했다.
- 커밋 메시지 형식은 `git log`의 기존 메시지(`📝 post: … 영어판`, `🚀 post: … 공개`, `🎨 thumbnail: …`)를 따랐다.

## 검증

문서만 추가했다. 실제 글 작업에서 skill이 로드되는지는 다음 글을 쓸 때 확인한다.

## 사용자가 할 일

- 새 세션에서 `/write-post`, `/translate-post`, `/publish-post`가 목록에 뜨는지 확인
- 써 보면서 어긋나는 규칙은 해당 SKILL.md에 바로 고친다
