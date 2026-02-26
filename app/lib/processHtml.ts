import * as cheerio from 'cheerio'

/**
 * @FunctionName : renderTocHtml
 * @description 이 함수는 TOC영역을 만듭니다.
 * @param html 
 * @returns 
 */
function renderTocHtml(headings: any[]) {
  let toc = '<div class="toc"><h2 id=toc>TOC</h2><nav><ul>'
  for (const h of headings) {
    const marginLeft = h.depth === 3 ? 16 : 0
    toc += `<li style="margin-left: ${marginLeft}px;"><a href="#${h.id}">${h.text}</a></li>`
  }
  toc += '</ul></nav></div>'
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