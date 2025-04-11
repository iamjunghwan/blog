export default function InnerHeader({ title }: { title: string }) {
  return (
    <>
      <div className="main">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-center">
          {title}
        </h1>
      </div>
      <hr />
    </>
  );
}
