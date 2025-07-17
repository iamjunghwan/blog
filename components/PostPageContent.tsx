import InnerHeader from "@/components/InnerHeader";
import Tags from "@/components/Tags/components/Tags";
import PostArticle from "@/components/PostArticle/index";
import { ApiResponse } from "@/type/index";

interface PostPageContentProps {
  slug: string;
  page: string;
  postData: ApiResponse;
  displayData: ApiResponse;
  startIndex: number;
  endIndex: number;
}

const PostPageContent = ({
  slug,
  page,
  postData,
  displayData,
  startIndex,
  endIndex,
}: PostPageContentProps) => {
  return (
    <>
      <InnerHeader title={`Posts ${slug} ${postData.list.length}`} />
      <Tags currTag={slug} />
      <PostArticle
        data={postData}
        page={page}
        slug={slug}
        startIndex={startIndex}
        endIndex={endIndex}
        displayData={displayData}
      />
    </>
  );
};

export default PostPageContent;
