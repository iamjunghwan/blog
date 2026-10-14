/****************************************
 *
 * MainArticleItem : 메인의 가로 카드 한 줄
 *
 * 썸네일 왼쪽 + 글 오른쪽. 모바일에서는 썸네일이 위로 올라간다.
 * Posts 목록의 ArticleItem과 합치지 않는다 — 썸네일 위치가 반대고 발췌문 유무가
 * 달라서, 하나로 묶으면 플래그만 늘어난다. 공통 조각은 Card/* atom으로 공유한다.
 *
 ****************************************/

import type { Post } from "@/app/lib/posts/types";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import { excerptOf } from "@/app/lib/posts/excerpt";
import CardImageArea from "@/components/Card/CardImageArea";
import CardDateArea from "@/components/Card/CardDateArea";
import CardTagsArea from "@/components/Card/CardTagsArea";
import CardTitleArea from "@/components/Card/CardTitleArea";
import CardExcerptArea from "@/components/Card/CardExcerptArea";

const MainArticleItem = ({ post }: { post: Post }) => {
  return (
    <li className="border-b border-gray-200 dark:border-gray-800 py-6">
      <article className="flex flex-col sm:flex-row gap-5">
        <CardImageArea
          src={thumbnailOf(post)}
          className="w-full sm:w-56 sm:flex-shrink-0 aspect-[40/21] overflow-hidden rounded-lg"
        />
        {/* min-w-0이 없으면 긴 제목이 flex 칸을 밀어내 썸네일이 찌그러진다. */}
        <div className="flex-1 min-w-0">
          <CardDateArea
            date={post.date}
            className="flex items-center text-sm mb-1"
          />
          <CardTagsArea tags={post.tags} />
          <CardTitleArea
            title={post.title}
            slug={`/${post.slug}`}
            className="flex"
          />
          <CardExcerptArea excerpt={excerptOf(post)} />
        </div>
      </article>
    </li>
  );
};

export default MainArticleItem;
