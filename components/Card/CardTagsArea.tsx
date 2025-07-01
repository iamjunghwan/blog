/****************************************
 *
 * CardTagsArea : 아티클 태그 itomic 컴포넌트
 *
 ****************************************/
import Link from "next/link";

interface CardTagsAreaProps {
  tags: string;
  className?: string;
  linkClassName?: string;
}

const CardTagsArea = ({
  tags,
  className = "flex flex-wrap gap-2 mb-2",
  linkClassName = "text-sm text-blue-600 uppercase no-underline",
}: CardTagsAreaProps) => {
  return (
    <div className={className}>
      {tags.split(",").map((tag: string, i: number) => (
        <Link key={i} href={`/post/${tag}`} className={linkClassName}>
          {tag.trim()}
        </Link>
      ))}
    </div>
  );
};

export default CardTagsArea;
