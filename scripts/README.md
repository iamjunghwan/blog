# scripts

손으로 돌리는 도구들. 빌드가 부르지 않으므로 필요할 때 직접 실행한다.

| 명령 | 하는 일 | 언제 돌리나 |
|---|---|---|
| `pnpm new-post <slug> "<제목>" [태그] [ko\|en]` | 글 뼈대를 만든다 | 새 글을 시작할 때 |
| `pnpm thumbnail [slug]` | 대표 이미지(og:image)를 그리고 frontmatter를 갱신한다 | 글을 공개하기 전 |
| `pnpm fonts` | 본문 폰트에서 실제로 쓰는 글자만 남긴다 | 글에 새 글자가 들어왔을 때 |
| `pnpm icons` | `public/iaman.png`에서 파비콘을 뽑는다 | 로고를 바꿨을 때 |

위 넷은 `package.json`에 등록돼 있다. 아래 하나는 아니다.

| 파일 | 하는 일 |
|---|---|
| `default-thumbnail.tsx` | 썸네일이 없는 글이 쓰는 대체 이미지 한 장. `npx tsx scripts/default-thumbnail.tsx <출력경로.png>` 로 직접 돌린다. 결과물은 `public/default-thumbnail.png` 하나뿐이라 CLI에 두지 않았다. |

## `pnpm fonts` 를 빠뜨리면

`app/lib/fonts/subset.test.ts` 가 매니페스트와 본문 글자를 대조해 실패시킨다.
조용히 넘어가지 않는다 — 빠뜨린 글자는 OS 기본 글꼴로 빠져 한 문단 안에서
글꼴이 섞인다.

## thumbnail/

대표 이미지 생성기만 폴더다. 그림이 스물셋이라 한 파일로 두면 1,200줄이 된다.

```
thumbnail/
  main.tsx         실행 — 글 목록을 돌며 PNG를 쓰고 frontmatter를 고친다
  card.tsx         카드 — 바탕·빛무리·유리 패널. 그림이 무엇이든 똑같다
  registry.ts      배정 — 어느 글이 어느 그림을 쓰고 무슨 색인가
  motifs.tsx       그림 스물셋. 모두 360x430 상자 안에 그린다
  primitives.tsx   선·점·상자. 좌표 환산도 여기서 끝낸다
  canvas.ts        치수와 색, 배율 함수 s() 와 m()
```

의존 방향은 한쪽이다. `main → card → registry → motifs → primitives → canvas`.

**새 그림을 더하려면** `motifs.tsx` 끝에 함수를 하나 쓰고 `registry.ts` 에 네
줄을 더한다 — 이름(`MotifName`), 함수(`MOTIFS`), 색(`ACCENT`), 어느 글이 쓸지
(`MOTIF_BY_SLUG`). 그림이 겹치면 `pnpm thumbnail` 이 경고한다.

**좌표는 360x430 안에 둔다.** 벗어나도 잘리지는 않지만 그림이 가운데에서
밀린다. 실제로 격자를 382로 잡아 11px 밀린 적이 있다.

**`pnpm thumbnail` 을 인자 없이 돌리면** 44장을 전부 다시 쓴다. 지금은 배경
글로우가 잘리는 문제가 있어 옛 PNG가 더 매끄러우므로, 한 글만 뽑을 때는 slug
을 넘긴다. 자세한 내용은
[2026-11-09 작업 기록](../docs/worklog/2026-11-09-next-og-satori-post.md).
