import type { Post } from "@/app/lib/posts/types";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import CardDateArea from "../Card/CardDateArea";
import CardTitleArea from "../Card/CardTitleArea";
import CardTagsArea from "../Card/CardTagsArea";
import CardImageArea from "../Card/CardImageArea";

export const ArticleItem = ({
  item,
  priority = false,
}: {
  item: Post;
  priority?: boolean;
}) => (
  <li className="relative -mx-4 px-4 py-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
    <article className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div className="w-full sm:w-[400px]">
        <CardTitleArea
          title={item.title}
          slug={`/${item.slug}`}
          className="flex"
          linkClassName="after:absolute after:inset-0"
        />
        <CardTagsArea
          tags={item.tags}
          className="relative z-10 flex flex-wrap gap-2 mb-2"
        />
        <CardDateArea date={item.date} />
      </div>
      <CardImageArea
        src={thumbnailOf(item)}
        priority={priority}
        className="w-48 sm:w-56 aspect-[40/21] flex-shrink-0 overflow-hidden rounded-lg"
      />
    </article>
  </li>
);
