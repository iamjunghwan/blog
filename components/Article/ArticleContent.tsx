import ArticleInteractions from "./ArticleInteractions";
import ArticleMeta from "./ArticleMeta";
import { META_MARKER } from "@/app/lib/processHtml";
import type { Lang } from "@/app/lib/posts/types";

// 폰트는 body의 font-custom을 상속받는다. 여기서 다시 지정하지 않는다.
export default function ArticleContent({
  content,
  date,
  tags,
  lang,
}: {
  content: string;
  date: string;
  tags: string[];
  lang: Lang;
}) {
  // 제목 바로 뒤에서 본문을 둘로 가르고 그 사이에 날짜·태그를 끼운다.
  // 표시가 없으면(마크다운에 h1이 없는 경우) 통째로 하나로 내보낸다.
  const at = content.indexOf(META_MARKER);
  const head = at === -1 ? content : content.slice(0, at);
  const rest = at === -1 ? "" : content.slice(at + META_MARKER.length);

  return (
    <article>
      {/* children으로 넘기므로 아래 조각들은 서버에서 그려진 채로 전달된다. */}
      <ArticleInteractions>
        <div dangerouslySetInnerHTML={{ __html: head }}></div>
        <ArticleMeta date={date} tags={tags} lang={lang} />
        {rest !== "" && (
          <div
            className="article-rest"
            dangerouslySetInnerHTML={{ __html: rest }}
          ></div>
        )}
      </ArticleInteractions>
    </article>
  );
}
