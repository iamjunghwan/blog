/****************************************
 *
 * CardTitleArea : 아티클 제목 itomic 컴포넌트
 *
 ****************************************/

interface CardTitleAreaProps {
  title: string;
  slug: string;
  className?: string;
}

const CardTitleArea = ({
  title,
  className = "h-16 font-bold flex items-center justify-center",
  slug,
}: CardTitleAreaProps) => {
  return (
    <div className={className}>
      <h2 className="line-clamp-2 leading-tight text-base text-xl font-semibold mb-2">
        <a href={slug}>{title}</a>
      </h2>
    </div>
  );
};

export default CardTitleArea;
