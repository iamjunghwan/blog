import MarkdownIt from "markdown-it";
import Prism from "prismjs";
// Prism 기본 번들은 markup(html)·css·javascript만 안다. 이 블로그가 실제로 쓸 만한
// 언어를 미리 등록해둔다 — 없으면 색칠이 조용히 안 될 뿐 에러가 나지 않아 눈치채기 어렵다.
// 순서가 의존성을 따른다: tsx는 jsx와 typescript를 필요로 한다.
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import { processHtml } from "@/app/lib/processHtml";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char]);
}

/**
 * 코드블록에 구문 색을 입힌다.
 *
 * `app/globals.css`에 이미 Prism 테마(`.token.*` 색상)가 들어 있다. 예전에는 CMS
 * 에디터가 색칠한 결과를 HTML에 통째로 저장했는데, md로 옮기면서 그 마크업이
 * 평문으로 펴졌다 — 색칠은 저장이 아니라 렌더 시점에 하는 것이 맞다.
 *
 * `<pre>`에도 언어 클래스를 붙인다. globals.css의 배경·패딩 규칙이
 * `pre[class*="language-"]`를 보는데, markdown-it 기본 렌더러는 `<code>`에만 붙여서
 * 코드블록이 배경 없이 본문에 섞여 보인다.
 *
 * 반환값이 `<pre`로 시작하면 markdown-it이 자체 래퍼를 씌우지 않고 그대로 쓴다.
 */
function highlight(code: string, language: string): string {
  const grammar = language ? Prism.languages[language] : undefined;
  const attribute = language ? ` class="language-${escapeHtml(language)}"` : "";
  const body = grammar
    ? Prism.highlight(code, grammar, language)
    : escapeHtml(code);

  return `<pre${attribute}><code${attribute}>${body}</code></pre>`;
}

// html: true — 변환 불가한 블록을 raw HTML로 남기는 전략을 지원한다.
const markdown = new MarkdownIt({ html: true, highlight });

/**
 * md 본문을 아티클 HTML로 렌더한다.
 * heading id 부여와 TOC 삽입은 기존 processHtml을 그대로 재사용한다.
 */
export function renderPostBody(body: string): string {
  return processHtml(markdown.render(body)).html;
}
