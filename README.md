# iaman Blog

https://iaman.kr/

## Structure

Next.js
   ↓
pnpm build
   ↓
정적 HTML 생성
   ↓
out/ 폴더 생성
   ↓
Cloudflare Pages ( CDN 업로드 )

## Command

pnpm build
   ↓
npx serve out

## Writing

- 글은 `content/posts/<year>/<month>/<slug>.md` 파일로 둔다. `<year>`/`<month>`는 그 글의 `date` frontmatter에서 나온다 (파일명이 아니라 폴더가 날짜를 나타낸다).
- frontmatter 필수값: `slug`, `title`, `date` (`YYYY-MM-DD`), `tags` (YAML 배열).
- 선택값: `thumbnail` (없으면 본문 첫 이미지, 그마저 없으면 `/iaman.png`), `draft`.
- `all`은 예약어다 — 전체 글 목록 라우트 이름이라 태그로 쓸 수 없다.
- `draft: true`면 프로덕션 빌드에서는 숨고 `pnpm dev`에서는 보인다.
- `slug`이 공개 URL을 결정한다. 파일명과 별개라 파일명을 바꿔도 URL은 안 바뀌지만, `slug`을 바꾸면 URL이 바뀐다.
- 이미지는 `public/uploads/YYYY/MM/`에 넣고 본문에서 `/uploads/...`로 참조한다.

```md
---
slug: graphql-study
title: "GraphQL 공부해보기"
date: 2025-06-10
tags: ["graphql"]
draft: false
---
```

## Features

- 반응형 웹
  - 메인 화면 글들은 최신 5개 글만 보여주기, 윗줄은 아티클 3개 아랫줄은 아티클 2개
  - 640px미만 화면시 헤더 -> 블로그 이름 숨김, 햄버거메뉴 (Posts, about 메뉴) 표시
- 찾기버튼
  - 검색을 이용해 원하는 아티클을 쉽게 찾을 수 있다. (빌드 타임 인덱스, 입력 즉시 반영)
  - 검색 모달 내부에서만 포커스 트랩 가능 (tab, shift+tab)
- 페이지네이션
  - url에 tag/pageNumber 적용하여 사용자가 새로고침 할때도 현재 페이지 유지 가능
- 테마 (RCC)
  - 라이트/다크모드
- 태그
  - tag를 이용해 원하는 태그의 아티클만 보여주기
- 아티클 TOC
  - 아티클 부제목 클릭시 스크롤