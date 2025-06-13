/****************************************
 *
 * CardDateArea : 아티클 날짜 itomic 컴포넌트
 *
 ****************************************/

import dayjs from "dayjs";

const CardDateArea = ({ createdAt }: { createdAt: string }) => {
  const dateTime = dayjs(createdAt).format("YYYY-MM-DD");
  return (
    <div className="flex items-center mb-4">
      <time className="text-gray-500 dark:text-gray-400" dateTime={dateTime}>
        {dateTime}
      </time>
    </div>
  );
};
export default CardDateArea;
