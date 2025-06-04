/****************************************
 *
 * CardTitleArea : 아티클 이미지 itomic 컴포넌트
 *
 * content에 img태그가 있으면 그 이미지를 대표 이미지로 선정.
 * 이미지가 없으면 기본 이미지 선정.
 *
 ****************************************/

import { imgCheck } from "@/app/utils/common";
import Image from "next/image";

const CardImageArea = ({ content }: { content: string }) => {
  return (
    <div className="flex items-center justify-center h-24 w-24 overflow-hidden mb-4 rounded-lg">
      <Image
        src={imgCheck(content)}
        alt="Post Representative Image"
        width={96}
        height={96}
        className="object-cover rounded-lg"
      />
    </div>
  );
};
export default CardImageArea;
