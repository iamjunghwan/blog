import * as cheerio from "cheerio";

/**
 * 렌더된 글 HTML에서 강조로 바뀌지 못하고 `**`가 그대로 남은 줄을 찾는다.
 *
 * 닫는 `**` 앞이 구두점이고 뒤가 글자이면(`**파생 데이터(derived data)**로`)
 * CommonMark가 강조로 읽지 않는다. 한국어는 조사가 바로 붙어서 자주 걸리고,
 * 원문을 눈으로 봐서는 티가 안 난다. 그래서 md가 아니라 렌더 결과를 본다.
 *
 * 코드(`pre`, `code`) 안의 `**`는 거듭제곱 같은 정상 코드라 뺀다.
 * TOC 목록(`nav.toc`)은 제목을 한 번 더 찍은 것이라 중복을 피하려고 뺀다.
 */
export function findBrokenEmphasis(html: string): string[] {
  const $ = cheerio.load(html);

  $("pre, code, nav.toc").remove();

  const blocks = "p, li, h1, h2, h3, h4, td, th, blockquote";
  const lines: string[] = [];

  $(blocks).each((_, el) => {
    // 안에 든 블록은 빼고 이 블록 자신의 글자만 본다. 안쪽 블록은 따로 검사되니
    // 같은 줄이 두 번 나오지 않고, 하위 목록이 달린 항목의 바깥 줄도 놓치지 않는다.
    const own = $(el).clone();

    own.find(`${blocks}, ul, ol, table`).remove();

    const text = own.text().trim();

    if (text.includes("**")) {
      lines.push(text);
    }
  });

  return lines;
}
