
import NotFound from "../../../not-found";
import { getTagsArticle } from "./service/getTagsArticle";
import { helperCallApi } from "@/app/utils/helperCallApi";
import { ApiResponse,ApiItem } from "@/type/index";
import PostPageContent from "@/components/PostPageContent";

export async function generateStaticParams() {
  const response = await helperCallApi(); 
  
  const posts = response.list;
  //console.log(posts[0])
  if (!Array.isArray(posts)) {
    return [];
  }

  const totalPages = Math.ceil(posts.length / 5);
  
  const totSlugList = [];
  // slug 페이지
  for (const post of posts) {
    totSlugList.push({
      slug: post.data.slug,
      page: ["1"],   // 최소 1페이지
    });
    totSlugList.push({
      slug: post.data.tags,
      page: ["1"],   // 최소 1페이지
    });
  }
  
  // 전체 페이지
  for(let i=1 ; i <= totalPages ; i++){
    totSlugList.push({
      slug: "all",
      page: [`${i}`],
    });
  }

  // 태그 페이지
  const pageSize = 5;
  const tagMap = new Map();
   for (const post of posts) {
    const tags = post.data.tags.split(",");

    for (const tag of tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }

 for (const [tag, count] of tagMap.entries()) {
    const pages = Math.ceil(count / pageSize);

    for (let i = 1; i <= pages; i++) {
      totSlugList.push({
        slug: tag,
        page: [`${i}`],
      });
    }
  }

  return totSlugList;
}// end generateStaticParams()

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
