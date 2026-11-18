# 썸네일 만들기

write-post의 마지막 단계이자, 썸네일만 새로 만들거나 바꿀 때 따르는 절차다.
생성기 구조는 [scripts/README.md](../../../scripts/README.md)의 `thumbnail/` 절을 먼저 읽는다.

## 원칙 — 글 하나에 그림 하나

그림은 `scripts/thumbnail/registry.ts`의 `motifOf()`가 정한다.

1. `MOTIF_BY_SLUG`에 slug이 있으면 그 그림
2. 없으면 `TAG_FALLBACK`에서 태그로 고른 그림 (위에 있는 태그가 이긴다)
3. 그것도 없으면 `nodes`

**태그 폴백은 임시값이다.** 폴백이 고르는 그림은 전부 이미 다른 글이 쓰고 있어서
새 글이 폴백을 타면 반드시 다른 글과 같은 그림이 된다. 그래서 새 글은 **slug으로 직접 배정**한다.

## 절차

1. **글을 읽고 핵심을 한 장면으로 정한다.** 제목이 아니라 글이 설명하는 구조·동작을 그린다.
   (Scion → 여러 클라이언트가 세 계층으로 내려가는 그림, 증분 검사 → 다시 검사하는 그림)
2. **기존 그림 중 맞는 게 있는지 본다.** `MOTIF_BY_SLUG`를 보면 어떤 글이 어떤 그림인지 나온다.
   이미 다른 글이 쓰고 있으면 재사용하지 말고 3으로 간다.
3. **새 그림을 만든다** — 사용자에게 장면 아이디어를 한두 줄로 먼저 확인받는다.
   - `motifs.tsx` 끝에 함수 하나: `export function <Name>({ accent }: Shape)`
     - 도형은 `primitives.tsx`의 `Line` `Dot` `Box` `Check` `Cross`로만 그린다
     - 좌표는 **360×430 상자 안**. 벗어나면 그림이 가운데에서 밀린다
     - 함수 위 주석에 무엇을 그렸고 왜 그렇게 그렸는지 적는다 (`Tiers` 참고)
   - `registry.ts`에 네 줄: `MotifName` 유니온, `MOTIFS`, `ACCENT`(다른 그림과 겹치지 않는 색), `MOTIF_BY_SLUG`
4. **뽑는다** — slug을 반드시 넘긴다. 인자 없이 돌리면 전체를 다시 그린다.
   ```bash
   pnpm thumbnail <slug>
   ```
   `public/uploads/<year>/<month>/<slug>.png`가 생기고 ko·en 양쪽 frontmatter의 `thumbnail`이 갱신된다.
   출력에 `** <다른 slug> 와(과) 같은 그림`이 보이면 배정이 빠진 것이다.
5. **눈으로 확인한다** — PNG를 Read로 열어 사용자에게 보여 주고, 어색하면 좌표를 고쳐 4를 반복한다.
6. **커밋은 승인 후**, 두 개로 나눈다:
   ```
   ✨ feat: 썸네일에 <그림 이름> 모티프를 더한다   ← motifs.tsx + registry.ts (새 그림일 때)
   🎨 thumbnail: <글 주제>의 대표 이미지           ← png + frontmatter
   ```
