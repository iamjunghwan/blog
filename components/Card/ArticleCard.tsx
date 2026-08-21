/****************************************
 *
 * ArticleCard : 아티클 카드 컴포넌트
 *
 ****************************************/

import CardDateArea from "./CardDateArea";
import CardImageArea from "./CardImageArea";
import CardTitleArea from "./CardTitleArea";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import type { Post } from "@/app/lib/posts/types";

const ArticleCard = ({ post }: { post: Post }) => {
  return (
    <article className="flex flex-col items-center w-full">
      <CardDateArea date={post.date} />
      <CardImageArea src={thumbnailOf(post)} />
      <CardTitleArea title={post.title} slug={`/${post.slug}`} />
    </article>
  );
};

export default ArticleCard;
