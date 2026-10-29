import * as cheerio from 'cheerio'

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
    toc += `<li class="toc-d${h.depth}"><a href="#${h.id}">${h.text}</a></li>`
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
    const id = text.toLowerCase().replace(/\s+/g, '-')
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
  }

  const tocHtml = renderTocHtml(headings)
  const finalHtml = $.html().replace('<div id="toc-area"></div>', tocHtml)

  return {
    headings,
    html: finalHtml, 
  }
}