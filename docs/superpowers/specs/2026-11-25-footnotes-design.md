# 각주 설계

- 날짜: 2026-11-25
- 범위: blog (Next판). blog-vanilla에는 넣지 않는다

## 목적

본문의 특정 문장에 출처나 곁가지 설명을 번호로 단다. `## 참고`(글 전체가 기댄 자료 목록)를 대신하지 않고 함께 쓴다.

## 결정 사항

| 항목 | 결정 |
|---|---|
| 방법 | `markdown-it-footnote` 플러그인을 그대로 쓰고 주변만 맞춘다 |
| 문법 | `문장[^1]` + `[^1]: 설명`. 인라인 `^[설명]`도 플러그인이 지원한다 |
| 참고 섹션과 분리 | `processHtml`이 "참고" 아래를 `refs-body`로 감쌀 때 `hr.footnotes-sep`, `section.footnotes` 앞에서 멈춘다 |
| 되돌아가기 링크 | 기호(↩︎)는 그대로, `aria-label`을 언어별로 단다. ko "본문으로", en "Back to content" (`messages.ts`의 `footnoteBack`) |
| 언어 전달 | `renderPostBody(body, lang = "ko")`. markdown-it `env`로 렌더 규칙에 넘긴다. 실제 호출부(`ArticlePage`, `check-post` 훅, `content.test`)는 언어를 명시한다 |
| 스타일 | `globals.css`: 본문 번호(`sup.footnote-ref`)는 작게, 각주 목록은 작은 글씨·흐린 색, 구분선은 가는 선. 다크모드 색 포함 |

## 확인

- `render.test.ts`
  - `[^1]`이 본문 링크(`#fn1`)와 각주 목록이 된다
  - 되돌아가기 링크에 언어별 `aria-label`이 붙는다
  - "참고" 섹션 뒤의 각주 목록은 `refs-body` 밖에 있다
- `pnpm test` → `pnpm build`
- dev 서버에서 라이트·다크 화면

## 범위 밖

- blog-vanilla 반영. 각주를 쓰는 글이 생기기 전까지는 비교에서 차이가 나지 않는다

## 추가: 각주 말풍선 (2026-11-25)

번호를 누르면 글 아래로 내려가야 해서 읽던 흐름이 끊긴다. 번호 자리에서 내용을 보여 준다.

| 항목 | 결정 |
|---|---|
| 열기 | 마우스를 올리거나(hover) 키보드로 번호에 가면(focus) 연다. 모바일은 탭하면 연다 |
| 닫기 | 마우스가 번호와 말풍선을 모두 떠나면(짧은 지연), 포커스가 빠지면, Esc, 바깥 탭 |
| 마우스 클릭 | 지금처럼 글 아래 목록으로 이동한다. 탭(touch·pen)일 때만 이동을 막고 말풍선을 연다 |
| 내용 | 글 아래 목록의 그 `li`를 복제해 되돌아가기 링크만 뺀다. 안의 링크는 누를 수 있다 |
| 위치 | 번호 위에 띄우고, 위 공간이 모자라면 아래. 좌우는 화면 안(여백 8px)으로 맞춘다. 문서 좌표(absolute)라 스크롤해도 번호를 따라간다. 창 크기가 바뀌면 닫는다 |
| 접근성 | 말풍선은 `role="tooltip"`, 열린 동안 번호 링크에 `aria-describedby`. 글 아래 목록은 그대로 둔다 (낭독기·JS 없음·인쇄) |
| 구성 | 위치 계산은 순수 함수(`app/lib/footnotes/placement.ts`, 테스트), DOM 연결은 `components/Article/footnoteTooltip.ts`, `ArticleInteractions`가 붙이고 뗀다 |
