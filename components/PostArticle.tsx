import dayjs from "dayjs";
import { ApiItem } from "@/type/index";
import Link from "next/link";
import Image from "next/image";
import { check } from "@/app/utils/common";

export default function PostArticle({ data }: { data: ApiItem[] }) {
  return (
    <ul className="list-none grid gap-8 mt-8">
      {data?.map((item: ApiItem, index: number) => (
        <li key={index}>
          <article className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-2">
            <div className="w-[400px]">
              <h2 className="text-xl font-semibold mb-2">
                <a href={`/${item.slug}`}>{item.title}</a>
              </h2>

              <div className="flex flex-wrap gap-2 mb-2">
                {item.tag.split(",").map((tag: string, i: number) => (
                  <Link
                    key={i}
                    href={`/post/${tag}`}
                    className="text-sm text-blue-600 uppercase hover:underline"
                  >
                    {tag.trim()}
                  </Link>
                ))}
              </div>

              <time dateTime={item.createdAt} className="text-sm text-gray-500">
                {dayjs(item.createdAt ?? "").format("YYYY-MM-DD")}
              </time>
            </div>

            <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={check(item.content)}
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
