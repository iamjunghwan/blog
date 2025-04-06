/****************************************
 *
 * CardTitleArea : 아티클 제목 itomic 컴포넌트
 *
 ****************************************/

const CardTitleArea = ({ title }: { title: string }) => {
  return (
    <div
      style={{
        height: "60px",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h2>{title}</h2>
    </div>
  );
};
export default CardTitleArea;
