/****************************************
 *
 * ArticleCard : 아티클 카드 컴포넌트
 *
 ****************************************/

import CardDateArea from "./CardDateArea";
import CardImageArea from "./CardImageArea";
import CardTitleArea from "./CardTitleArea";
import { ApiItem } from "@/type/index";

const ArticleCard = ({ getData }: { getData: ApiItem }) => {
  const { slug, content, title } = getData;

  return (
    <a href={`/${slug}`}>
      <article className="flex flex-col items-center w-full">
        <CardDateArea createdAt={""} />
        <CardImageArea content={content} />
        <CardTitleArea title={title} />
      </article>
    </a>
  );
};

export default ArticleCard;
