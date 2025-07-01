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
  const { data, createdAt } = getData;

  return (
    <article className="flex flex-col items-center w-full">
      <CardDateArea createdAt={createdAt} />
      <CardImageArea content={data.content} />
      <CardTitleArea title={data.title.KO} slug={data.slug} />
    </article>
  );
};

export default ArticleCard;
