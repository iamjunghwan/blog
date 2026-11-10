# 본문 글자 크기를 16px로

**날짜** 2026-11-10
**브랜치** `main`

## 왜 했나

"다른 블로그 글들이랑 비교해봤을 때 본문 글씨가 좀 커 보인다"는 지적.
확인해보니 글 레이아웃이 `prose prose-lg`를 쓰고 있었다.

```
.prose-lg   font-size: 1.125rem (18px)  line-height: 1.778
.prose      font-size: 1rem     (16px)  line-height: 1.75
```

기술 블로그 본문은 대개 16~17px이라 한 단계 큰 게 맞았다.

## 같이 움직이는 것 — 단 폭

`prose-lg`를 떼는 것만으로는 안 됐다. `prose`의 `max-width`는 **65ch**,
즉 글자 크기에 비례한다. 그대로 내리면 글씨만 작아지는 게 아니라 본문 단도
70px쯤 좁아져 페이지가 답답해진다.

그래서 `72ch`로 키워 폭을 지켰다.

```
기존   65ch x 18px = 1170
변경   72ch x 16px = 1152     (약 98.5%, 사실상 같다)
```

`h1`(54 → 48px), `h2`(27 → 24px), 코드 블록은 모두 `em` 기준이라 같은 비율로
따라 줄어든다. 손댈 필요가 없었다.

## 변경

| 파일 | 변경 |
|---|---|
| `app/(ko)/[slug]/layout.tsx` | `prose prose-lg` → `prose` |
| `app/(en)/en/[slug]/layout.tsx` | 같음 — 두 언어가 갈리면 안 된다 |
| `app/globals.css` | `.prose { max-width: 72ch }` 추가 |

`72ch` 규칙은 Tailwind의 `65ch`보다 **뒤에** 와야 이긴다. 명시도가 같아
순서로 갈린다. globals.css의 그 자리에 둔 이유다.

낡은 주석도 하나 고쳤다 — `hr` 여백 설명이 "prose-lg 가 위아래 3.11em(약
56px)"이라고 적혀 있었는데 이제 `prose`라 3em(약 48px)이다.

## 검증

- 빌드 CSS에서 `prose-lg` 0건, `.prose{max-width:72ch}`가 `65ch` 뒤에 위치
- 렌더된 HTML `class="prose dark:prose-invert"` (ko·en 양쪽)
- 개발 서버에서 눈으로 확인
- tsc 0, `pnpm test` 117/117, `pnpm build` 92/92
