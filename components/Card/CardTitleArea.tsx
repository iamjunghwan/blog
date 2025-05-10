/****************************************
 *
 * CardTitleArea : 아티클 제목 itomic 컴포넌트
 *
 ****************************************/

const CardTitleArea = ({ title }: { title: string }) => {
  return (
    <div className=" h-16 font-bold flex items-center justify-center">
      <h2 className="line-clamp-2 leading-tight text-base">{title}</h2>
    </div>
  );
};
export default CardTitleArea;
