
import NotFound from "../../../not-found";
import { getTagsArticle } from "./service/getTagsArticle";
import { helperCallApi } from "@/app/utils/helperCallApi";
import { ApiResponse,ApiItem } from "@/type/index";
import PostPageContent from "@/components/PostPageContent";

interface Item {
    slug: string;
    content?: string;
    title?: {
      KO?: string;
    };
    tags?: string;
  }
export async function generateStaticParams() {
  const response = await helperCallApi(); 
  
  const posts = response.list;
  
  if (!Array.isArray(posts)) {
    return [];
  }

 const totalPages = Math.ceil(posts.length / 5);
 const postParams = posts.flatMap(post => {
    return Array.from({ length: totalPages }).map((_, i) => ({
      slug: post.data.slug,
      page: [(i + 1).toString()]
    }));
  });

  
  // 임시 조치 (정적 URL) 예 : post/all/1
  for(let i=1 ; i <= totalPages ; i++){
      postParams.push({
      slug: "all",
      page: [`${i}`],
    });
  }

  return postParams;
}

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
