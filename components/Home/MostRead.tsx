/****************************************
 *
 * MostRead : 홈의 많이 읽힌 글 목록
 *
 * 글 목록 페이지와 같은 ArticleItem 을 쓴다 — 날짜·제목·태그·발췌문·썸네일.
 * 따로 모양을 만들면 같은 "글 한 줄"이 사이트 안에서 두 가지로 보인다.
 * 순위 느낌을 줄이려고 번호는 붙이지 않는다. 순서는 content/featured.json이 정한다.
 *
 ****************************************/

import { ArticleItem } from "@/components/PostArticle/ArticleItem";
import type { Lang, Post } from "@/app/lib/posts/types";

interface MostReadProps {
  posts: Post[];
  lang: Lang;
  labelledBy: string;
}

const MostRead = ({ posts, lang, labelledBy }: MostReadProps) => {
  return (
    <ul
      aria-labelledby={labelledBy}
      className="list-none [&>li:last-child>article]:border-b-0"
    >
      {posts.map((post) => (
        <ArticleItem key={post.slug} item={post} lang={lang} />
      ))}
    </ul>
  );
};

export default MostRead;
