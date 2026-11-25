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
import footnote from "markdown-it-footnote";
import { processHtml } from "@/app/lib/processHtml";
import { messages } from "@/app/lib/i18n/messages";
import type { Lang } from "@/app/lib/posts/types";

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
const markdown = new MarkdownIt({ html: true, highlight }).use(footnote);

/** markdown.render에 넘기는 값. 렌더 규칙이 env로 받는다. */
type RenderEnv = { lang: Lang };

/**
 * 각주의 되돌아가기 링크(화살표 기호)에 이름을 단다.
 *
 * 플러그인 기본값은 기호 하나뿐이라 화면 낭독기가 "화살표"로만 읽는다.
 * 렌더 규칙은 모듈에 하나라 글의 언어는 render의 env로 받는다.
 */
const renderFootnoteAnchor = markdown.renderer.rules.footnote_anchor!;
markdown.renderer.rules.footnote_anchor = (tokens, idx, options, env, self) =>
  renderFootnoteAnchor(tokens, idx, options, env, self).replace(
    'class="footnote-backref"',
    `class="footnote-backref" aria-label="${escapeHtml(messages((env as RenderEnv).lang).footnoteBack)}"`,
  );

/**
 * md 본문을 아티클 HTML로 렌더한다.
 * heading id 부여와 TOC 삽입은 기존 processHtml을 그대로 재사용한다.
 * lang은 각주 되돌아가기 링크의 이름에만 쓴다.
 */
export function renderPostBody(body: string, lang: Lang = "ko"): string {
  const env: RenderEnv = { lang };
  return processHtml(markdown.render(body, env)).html;
}
