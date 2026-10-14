import type { Post } from "@/app/lib/posts/types";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import CardDateArea from "../Card/CardDateArea";
import CardTitleArea from "../Card/CardTitleArea";
import CardTagsArea from "../Card/CardTagsArea";
import CardImageArea from "../Card/CardImageArea";

export const ArticleItem = ({ item }: { item: Post }) => (
  <li>
    <article className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div className="w-[400px]">
        <CardTitleArea
          title={item.title}
          slug={`/${item.slug}`}
          className="flex"
        />
        <CardTagsArea tags={item.tags} />
        <CardDateArea date={item.date} />
      </div>
      <CardImageArea
        src={thumbnailOf(item)}
        className="w-48 sm:w-56 aspect-[40/21] flex-shrink-0 overflow-hidden rounded-lg"
      />
    </article>
  </li>
);
