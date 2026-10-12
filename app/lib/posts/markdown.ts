/**
 * md 본문을 다루는 공용 유틸.
 *
 * 대표 이미지 추출과 발췌문 생성 둘 다 "코드블록은 빼고 본다"가 필요해서 여기 둔다.
 * 각자 복사해 두면 한쪽만 고쳐졌을 때 두 기능이 다른 기준으로 동작하게 된다.
 */

/**
 * 펜스 줄: 들여쓰기 + ` 또는 ~ 3개 이상 + 나머지(info string 또는 빈 문자열)
 *
 * CommonMark는 최상위에서 들여쓰기를 3칸까지만 허용하지만, **리스트 항목 안에서는
 * 상대 들여쓰기**라 4칸 이상도 정상적인 펜스다. 실제 글에 그런 코드블록이 있고
 * markdown-it도 코드블록으로 렌더한다. 절대 3칸으로 제한하면 그 블록을 본문으로
 * 오인해 발췌문에 코드가 섞인다.
 */
const FENCE_LINE = /^[ \t]*(`{3,}|~{3,})(.*)$/;

/**
 * 코드 펜스 구간을 지운다. 정규식 하나로는 부족해서 줄 단위로 훑는다.
 * CommonMark 규칙을 따른다:
 *  - 여는 펜스는 들여쓰기 최대 3칸, 마커는 ` 또는 ~ 3개 이상
 *  - 닫는 펜스는 같은 문자로 여는 펜스 이상 길이여야 하고 뒤에 내용이 없어야 한다
 *    (그래서 ````로 감싼 안쪽 ```가 블록을 조기에 닫지 않는다)
 *  - 닫는 펜스가 없으면 문서 끝까지 코드로 본다
 */
export function stripFencedBlocks(body: string): string {
  const kept: string[] = [];
  let open: { marker: string; length: number } | null = null;

  // 줄 분리는 인코딩과 무관해야 한다. "\n"으로만 쪼개면 CRLF 파일에서 각 줄 끝에 \r가
  // 남고, FENCE_LINE의 `.`는 \r를 매치하지 않아 펜스가 아예 인식되지 않는다.
  for (const line of body.split(/\r\n|\r|\n/)) {
    const match = FENCE_LINE.exec(line);

    if (open === null) {
      if (match) {
        open = { marker: match[1][0], length: match[1].length };
        continue;
      }
      kept.push(line);
      continue;
    }

    const closes =
      match !== null &&
      match[1][0] === open.marker &&
      match[1].length >= open.length &&
      match[2].trim() === "";

    if (closes) {
      open = null;
    }
  }

  return kept.join("\n");
}
