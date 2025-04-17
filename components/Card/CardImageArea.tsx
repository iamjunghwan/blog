/****************************************
 *
 * CardTitleArea : 아티클 이미지 itomic 컴포넌트
 *
 * content에 img태그가 있으면 그 이미지를 대표 이미지로 선정.
 * 이미지가 없으면 기본 이미지 선정.
 *
 ****************************************/

import Image from "next/image";

const check = (htmlString: string): string => {
  const regex = /<img[^>]*>/; // <img> 태그를 찾는 정규 표현식
  const firstImageTag = htmlString.match(regex); // 첫 번째 <img> 태그를 찾음
  if (firstImageTag === null) {
    return "/iaman.png"; // 기본 경로를 리턴
  }

  const regex2 = /<img[^>]+src=["']([^"']+)["']/;
  const match = firstImageTag[0].match(regex2);

  if (match) {
    const srcValue = match[1];

    return "/" + srcValue;
  } else {
    return "/iaman.png"; // 기본 경로를 리턴
  }
};

const CardImageArea = ({ content }: { content: string }) => {
  return (
    <div className="flex items-center justify-center h-24 w-24 overflow-hidden mb-4 rounded-lg">
      <Image
        src={check(content)}
        alt=""
        width={100}
        height={100}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
export default CardImageArea;
