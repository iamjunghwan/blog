import { test } from "node:test";
import assert from "node:assert/strict";
import { renderPostBody } from "@/app/lib/posts/render";

test("markdown을 HTML로 렌더한다", () => {
  const html = renderPostBody("# 제목\n\n본문 **강조**");

  assert.match(html, /<h1>제목<\/h1>/);
  assert.match(html, /<strong>강조<\/strong>/);
});

test("h2에 id를 부여한다 (processHtml 재사용)", () => {
  const html = renderPostBody("# 제목\n\n## 소제목\n\n내용");

  assert.match(html, /<h2 id="소제목">소제목<\/h2>/);
});

test("공백이 있는 heading의 id는 하이픈으로 이어진다", () => {
  const html = renderPostBody("# 제목\n\n## Hello World\n\n내용");

  assert.match(html, /<h2 id="hello-world">/);
});

test("h1 뒤에 TOC를 삽입한다", () => {
  const html = renderPostBody("# 제목\n\n## 첫째\n\n### 둘째\n\n내용");

  assert.match(html, /class="toc"/);
  assert.match(html, /<a href="#첫째">첫째<\/a>/);
  assert.match(html, /<a href="#둘째">둘째<\/a>/);
});

test("h1 다음이 hr이면 TOC는 hr 뒤에 온다", () => {
  const html = renderPostBody("# 제목\n\n---\n\n## 소제목\n\n내용");
  const hrIndex = html.indexOf("<hr>");
  const tocIndex = html.indexOf('class="toc"');

  assert.ok(hrIndex !== -1, "hr이 렌더되어야 한다");
  assert.ok(hrIndex < tocIndex, "TOC는 hr 뒤에 와야 한다");
});

test("raw HTML을 그대로 통과시킨다", () => {
  const html = renderPostBody('# 제목\n\n<iframe src="https://example.com"></iframe>');

  assert.match(html, /<iframe src="https:\/\/example\.com"><\/iframe>/);
});

test("펜스 코드블록의 언어를 class로 유지한다", () => {
  const html = renderPostBody("# 제목\n\n```ts\nconst a = 1;\n```");

  assert.match(html, /<code class="language-ts">/);
  assert.match(html, /const a = 1;/);
});

test("pre에도 언어 class를 붙인다", () => {
  // globals.css의 배경·패딩 규칙이 pre[class*="language-"]를 본다.
  // code에만 붙이면 코드블록이 배경 없이 본문에 섞여 보인다.
  const html = renderPostBody("# 제목\n\n```javascript\nconst a = 1;\n```");

  assert.match(html, /<pre class="language-javascript">/);
});

test("코드블록에 구문 색을 입힌다", () => {
  const html = renderPostBody(
    '# 제목\n\n```javascript\nconst a = 1; // 주석\n```'
  );

  assert.match(html, /<span class="token keyword">const<\/span>/);
  assert.match(html, /<span class="token number">1<\/span>/);
  assert.match(html, /<span class="token comment">\/\/ 주석<\/span>/);
});

test("모르는 언어는 색칠 없이 그대로 둔다", () => {
  const html = renderPostBody("# 제목\n\n```rust\nfn main() {}\n```");

  assert.match(html, /<pre class="language-rust">/);
  assert.match(html, /fn main\(\) \{\}/);
  assert.ok(!/class="token/.test(html), "모르는 언어에 토큰이 생기면 안 된다");
});

test("언어 없는 코드블록의 꺾쇠를 이스케이프한다", () => {
  // 색칠 경로를 타지 않으므로 직접 이스케이프해야 한다. 빠뜨리면 코드 예시가
  // 진짜 태그로 파싱되어 화면에서 사라진다.
  const html = renderPostBody("# 제목\n\n```\n<b>태그 예시</b>\n```");

  assert.match(html, /&lt;b&gt;태그 예시&lt;\/b&gt;/);
});

test("markdown 이미지를 img 태그로 렌더한다", () => {
  const html = renderPostBody("# 제목\n\n![대체텍스트](/uploads/a.png)");

  assert.match(html, /<img src="\/uploads\/a\.png" alt="대체텍스트">/);
});
