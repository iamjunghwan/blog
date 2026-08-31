# 글 쓰는 방법

README의 `## Writing`이 요약이라면, 이 문서는 **막힐 때 찾아보는 곳**이다.
마크다운 문법이 이 블로그에서 어디까지 되는지, 무엇이 안 되는지를 실제로 확인해 적었다.

---

## 새 글 만들기

```bash
pnpm new-post <slug> "<제목>" <태그,태그>
pnpm new-post use-hook "React 19의 use 훅" react,javascript
```

오늘 날짜로 `content/posts/<year>/<month>/<slug>.md`를 만들고 frontmatter를 채운 뒤
`draft: true`로 열어둔다. 다음은 미리 막는다:

- slug 형식 (영문·숫자로 시작, 영문·숫자·하이픈만)
- 예약어 `all` (slug·태그 양쪽)
- 태그 누락
- 기존 글과의 slug 충돌 — 실제 파서로 읽어서 검사한다
- 같은 경로에 파일이 이미 있는 경우

직접 만들어도 된다. 아래 규칙만 지키면 된다.

## frontmatter

```markdown
---
slug: use-hook
title: "React 19의 use 훅"
date: 2026-08-31
tags: ["react", "javascript"]
draft: true
---
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `slug` | O | 공개 URL (`iaman.kr/use-hook`). 파일명과 독립 |
| `title` | O | 카드 · 검색 · OG 메타데이터 |
| `date` | O | `YYYY-MM-DD`. 폴더 위치의 근거 |
| `tags` | O | YAML 배열. `all`은 예약어 |
| `thumbnail` | X | 생략 시 본문 첫 이미지 → 없으면 `/iaman.png` |
| `draft` | X | `true`면 프로덕션에서 제외, `pnpm dev`에서는 보인다 |

**필수 필드가 빠지면 파일명을 담은 에러로 빌드가 멈춘다.** 글이 조용히 사라지지 않는다.

## 파일 위치

```
content/posts/<year>/<month>/<slug>.md
```

연/월 폴더는 **`date` frontmatter에서 나온다** (파일명이 아니다). 날짜를 고치면 폴더도 옮겨야 짝이 맞는다 — 안 옮겨도 사이트는 정상 동작하지만 정리 상태가 어긋난다.

`slug`이 URL이므로 **파일을 옮기는 건 안전하고, `slug`을 바꾸면 URL이 깨진다.**

---

## 쓸 수 있는 문법

전부 실제로 렌더해 확인한 것이다.

| 문법 | 결과 |
|---|---|
| `## 소제목` / `### 하위` | **목차(TOC)에 자동 등록** |
| `#### 4단계` | 렌더는 되지만 **TOC에 안 들어간다** (id도 안 붙는다) |
| `**굵게**` `*기울임*` `~~취소선~~` | 그대로 |
| `` `인라인 코드` `` | 그대로 |
| `- 목록` (들여쓰기로 중첩) | 중첩 목록 |
| `1. 번호` | 번호 목록 |
| `> 인용` | 인용문 |
| `\| 표 \|` | 표 |
| `[링크](url)` `![그림](/경로)` | 그대로 |
| `---` | 구분선 |
| ` ```언어 ` | 코드블록 (색칠) |
| `<div>raw HTML</div>` | 그대로 통과 |

### 본문 첫 줄의 `# 제목`

**지우지 말 것.** 페이지가 제목 엘리먼트를 따로 렌더하지 않아서 이 h1이 화면의 제목이고,
목차 삽입 위치도 이 h1을 기준으로 잡는다. frontmatter의 `title`은 카드·검색·메타데이터용이라
역할이 다르다.

### 목차

`##`와 `###`만 목차에 들어간다. `####`부터는 안 들어간다.
목차는 h1(과 바로 뒤 `---`) 다음에 자동 삽입된다.

---

## 코드블록

````markdown
```javascript
const greeting = "안녕하세요";
```
````

**색칠되는 언어** (확인함):

`javascript` `js` · `typescript` `ts` · `tsx` `jsx` · `json` · `bash` `sh` `shell` · `html` `xml` `svg` · `css`

**그 밖의 언어**(`python`, `go`, `rust`, `yaml` 등)는 **에러 없이 색칠만 안 된다.** 배경 박스와 고정폭 글꼴은 그대로 적용된다.

필요한 언어가 생기면 `app/lib/posts/render.ts` 상단에 한 줄 추가하면 된다:

```ts
import "prismjs/components/prism-python";
```

언어를 안 적으면(` ``` `만) 색칠하지 않고 꺾쇠만 이스케이프한다 — 태그 예시를 안전하게 넣을 수 있다.

---

## 이미지와 동영상

`public/uploads/<year>/<month>/`에 넣고 `/uploads/...`로 참조한다.

```markdown
![설명](/uploads/2026/08/screenshot.webp)
```

- **본문 첫 이미지가 목록 카드의 썸네일이 된다.** 다른 걸 쓰려면 frontmatter에 `thumbnail`을 적는다.
- 코드블록 안의 이미지 문법은 썸네일 후보에서 제외된다.
- 동영상은 raw HTML로 넣으면 된다:

```html
<video controls width="500"><source src="/uploads/2026/08/demo.mov"></video>
```

---

## 확인하고 올리기

```bash
pnpm dev      # http://localhost:3000/<slug> — 저장하면 새로고침으로 반영된다
pnpm test     # 콘텐츠 계층 + 실제 글 회귀 테스트
pnpm build    # 정적 빌드. frontmatter가 잘못되면 여기서 멈춘다
```

`pnpm dev`가 캐시를 쓰지 않으므로 md를 고치고 새로고침하면 바로 보인다.
다 썼으면 `draft: true`를 지우거나 `false`로 바꾸고 커밋한다.

---

## 자주 걸리는 것

**글을 썼는데 목록에 안 보인다**
`draft: true`가 남아 있는지 본다. 프로덕션 빌드에서는 draft가 빠진다.

**빌드가 멈춘다**
에러 메시지에 파일명이 들어 있다. frontmatter 필수 필드 누락, `date` 형식(`YYYY-MM-DD`), `tags`가 배열인지, `all`을 태그로 쓰지 않았는지 확인한다.

**목차에 소제목이 안 나온다**
`####` 이하는 목차에 안 들어간다. `##`나 `###`으로 바꾼다.

**코드에 색이 안 입혀진다**
지원 언어인지 확인한다(위 목록). 언어를 안 적었을 수도 있다.

**표가 이상하게 나온다**
표 앞뒤에 빈 줄이 있어야 한다. 마크다운 표는 헤더 행과 `|---|` 구분 행이 필요하다.

**강조가 `**`째로 보인다**
닫는 `**` 바로 앞이 구두점이고 바로 뒤가 글자면 CommonMark가 강조로 보지 않는다
(`**...(...)**입니다`). 닫는 기호 뒤에 공백을 넣거나 `<strong>...</strong>`을 쓴다.

**한글 제목의 앵커 링크가 이상하다**
목차 링크는 제목 텍스트를 소문자화하고 공백을 하이픈으로 바꿔 만든다. 한글은 그대로 쓰이며 정상 동작한다.

---

## 참고

- 마이그레이션 경위와 알려진 한계: [migration-cms-to-markdown.md](migration-cms-to-markdown.md)
- 렌더 파이프라인: `app/lib/posts/render.ts` → `app/lib/processHtml.ts`
- 실제 글을 대상으로 하는 회귀 테스트: `app/lib/posts/content.test.ts`
