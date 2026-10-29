/****************************************
 *
 * ArticleMeta : 글 제목 바로 밑의 날짜·태그
 *
 * 목록 카드와 같은 부품(CardDateArea·CardTagsArea)을 쓴다. 같은 정보를 두 벌
 * 만들면 한쪽만 고쳐진다 — 상대 날짜 계산이나 태그 링크 규칙이 어긋난다.
 *
 ****************************************/
import CardDateArea from "@/components/Card/CardDateArea";
import CardTagsArea from "@/components/Card/CardTagsArea";
import type { Lang } from "@/app/lib/posts/types";

export default function ArticleMeta({
  date,
  tags,
  lang,
}: {
  date: string;
  tags: string[];
  lang: Lang;
}) {
  return (
    <div className="article-meta">
      <CardDateArea date={date} lang={lang} className="flex items-center" />
      {tags.length > 0 && (
        <CardTagsArea
          tags={tags}
          lang={lang}
          className="flex flex-wrap gap-2"
          linkClassName="text-sm text-blue-600 dark:text-blue-400 uppercase no-underline"
        />
      )}
    </div>
  );
}
