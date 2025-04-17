/****************************************
 *
 * CardDateArea : 아티클 날짜 itomic 컴포넌트
 *
 ****************************************/

import dayjs from "dayjs";

const CardDateArea = ({ createdAt }: { createdAt: string }) => {
  return (
    <div className="flex items-center mb-4">
      <time dateTime={createdAt}>{dayjs(createdAt).format("YYYY-MM-DD")}</time>
    </div>
  );
};
export default CardDateArea;
