import MarkdownIt from "markdown-it";
import { processHtml } from "@/app/lib/processHtml";

// html: true — 변환 불가한 블록을 raw HTML로 남기는 전략을 지원한다.
const markdown = new MarkdownIt({ html: true });

/**
 * md 본문을 아티클 HTML로 렌더한다.
 * heading id 부여와 TOC 삽입은 기존 processHtml을 그대로 재사용한다.
 */
export function renderPostBody(body: string): string {
  return processHtml(markdown.render(body)).html;
}
