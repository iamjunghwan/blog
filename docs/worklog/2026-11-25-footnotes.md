# 각주 플러그인을 붙인다

- 날짜: 2026-11-25
- 설계: `docs/superpowers/specs/2026-11-25-footnotes-design.md`

## 한 일

- `markdown-it-footnote` 4.0.0을 넣었다. 문법은 `문장[^1]` + `[^1]: 설명`, 인라인 `^[설명]`
- 되돌아가기 링크(화살표 기호)에 언어별 `aria-label`을 단다. ko "본문으로", en "Back to content" (`messages.ts`의 `footnoteBack`)
  - 렌더 규칙이 모듈에 하나라 언어는 markdown-it `env`로 넘긴다. `renderPostBody(body, lang = "ko")`
  - `ArticlePage`, `check-post` 훅, `content.test`는 언어를 명시한다
- `processHtml`이 "참고" 아래를 `refs-body`로 감쌀 때 각주 구역(`hr.footnotes-sep`, `section.footnotes`) 앞에서 멈춘다. 각주는 글 맨 끝, 참고 뒤에 붙기 때문이다
- `globals.css`에 각주 스타일(작은 번호, 흐린 목록, 다크모드 색)

## 걸린 것

- `@types/markdown-it-footnote`는 markdown-it 14 타입에 묶여 있어서, 15가 자체 배포하는 타입과 충돌했다. 이 패키지를 빼고 `types/markdown-it-footnote.d.ts`에 직접 적었다
- 주석에 화살표 기호를 그대로 적었더니 폰트 서브셋 테스트가 소스의 글자로 잡았다. 주석은 글로 바꿨다. 실제 화면의 기호는 서브셋에 없어 시스템 폰트로 그려진다

## 확인

- `render.test.ts`에 3개 추가: 각주 링크·목록, 언어별 `aria-label`, `refs-body` 밖에 있는지
- `pnpm test`: 200개 중 199개 통과. 실패 1개는 초안(`next-vs-vanilla-blog`)의 글자 `걷 닐 벼 췄`이 서브셋에 없다는 폰트 테스트로, 각주와는 상관없다
- `tsc --noEmit` 통과, `pnpm build` 통과
- 임시 초안 글로 dev 서버에서 라이트·다크 화면을 봤다. 확인 뒤 지웠다

## 범위 밖

- blog-vanilla 반영. 각주를 쓰는 글이 생기면 그때 `src/lib`에 같은 변경을 옮긴다

## 추가: 각주 말풍선

번호를 누르면 글 아래로 내려가야 해서 읽던 흐름이 끊긴다는 의견으로, 번호 자리에서 내용을 보이게 했다.

- 마우스를 올리거나 키보드로 번호에 가면 연다. 모바일은 탭하면 이동하지 않고 연다. 마우스 클릭과 Enter는 지금처럼 목록으로 이동한다
- 닫기: 마우스가 번호와 말풍선을 떠나면(150ms 뒤), 포커스가 빠지면, Esc, 바깥 탭, 창 크기 변경
- 내용은 글 아래 목록의 `li`를 복제해 되돌아가기 링크만 뺀다. 목록은 그대로 둔다
- `app/lib/footnotes/placement.ts`(위치 계산, 테스트 5개), `components/Article/footnoteTooltip.ts`(DOM 연결), `ArticleInteractions`가 붙이고 뗀다
- 입력 종류는 `pointerdown`에서 기억한다. `click`의 `pointerType`은 브라우저에 따라 비어 있다

확인
- 헤드리스 Chrome(DevTools 프로토콜)으로 hover·떠나기·focus·Esc·탭·바깥 탭을 눌러 봤다. 탭은 스크롤·주소가 그대로였다
- 라이트·다크·모바일(390px) 화면. 오른쪽 끝 번호의 말풍선이 화면 안으로 들어온다
- `pnpm test` 205개 중 204개 통과(실패는 앞과 같은 초안 글자 폰트 테스트), `tsc`·`eslint`·`pnpm build` 통과

글
- `js-sort-timsort`(ko)에 각주 7개를 달아 봤다가 되돌렸다. 글은 커밋된 상태 그대로다
