/****************************************
 *
 * CardDateArea : 아티클 날짜 atomic 컴포넌트
 *
 * 절대 날짜는 서버에서, 상대 표기는 브라우저에서 붙인다.
 * 이 블로그는 output: "export" 정적 사이트라 빌드 시점에 "N일 전"을 계산하면
 * 배포 순간의 값이 HTML에 박힌다. 글이 한 달에 한 편꼴이라 "2일 전"이 한 달 내내
 * 서 있게 된다. 첫 렌더를 서버와 똑같이 맞춰 hydration 경고도 피한다.
 *
 ****************************************/
"use client";

import { useEffect, useState } from "react";
import { relativeLabel } from "@/app/lib/date/relative";

interface CardDateAreaProps {
  date: string;
  className?: string;
}

const CardDateArea = ({
  date,
  className = "flex items-center mb-4",
}: CardDateAreaProps) => {
  const [relative, setRelative] = useState<string | null>(null);

  useEffect(() => {
    setRelative(relativeLabel(date, new Date()));
  }, [date]);

  return (
    <div className={className}>
      <time className="text-gray-500 dark:text-gray-400" dateTime={date}>
        {date}
        {relative !== null && ` (${relative})`}
      </time>
    </div>
  );
};

export default CardDateArea;
