@AGENTS.md

# iaman 블로그

https://iaman.kr/ — Next.js 16(App Router) + React 19 + Tailwind 3, pnpm.
자세한 문법은 [docs/writing-posts.md](docs/writing-posts.md), 스크립트는 [scripts/README.md](scripts/README.md).

## 아키텍처

```
content/posts/ko|en/**/*.md     글 (유일한 출처, CMS·DB 없음)
        ↓ 빌드 타임에 읽음
app/lib/posts/                  md → Post → HTML
        ↓ generateStaticParams
app/(ko)/ · app/(en)/en/        라우트
        ↓ output: "export"
out/                            정적 HTML → Cloudflare Pages
```

- **완전 정적 사이트.** 서버·API·환경변수 없음. 런타임 데이터 요청도 없다
- **콘텐츠 파이프라인** (`app/lib/posts/`)
  - `load/` 파일 읽기(`repository.ts`, 유일한 fs 접근 지점)와 frontmatter 검증(`parse.ts`, 틀리면 빌드를 멈춘다)
  - `derive/` 본문에서 설명문(`excerpt.ts`)·대표 이미지(`thumbnail.ts`)를 뽑는다
  - `query/` 조회·페이지네이션·검색 필터 (`queries.ts`, 순수 함수)
  - `render/` `render.ts` → `app/lib/processHtml.ts` markdown-it + Prism 렌더, heading id·TOC 삽입. `emphasis.ts`는 깨진 `**` 검사
  - `types.ts` `constants.ts`는 공용, `content.test.ts`는 실제 글 전체 검사
- **라우트** (ko는 루트, en은 `/en` 접두사)
  - `/` 홈, `/<slug>` 글, `/post/<tag>/<page>` 목록 (`all`은 전체), `/about`
- **UI**: `components/pages/`가 페이지 단위, 나머지 `components/*`는 조각
- **i18n**: `app/lib/i18n/` — UI 문구 사전과 언어별 경로
- **스크립트** (`scripts/`): 빌드와 무관하게 손으로 돌린다 — 새 글, 썸네일(next/og), 폰트 서브셋, 아이콘
- **테스트**: `pnpm test` (node:test + tsx). `app/lib/posts/content.test.ts`가 실제 글 전체를 검사한다

## 글 위치

- `content/posts/ko|en/<year>/<month>/<slug>.md` — 폴더가 언어를 정한다
- 같은 slug의 ko·en이 한 쌍. 영어판은 `date`·`tags`·`thumbnail`을 원문과 맞춘다
- 새 글은 `pnpm new-post <slug> "<제목>" <태그> [en]`, `draft: true`로 시작. 공개는 사용자가 정한다
- `slug`을 바꾸면 URL이 깨진다

## 글 쓰기

- 구조: `# 제목`(title과 같게, 하나만) → `---` → 도입 → `## 1. ...` → `## 정리` → `## 참고`
- TOC는 `##`, `###`만
- 문체: `-다`체, 짧은 문장. 도입은 경험이나 숫자로 연다
- 수치는 표, 출력·흐름은 ` ```text `
- 확인한 것만 쓴다. 출처는 `## 참고`에 링크
- 영어판은 직역 말고 자연스럽게, `description`을 꼭 쓴다
- 태그는 기존 것에서 고른다 (`javascript` `react` `typescript` `nextjs` `ai` `news` …)

## 마무리

- 이미지: `public/uploads/<year>/<month>/` → `/uploads/...`
- 썸네일: `pnpm thumbnail <slug>` (slug 꼭 넘기기)
- 새 글자가 들어오면 `pnpm fonts`
- `pnpm test` → `pnpm build`로 확인

## 작업 방식

- 커밋·푸시·공개(`draft: false`)는 사용자 승인 후. 메시지는 `📝 post: ...` 같은 gitmoji + `-다`체
- 끝나면 `docs/worklog/YYYY-MM-DD-<주제>.md`에 기록을 남긴다
- 글 작업의 서브에이전트(`researcher` `article-writer` `technical-reviewer`)는 write-post skill이 정한 조건에서만 부른다
- 기능 개발은 Superpowers skill과 `/code-review`를 쓴다. 글용 에이전트를 쓰지 않는다

## 병렬 작업

- worktree는 기능 개발을 병렬로 할 때만 쓴다 (Superpowers using-git-worktrees). 글 작업은 main에서
- `pnpm fonts`는 main에 합친 뒤에만 돌린다 — 모든 글 기준으로 다시 만들어 브랜치마다 결과가 갈린다
- dev 서버를 동시에 띄우면 두 번째는 `pnpm dev -p 3001`
