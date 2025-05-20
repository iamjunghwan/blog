export default function InnerHeader({ title }: { title: string }) {
  const [mainTitle, subTitle, cnt] = title.split(" ");

  const renderTitle = () => {
    if (title.includes("Posts") && subTitle) {
      return (
        <>
          <span>{mainTitle}</span>
          <span className="shrink-0 bg-gray-200 uppercase text-gray-800 px-3 py-1 rounded-full text-sm ml-2">
            {subTitle}
          </span>
          <span className="text-sm sm:text-base md:text-lg text-gray-500 align-bottom ml-1">
            {cnt}
          </span>
        </>
      );
    }
    return title;
  };

  return (
    <>
      <div className="flex items-center justify-center pb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-center gap-2">
          {renderTitle()}
        </h1>
      </div>
      <hr />
    </>
  );
}
