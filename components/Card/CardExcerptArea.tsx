/****************************************
 *
 * CardExcerptArea : 아티클 발췌문 atomic 컴포넌트
 *
 * 본문에서 뽑는 일은 excerptOf가 한다. 여기서는 보여 주기만 한다.
 *
 ****************************************/

interface CardExcerptAreaProps {
  excerpt: string;
  className?: string;
}

const CardExcerptArea = ({
  excerpt,
  className = "line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400",
}: CardExcerptAreaProps) => {
  return <p className={className}>{excerpt}</p>;
};

export default CardExcerptArea;
