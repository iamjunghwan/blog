import ArticleClientActions from "./ArticleClientActions";

export default function ArticleContent({ content }: { content: string }) {
  return (
    <article className="font-body">
      <div
        id="article-content"
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
      <ArticleClientActions />
    </article>
  );
}
