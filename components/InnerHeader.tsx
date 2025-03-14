export default function InnerHeader({ title }: { title: string }) {
  return (
    <>
      <div className="main ">
        <h1 className="mainH1">{title}</h1>
      </div>
      <hr />
    </>
  );
}
