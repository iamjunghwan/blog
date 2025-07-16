import NotFound from "../../../not-found";
import { getTagsArticle } from "./service/getTagsArticle";
import { helperCallApi } from "@/app/utils/helperCallApi";
import { ApiResponse } from "@/type/index";
import PostPageContent from "@/components/PostPageContent";

// 데이터 페칭 로직
const fetchPostData = async (slug: string): Promise<ApiResponse> => {
  if (slug === "" || slug === "all") {
    return await helperCallApi();
  }
  return await getTagsArticle(slug);
};

// 페이지네이션 로직
const getPaginatedData = (
  postData: ApiResponse,
  page: string,
  pageSize: number = 5
) => {
  const pageNumber = Number(page);
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  const currPageArticleList = postData.list.slice(startIndex, endIndex);

  return {
    displayData: { list: currPageArticleList },
    startIndex,
    endIndex,
    hasData: currPageArticleList.length > 0,
  };
};

// 유효성 검사
const validateParams = (slug: string, page: string): boolean => {
  const pageNumber = Number(page);
  return !isNaN(pageNumber) && pageNumber > 0;
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;

  // 파라미터 유효성 검사
  if (!validateParams(slug, page)) {
    return <NotFound />;
  }

  try {
    // 데이터 페칭
    const postData = await fetchPostData(slug);

    // 페이지네이션 처리
    const { displayData, startIndex, endIndex, hasData } = getPaginatedData(
      postData,
      page
    );

    // 데이터가 없으면 404
    if (!hasData) {
      return <NotFound />;
    }

    return (
      <PostPageContent
        slug={slug}
        page={page}
        postData={postData}
        displayData={displayData}
        startIndex={startIndex}
        endIndex={endIndex}
      />
    );
  } catch (error) {
    return <NotFound />;
  }
}
