import * as cheerio from 'cheerio'

/**
 * 제목과 TOC 사이, 날짜·태그가 들어갈 자리.
 *
 * h1이 마크다운 본문 안에 있어서 React를 그 자리에 바로 넣을 수 없다.
 * 대신 표시를 남겨 두고 ArticleContent가 이 지점에서 HTML을 둘로 쪼갠다.
 * 상대 날짜("3일 전")는 브라우저에서 계산해야 해서 문자열로 못 박을 수 없다.
 */
export const META_MARKER = '<!--article-meta-->'

/**
 * 제목 글자를 HTML 텍스트로 안전하게 만든다.
 *
 * 목차는 문자열을 이어붙여 만드는데, 제목에 인라인 코드가 있으면 그 안의 글자가
 * 그대로 섞인다. `` `<img>` 로는 안 되는 이유 `` 같은 제목이 실제로 있었고,
 * 이스케이프가 없어 브라우저가 <img> 를 진짜 이미지 태그로 읽었다 —
 * 목차에 깨진 이미지 자리만 남고 글자가 사라졌다.
 */
function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * @FunctionName : renderTocHtml
 * @description 이 함수는 TOC영역을 만듭니다.
 */
function renderTocHtml(headings: any[]) {
  // 제목을 h2로 두면 본문 h2 취급을 받는다 — globals.css의 호버 밑줄이 붙고
  // ArticleClientActions가 클릭 핸들러까지 단다(눌러도 제자리로 스크롤할 뿐이다).
  // nav에 aria-label을 주면 스크린리더에는 이름이 전해지므로 p로 충분하다.
  let toc = '<nav class="toc" aria-label="Table of contents"><p class="toc-title">TOC</p><ul>'
  for (const h of headings) {
    // 들여쓰기는 인라인 style 대신 class로 넘긴다. 간격을 CSS에서 한 번에 고칠 수 있다.
    toc += `<li class="toc-d${h.depth}"><a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`
  }
  toc += '</ul></nav>'
  return toc
}// end renderTocHtml()


/**
 * @FunctionName : processHtml
 * @description 이 함수는 h1요소 하위에 hr요소 밑에 TOC을 넣습니다.
 * @param html 
 * @returns 
 */
export function processHtml(html: string) {
  const $ = cheerio.load(html)

  const headings: any[] = []

  // h2, h3 id 부여 및 headings 수집
  $('h2, h3').each((_, el) => {
    const text = $(el).text()
    // 꺾쇠는 id에서 뺀다. 조각 식별자(#...)와 속성 안에서 태그처럼 읽혀 깨진다.
    // 따옴표·&는 cheerio가 속성에 넣을 때 제대로 escape하므로 건드리지 않는다 —
    // 건드리면 이미 밖에 나가 있는 앵커 주소가 바뀐다.
    const id = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[<>]/g, '')
    $(el).attr('id', id)

    headings.push({
      depth: Number(el.tagName.replace('h', '')),
      text,
      id,
    })
  })

  const firstH1 = $('h1').first()
  if (firstH1.length) {
    const hr = firstH1.next('hr')
    if (hr.length) {
      hr.after('<div id="toc-area"></div>')
    } else {
      firstH1.after('<div id="toc-area"></div>')
    }
    // 제목 바로 밑에 날짜·태그가 들어갈 자리를 표시해 둔다.
    // 주석을 쓰는 이유는 둘이다 — 쪼개지 않고 그대로 내보내도 화면에 아무것도
    // 남지 않고, 위의 next('hr')가 이미 끝난 뒤라 hr 탐색을 방해하지 않는다.
    firstH1.after(META_MARKER)
  }

  const tocHtml = renderTocHtml(headings)
  const finalHtml = $.html().replace('<div id="toc-area"></div>', tocHtml)

  return {
    headings,
    html: finalHtml, 
  }
}