import dayjs from "dayjs";
import { ApiItem, ApiResponse } from "@/type/index";
import Link from "next/link";
import Image from "next/image";
import { imgCheck } from "@/app/utils/common";

export default function PostArticle({ data }: { data: ApiResponse }) {
  return (
    <ul className="list-none grid gap-8 mt-8 ">
      {data?.list.map((item: ApiItem, index: number) => (
        <li key={index}>
          <article className=" flex flex-col sm:flex-row justify-start items-start sm:items-center gap-2">
            <div className="w-[400px]">
              <h2 className="text-xl font-semibold mb-2">
                <a
                  className="text-gray-900 dark:text-gray-100 no-underline "
                  href={`/${item.data.slug}`}
                >
                  {item.data.title.KO}
                </a>
              </h2>

              <div className="flex flex-wrap gap-2 mb-2">
                {item.data.tags.split(",").map((tag: string, i: number) => (
                  <Link
                    key={i}
                    href={`/post/${tag}`}
                    className="text-sm text-blue-600 uppercase no-underline"
                  >
                    {tag.trim()}
                  </Link>
                ))}
              </div>

              <time dateTime={item.createdAt} className="text-sm text-gray-500">
                {dayjs(item.createdAt ?? "").format("YYYY-MM-DD")}
              </time>
            </div>

            <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg flex items-center">
              <Image
                src={imgCheck(item.data.content)}
                alt="Post Representative Image"
                width={96}
                height={96}
                className="object-cover rounded-lg"
              />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
