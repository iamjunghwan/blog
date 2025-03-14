/****************************************
 *
 * ArticleCard : 아티클 카드 컴포넌트
 *
 ****************************************/

import CardDateArea from "./CardDateArea";
import CardImageArea from "./CardImageArea";
import CardTitleArea from "./CardTitleArea";
import { PostData } from "@/type/index";

const ArticleCard = ({ getData }: { getData: PostData }) => {
  const { data, createdAt } = getData;

  return (
    <a href={`/${data.slug}`}>
      <article className="mainArticle">
        <CardDateArea createdAt={createdAt} />
        <CardImageArea content={data.content} />
        <CardTitleArea title={data.title.KO} />
      </article>
    </a>
  );
};

export default ArticleCard;
