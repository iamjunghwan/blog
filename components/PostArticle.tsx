import { ApiItem, ApiResponse } from "@/type/index";
import CardDateArea from "./Card/CardDateArea";
import CardTitleArea from "./Card/CardTitleArea";
import CardTagsArea from "./Card/CardTagsArea";
import CardImageArea from "./Card/CardImageArea";

export default function PostArticle({ data }: { data: ApiResponse }) {
  return (
    <ul className="list-none grid gap-8 mt-8 ">
      {data?.list.map((item: ApiItem, index: number) => (
        <li key={index}>
          <article className=" flex flex-col sm:flex-row justify-start items-start sm:items-center gap-2">
            <div className="w-[400px]">
              <CardTitleArea
                title={item.data.title.KO}
                slug={`/${item.data.slug}`}
                className={`flex`}
              />
              <CardTagsArea tags={item.data.tags} />
              <CardDateArea createdAt={item.createdAt} />
            </div>

            <CardImageArea
              content={item.data.content}
              className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg flex items-center"
            />
          </article>
        </li>
      ))}
    </ul>
  );
}
