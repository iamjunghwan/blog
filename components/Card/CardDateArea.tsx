/****************************************
 *
 * CardDateArea : 아티클 날짜 itomic 컴포넌트
 *
 ****************************************/

const CardDateArea = ({ date }: { date: string }) => {
  return (
    <div className="flex items-center mb-4">
      <time className="text-gray-500 dark:text-gray-400" dateTime={date}>
        {date}
      </time>
    </div>
  );
};
export default CardDateArea;
