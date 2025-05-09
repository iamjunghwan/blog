import { ApiResponse, ApiResponseError, ApiItem } from "@/type/index";
import { callApi } from "@/app/utils/callApi";
import Link from "next/link";
import NotFound from "@/app/not-found";

const Tags = async () => {
  const postData: ApiResponse | ApiResponseError = await callApi();
  if (!("list" in postData)) {
    return <NotFound />;
  }
  const tags = postData.list.map((obj: ApiItem) => obj.data.tags);

  const uniqueTags = new Set();
  tags.forEach((item: string) => {
    item.split(",").forEach((tag) => {
      uniqueTags.add(tag);
    });
  });
  const result = [...uniqueTags];

  return (
    <>
      <div className="w-full flex overflow-x-auto space-x-1 whitespace-nowrap mt-4 pb-2 px-2">
        <div className="shrink-0 bg-gray-200 uppercase text-gray-800 px-3 py-1 rounded-full text-sm">
          <Link href="/post/all">All</Link>
        </div>

        {result.map((tag, index) => (
          <div
            key={index}
            className="shrink-0 bg-gray-200 uppercase text-gray-800 px-3 py-1 rounded-full text-sm"
          >
            <Link href={`/post/${tag}`}>{tag as String}</Link>
          </div>
        ))}
      </div>
    </>
  );
};

export default Tags;
