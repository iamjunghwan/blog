import { localePath } from "@/app/lib/i18n/paths";
import type { Lang, Post } from "@/app/lib/posts/types";
import { thumbnailOf } from "@/app/lib/posts/derive/thumbnail";
import { excerptOf } from "@/app/lib/posts/derive/excerpt";
import CardDateArea from "../Card/CardDateArea";
import CardTitleArea from "../Card/CardTitleArea";
import CardTagsArea from "../Card/CardTagsArea";
import CardImageArea from "../Card/CardImageArea";
import CardExcerptArea from "../Card/CardExcerptArea";

export const ArticleItem = ({
  item,
  lang,
  priority = false,
}: {
  item: Post;
  lang: Lang;
  priority?: boolean;
}) => (
  <li className="relative -mx-4 px-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
    <article className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200 dark:border-gray-800 py-6">
      <div className="w-full sm:w-[400px]">
        <CardDateArea date={item.date} lang={lang} />
        <CardTitleArea
          title={item.title}
          slug={localePath(lang, `/${item.slug}`)}
          className="flex"
          linkClassName="after:absolute after:inset-0"
        />

        <CardTagsArea
          tags={item.tags}
          lang={lang}
          className="relative z-10 mt-2 flex flex-wrap gap-2 mb-2"
        />
        <CardExcerptArea
          excerpt={excerptOf(item)}
          className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400"
        />
      </div>
      <CardImageArea
        src={thumbnailOf(item)}
        priority={priority}
        className="w-48 sm:w-56 aspect-[40/21] flex-shrink-0 overflow-hidden rounded-lg"
      />
    </article>
  </li>
);
