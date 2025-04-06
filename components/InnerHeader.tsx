export default function InnerHeader({ title }: { title: string }) {
  return (
    <>
      <div className="main ">
        <h1 style={{ fontSize: "3rem", fontWeight: "900" }}>{title}</h1>
      </div>
      <hr />
    </>
  );
}
