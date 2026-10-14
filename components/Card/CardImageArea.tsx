/****************************************
 *
 * CardImageArea : 아티클 이미지 atomic 컴포넌트
 *
 * 대표 이미지 경로는 thumbnailOf가 결정한다.
 *
 *
 ****************************************/

interface CardImageAreaProps {
  src: string;
  className?: string;
  alt?: string;
}

const CardImageArea = ({
  src,
  className = "w-full aspect-[40/21] overflow-hidden mb-4 rounded-lg",
  alt = "Article Representative Image",
}: CardImageAreaProps) => {
  return (
    <div className={className}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
  );
};

export default CardImageArea;
