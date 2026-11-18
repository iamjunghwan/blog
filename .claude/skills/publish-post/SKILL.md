---
name: publish-post
description: 이 블로그의 draft 글을 공개하기 전 체크리스트 — 썸네일 생성, 폰트 서브셋, 테스트·빌드, draft 해제, 커밋.
argument-hint: "<slug>"
disable-model-invocation: true
---

# 글 공개하기

대상 slug: $ARGUMENTS

순서대로 진행하고, 단계마다 결과를 사용자에게 짧게 알린다.

## 1. 대상 확인

- `content/posts/ko/**/<slug>.md`와 `content/posts/en/**/<slug>.md`를 찾는다.
- 영어판이 없으면 사용자에게 알린다 (한국어만 공개할지, translate-post를 먼저 할지).
- 기술 검토: `.local/posts/<slug>/review.md`가 있으면 남은 지적이 없는지 본다.
  없거나 지적이 남아 있으면 사용자에게 알리고, 공개를 계속할지 묻는다.
- 짝 일치·영어판 description·썸네일 배정은 4단계 `pnpm test`가 검사한다. 눈으로 다시 보지 않는다.

## 2. 썸네일

글쓰기 단계(write-post)에서 이미 만들었어야 한다. **확인만** 한다.

- `scripts/thumbnail/registry.ts`의 `MOTIF_BY_SLUG`에 이 slug이 있고, frontmatter `thumbnail`의 PNG가 실재하면 통과.
- 빠졌으면 멈추고 사용자에게 알린 뒤, [write-post/thumbnail.md](../write-post/thumbnail.md) 절차로 만든다.
  태그 폴백에 맡기지 않는다 — 폴백 그림은 전부 다른 글과 겹친다.

## 3. 폰트

```bash
pnpm fonts
```

본문에 새 글자가 있으면 서브셋이 갱신된다. 빠뜨리면 다음 단계 테스트가 실패한다.

## 4. 검증

```bash
pnpm test
pnpm build
```

둘 다 통과해야 다음으로 간다. 실패하면 멈추고 원인을 보고한다.

## 5. draft 해제

ko·en 양쪽에서 `draft: true` → `draft: false`.

## 6. 커밋 — 사용자 승인 후에만

변경 내용을 보여 주고 승인을 받은 뒤, 성격별로 나눠 커밋한다:

```
🚀 post: <글 주제> 공개      ← draft 해제 (+ pnpm fonts 결과가 있으면 함께)
```

2단계에서 썸네일을 새로 만들었다면 그 커밋은 thumbnail.md의 형식으로 따로 한다.

푸시는 따로 묻는다.
