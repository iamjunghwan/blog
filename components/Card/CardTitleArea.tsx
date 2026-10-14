/****************************************
 *
 * CardTitleArea : 아티클 제목 itomic 컴포넌트
 *
 ****************************************/

import Link from "next/link";

interface CardTitleAreaProps {
  title: string;
  slug: string;
  className?: string;
  linkClassName?: string;
}

const CardTitleArea = ({
  title,
  className = "h-16 font-bold flex items-center justify-center",
  linkClassName = "",
  slug,
}: CardTitleAreaProps) => {
  return (
    <div className={className}>
      <h2 className="line-clamp-2 leading-tight text-xl font-semibold mb-2">
        <Link href={slug} className={linkClassName}>
          {title}
        </Link>
      </h2>
    </div>
  );
};

export default CardTitleArea;
