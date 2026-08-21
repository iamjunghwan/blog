/****************************************
 *
 * CardImageArea : 아티클 이미지 atomic 컴포넌트
 *
 * 대표 이미지 경로는 thumbnailOf가 결정한다.
 *
 ****************************************/

interface CardImageAreaProps {
  src: string;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

const CardImageArea = ({
  src,
  className = "flex items-center justify-center h-24 w-24 overflow-hidden mb-4 rounded-lg",
  width = 96,
  height = 96,
  alt = "Article Representative Image",
}: CardImageAreaProps) => {
  return (
    <div className={className}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-cover rounded-lg"
      />
    </div>
  );
};

export default CardImageArea;
