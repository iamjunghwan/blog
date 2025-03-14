/****************************************
 *
 * CardTitleArea : 아티클 제목 itomic 컴포넌트
 *
 ****************************************/

const CardTitleArea = ({ title }: { title: string }) => {
  return (
    <div className="mainH2">
      <h2>{title}</h2>
    </div>
  );
};
export default CardTitleArea;
