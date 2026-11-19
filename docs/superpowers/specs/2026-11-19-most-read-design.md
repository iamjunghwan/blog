# 홈 "Most Read" 섹션 설계

**날짜** 2026-11-19
**상태** 승인 대기

## 목표

홈에 많이 읽힌 글 3편을 보인다. 1단계는 수동 큐레이션이다. /admin의 조회수를 보고 사람이 고른다.
목록 파일 형식을 먼저 정해 두고, 나중에는 그 파일을 쓰는 쪽만 바꾼다.

```text
1단계  content/featured.json을 손으로 고친다            ← 이번 범위
2단계  /admin에 "현재 순위로 JSON 복사" 버튼
3단계  GitHub Actions가 매일 GA4를 조회해 자동 커밋
```

화면 코드는 단계가 바뀌어도 그대로다.

## 데이터

`content/featured.json` — slug 문자열 배열. 순서가 순위다. (아래는 형식 예시)

```json
["oxc", "focus-trap", "react-compiler", "nextjs-16"]
```

- 3편보다 길게 적어도 된다. 언어마다 **그 언어판이 있는 글을 앞에서부터 3편** 보인다.
  영어판이 없는 글이 섞여도 en 홈이 3편을 채운다
- ko·en이 같은 목록을 쓴다 (slug이 두 판을 잇는 열쇠다)
- 첫 내용은 사용자가 /admin 90일 순위를 보고 정한다

## 코드

기존 파이프라인 경계를 따른다 — 파일 읽기는 `repository.ts`, 조회는 `queries.ts`의 순수 함수.

| 파일 | 변경 |
|---|---|
| `app/lib/posts/repository.ts` | `FEATURED_FILE`, `loadFeaturedSlugs(file)` — JSON을 읽어 문자열 배열인지 검사, 아니면 던진다(빌드 중단). `featuredSlugs()`는 기본 경로로 부른다 |
| `app/lib/posts/queries.ts` | `featuredPosts(posts, slugs, lang, limit): Post[]` — slug 순서대로 그 언어의 글을 찾고 없으면 건너뛴다, 최대 `limit`편 |
| `components/Home/MostRead.tsx` | 신규 서버 컴포넌트. 작은 썸네일 + 제목 + 날짜 목록. 번호는 붙이지 않는다 |
| `components/pages/HomePage.tsx` | 캐러셀·"전체 글" 링크 아래에 `Most Read` 제목(h2)과 목록. 보일 글이 0편이면 섹션째 숨긴다 |

- 개수는 `HomePage.tsx`의 상수 `MOST_READ_COUNT = 3` 하나로 정한다 (`LATEST_COUNT`와 같은 방식)
- 썸네일은 기존 `thumbnailOf(post)`
- 제목 "Most Read"는 "Latest Articles"처럼 두 언어 공통 영어 문구
- 서버 컴포넌트라 클라이언트 JS가 늘지 않는다
- 파일이 없으면 던진다. 조용히 빈 목록이 되면 섹션이 사라진 걸 눈치채기 어렵다

## 테스트

- `queries.test.ts` — `featuredPosts`: slug 순서 유지, 그 언어판이 없는 글 건너뛰기, `limit`, 빈 목록, 목록에 없는 글 무시
- `repository.test.ts` — `loadFeaturedSlugs`: 정상 배열, 배열이 아님·문자열이 아닌 원소면 던짐 (픽스처 파일)
- `content.test.ts` — 실제 `featured.json`의 slug이 모두 공개된 한국어 글이고 중복이 없다.
  오타·글 삭제·draft 전환을 `pnpm test`가 잡는다
- 화면은 `pnpm dev`로 ko·en 홈을 사람이 확인한다

## 넣지 않는 것

조회수 숫자 표시, 기간 표기("최근 90일"), 2·3단계 자동화. 각각 필요해지면 따로 설계한다.
