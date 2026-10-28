import ArticleClientActions from "./ArticleClientActions";

// 폰트는 body의 font-custom을 상속받는다. 여기서 다시 지정하지 않는다.
export default function ArticleContent({ content }: { content: string }) {
  return (
    <article>
      <div
        id="article-content"
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
      <ArticleClientActions />
    </article>
  );
}
