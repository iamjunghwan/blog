# iaman Blog

https://iaman.kr/

## Structure

```
content/posts/**/*.md
   ↓
pnpm build          ← 외부 API 호출 없음. 환경변수 없이 빌드된다
   ↓
정적 HTML 생성
   ↓
out/ 폴더 생성
   ↓
Cloudflare Pages ( CDN 업로드 )
```

글은 저장소 안의 md 파일이 유일한 출처다. 예전에는 헤드리스 CMS에서 빌드 타임에 받아왔다 — 전환 내용은 [docs/migration-cms-to-markdown.md](docs/migration-cms-to-markdown.md) 참고.

## Writing

`content/posts/<year>/<month>/<slug>.md` 로 둔다. 연/월 폴더는 그 글의 `date`에서 나온다 (파일명이 아니라 폴더가 날짜를 나타낸다).

```md
---
slug: graphql-study
title: "GraphQL 공부해보기"
date: 2025-06-10
tags: ["graphql"]
draft: false
---

# GraphQL 공부해보기

본문...
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `slug` | O | **공개 URL을 결정한다.** 파일명과 별개 |
| `title` | O | 카드 · 검색 · OG 메타데이터 |
| `date` | O | `YYYY-MM-DD`. 폴더 위치의 근거 |
| `tags` | O | YAML 배열. `all`은 예약어라 쓸 수 없다 |
| `thumbnail` | X | 없으면 본문 첫 이미지 → 그마저 없으면 `/iaman.png` |
| `draft` | X | `true`면 프로덕션에서 숨고 `pnpm dev`에서는 보인다 |

조심할 것:

- **필수값이 빠지면 파일명을 담은 에러로 빌드가 멈춘다.** 글이 조용히 사라지지 않는다.
- **파일은 옮겨도 URL이 안 바뀌지만 `slug`을 바꾸면 바뀐다.**
- **본문 첫 줄의 `# 제목`을 지우지 말 것.** 페이지가 제목을 따로 렌더하지 않고, TOC 삽입 위치도 이 h1을 기준으로 잡는다.
- 이미지는 `public/uploads/YYYY/MM/`에 넣고 `/uploads/...`로 참조한다.

## Command

```
pnpm dev            글 쓰면서 확인. md를 고치면 새로고침만으로 반영된다
pnpm test           콘텐츠 계층 단위 테스트
pnpm build          정적 빌드 -> out/
npx serve out       빌드 결과 확인
```

## Code

```
content/posts/**/*.md    콘텐츠

app/lib/posts/
  parse.ts               md 문자열 -> Post (frontmatter 검증)
  repository.ts          폴더 -> Post[]   · 유일한 파일 읽기 지점
  queries.ts             조회 · 페이지네이션 · 검색 필터 (순수 함수)
  render.ts              md -> HTML (markdown-it -> processHtml)
  thumbnail.ts           대표 이미지 결정
app/lib/processHtml.ts   heading id 부여 + TOC 삽입
app/sitemap.ts           사이트맵
app/robots.ts            robots.txt
```
