import dayjs from "dayjs";
import { ApiItem, ApiResponse } from "@/type/index";
import Link from "next/link";

export default function PostArticle({ data }: { data: ApiResponse }) {
  return (
    <ul className="list-none grid items-center justify-center">
      {data?.list
        ? data?.list.map((item: ApiItem, index: number) => (
            <li key={index} className="pt-8 pb-12">
              <article>
                <div className="grid grid-cols-2 gap-2.5 items-baseline max-[500px]:flex max-[500px]:flex-col">
                  <dl>
                    <dd className="text-gray-500">
                      <time dateTime={item.createdAt}>
                        {dayjs(item.createdAt).format("YYYY-MM-DD")}
                      </time>
                    </dd>
                  </dl>
                  <div>
                    <h2>
                      <a href={`/${item.data.slug}`}>
                        <div>{item.data.title.KO}</div>
                      </a>
                    </h2>

                    <div className="flex">
                      {item.data.tags
                        .split(",")
                        .map((tag: string, index: number) => (
                          <Link
                            key={index}
                            href={`/post/${tag}`}
                            className="uppercase text-blue-500 mr-4"
                          >
                            {tag}
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              </article>
            </li>
          ))
        : null}
    </ul>
  );
}
