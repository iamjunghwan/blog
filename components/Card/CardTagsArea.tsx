/****************************************
 *
 * CardTagsArea : 아티클 태그 itomic 컴포넌트
 *
 ****************************************/
import Link from "next/link";
import { localePath } from "@/app/lib/i18n/paths";
import type { Lang } from "@/app/lib/posts/types";

interface CardTagsAreaProps {
  tags: string[];
  lang: Lang;
  className?: string;
  linkClassName?: string;
}

const CardTagsArea = ({
  tags,
  lang,
  className = "flex flex-wrap gap-2 mb-2",
  linkClassName = "text-sm text-blue-600 dark:text-blue-400 uppercase no-underline",
}: CardTagsAreaProps) => {
  return (
    <div className={className}>
      {tags.map((tag: string, i: number) => (
        <Link key={i} href={localePath(lang, `/post/${tag}/1`)} className={linkClassName}>
          {tag}
        </Link>
      ))}
    </div>
  );
};

export default CardTagsArea;
