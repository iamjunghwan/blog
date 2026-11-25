declare module "markdown-it-footnote" {
  /**
   * 각주 문법([^1])을 더하는 markdown-it 플러그인.
   * @types/markdown-it-footnote는 markdown-it 14 타입에 묶여 있어 15가 자체 배포하는
   * 타입과 충돌한다. 여기서 쓰는 만큼만 15 타입으로 적는다.
   */
  import type { MarkdownIt } from "markdown-it";

  export default function footnote(md: MarkdownIt): void;
}
