/****************************************
 *
 * CardImageArea : 아티클 이미지 atomic 컴포넌트
 *
 * content에 img태그가 있으면 그 이미지를 대표 이미지로 선정.
 * 이미지가 없으면 기본 이미지 선정.
 *
 ****************************************/

import { imgCheck } from "@/app/utils/common";
import Image from "next/image";

interface CardImageAreaProps {
  content: string;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

const CardImageArea = ({
  content,
  className = "flex items-center justify-center h-24 w-24 overflow-hidden mb-4 rounded-lg",
  width = 96,
  height = 96,
  alt = "Article Representative Image",
}: CardImageAreaProps) => {
  return (
    <div className={className}>
      <Image
        src={imgCheck(content)}
        alt={alt}
        width={width}
        height={height}
        className="object-cover rounded-lg"
      />
    </div>
  );
};

export default CardImageArea;
