import InnerHeader from "@/components/InnerHeader";
import Tags from "@/components/Tags";
import PostArticle from "@/components/PostArticle";
import { ApiResponse } from "@/type/index";

interface PostPageContentProps {
  slug: string;
  postData: ApiResponse;
}

const PostPageContent = ({ slug, postData }: PostPageContentProps) => {
  return (
    <>
      <InnerHeader title={`Posts ${slug} ${postData.list.length}`} />
      <Tags currTag={slug} />
      <PostArticle data={postData} />
    </>
  );
};

export default PostPageContent;
