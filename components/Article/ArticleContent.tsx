import ArticleClientActions from "./ArticleClientActions";
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
      {/* h2 클릭 핸들러가 이 id 아래를 훑으므로, 쪼갠 조각도 전부 안에 둔다. */}
      <div id="article-content">
        <div dangerouslySetInnerHTML={{ __html: head }}></div>
        <ArticleMeta date={date} tags={tags} lang={lang} />
        {rest !== "" && (
          <div
            className="article-rest"
            dangerouslySetInnerHTML={{ __html: rest }}
          ></div>
        )}
      </div>
      <ArticleClientActions />
    </article>
  );
}
