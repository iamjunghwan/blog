/****************************************
 *
 * MostRead : 홈의 많이 읽힌 글 목록
 *
 * 서버 컴포넌트. 캐러셀과 달리 상호작용이 없어 클라이언트 JS를 늘리지 않는다.
 * 순위 느낌을 줄이려고 번호는 붙이지 않는다. 순서는 content/featured.json이 정한다.
 *
 ****************************************/

import Link from "next/link";
import { localePath } from "@/app/lib/i18n/paths";
import type { CarouselSlide, Lang } from "@/app/lib/posts/types";

export type MostReadItem = Pick<CarouselSlide, "slug" | "title" | "date" | "thumbnailSrc">;

interface MostReadProps {
  items: MostReadItem[];
  lang: Lang;
  labelledBy: string;
}

const MostRead = ({ items, lang, labelledBy }: MostReadProps) => {
  return (
    <ul
      aria-labelledby={labelledBy}
      className="mx-auto max-w-2xl list-none divide-y divide-gray-200 dark:divide-gray-800"
    >
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={localePath(lang, `/${item.slug}`)}
            className="group flex items-center gap-4 py-4"
          >
            <img
              src={item.thumbnailSrc}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-[40/21] w-28 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0">
              <p className="line-clamp-2 font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {item.title}
              </p>
              <time
                dateTime={item.date}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {item.date}
              </time>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default MostRead;
