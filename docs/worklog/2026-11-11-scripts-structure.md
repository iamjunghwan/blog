# scripts 폴더 구조 정리

**날짜** 2026-11-11
**브랜치** `main`

## 왜 했나

"scripts 폴더를 보면 하위에 어떤 역할을 하는지 구분이 잘 안 된다"는 지적.
열어 보니 **성격이 다른 세 가지가 평평하게 섞여** 있었다.

```
gen-default-thumbnail.tsx    54줄   일회성 · CLI에 없음
gen-fonts.ts                163줄   pnpm fonts
gen-icons.ts                128줄   pnpm icons
gen-thumbnail.tsx         1,218줄   pnpm thumbnail      ← 폴더의 절반
migrate-from-cms.ts         449줄   끝난 일 (10/12 완료)
new-post.ts                 157줄   pnpm new-post
verify-migration.ts         223줄   끝난 일
```

문제 네 가지:

1. **`gen-` 접두사가 아무것도 구분하지 못한다.** 일곱 중 넷이 달고 있어 정보가
   0이다. 알아야 할 건 "언제 돌리는가"인데 이름이 말해주지 않는다.
2. **끝난 일 672줄(28%)이 현역과 나란히 있다.** 목록 맨 위에 보여 매번
   "이거 지금 쓰는 건가"를 묻게 한다.
3. **`gen-default-thumbnail.tsx` 는 실행 경로가 없다.** package.json 에 없는데
   이름은 `gen-thumbnail` 과 거의 같다. 실제로 "왜 썸네일 스크립트를 또
   만들었냐"는 혼동이 있었다.
4. **한 파일이 1,218줄이다.** 그림 하나를 더하려면 모티프 690줄 한가운데를
   헤집어야 한다.

## 결과

```
scripts/
  README.md              뭘 언제 돌리는지 한 장
  new-post.ts            pnpm new-post
  fonts.ts               pnpm fonts
  icons.ts               pnpm icons
  default-thumbnail.tsx  CLI 아님 — 이유를 README 에 적음
  thumbnail/             pnpm thumbnail
    main.tsx       121줄   실행
    card.tsx        93줄   바탕·빛무리·패널
    registry.ts    158줄   어느 글이 어느 그림·무슨 색
    motifs.tsx     702줄   그림 스물셋
    primitives.tsx 181줄   선·점·상자
    canvas.ts       43줄   치수·색·배율
```

7개 2,392줄 → 11개 1,844줄.

의존 방향이 한쪽이다 — `main → card → registry → motifs → primitives → canvas`.
순환이 없다.

## 쪼개기가 안전했다는 증거

같은 글의 썸네일을 다시 뽑아 **md5 가 같은 것**을 확인했다.

```
쪼개기 전  350bd62e220b3596b9c34a6774c5d22b
쪼갠 후    350bd62e220b3596b9c34a6774c5d22b
```

코드가 하는 일이 바뀌지 않았다는 뜻이다. 구조 리팩토링에서 이것 말고 더 나은
증거는 없다.

## 걸린 것

**숨은 import 하나.** `app/lib/fonts/subset.test.ts` 가
`@/scripts/gen-fonts` 를 import 하고 있었다. 파일명만 바꾸면 테스트가 깨진다.
스크립트는 CLI 전용이라고 넘겨짚기 쉬운데 아니었다.

**셸을 거치며 깨진 정규식.** 분할 스크립트에서 `new RegExp("... " + n + "\b")`
로 단어 경계를 넣었더니 `\b` 가 백스페이스 문자로 해석돼 매치가 전부 실패했다.
`(?![A-Za-z0-9_])` 로 바꿔 백슬래시를 없앴다.

## 딸려 죽은 것 — 같이 지웠다

마이그레이션 스크립트가 사라지면서 읽는 쪽이 없어진 것들이다. 같은 날 바로
정리했다.

- `migration/cms-dump.json` (218KB, CMS 원본 응답 16건) — 폴더째 사라짐
- `turndown`, `@types/turndown`, `turndown-plugin-gfm` — `pnpm install` 로 락파일까지
- `types/turndown-plugin-gfm.d.ts` — 저 패키지에 타입이 없어 두었던 섀도

`cheerio` 는 `app/lib/processHtml.ts` 가 아직 쓰므로 남겼다.

덤프를 지우면서 **CMS 원본 HTML 사본이 저장소에서 사라졌다.** 변환이 무엇을
빠뜨렸는지 대조할 길이 없다. 그래도 지운 이유는 둘 — 대조해줄 스크립트가 이미
없고, memexdata.io 토큰을 폐기하면 어차피 다시 받을 수 없다. 필요하면 git
이력에서 꺼낸다.

## 검증

- `npx tsc --noEmit` 0
- `pnpm test` 117/117
- `pnpm build` 92/92
- `pnpm fonts`, `pnpm icons`, `pnpm thumbnail` 전부 실행 확인
