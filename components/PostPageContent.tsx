import InnerHeader from "@/components/Layout/InnerHeader";
import Tags from "@/components/Tags/Tags";
import PostArticle from "@/components/PostArticle/index";
import type { Post } from "@/app/lib/posts/types";

interface PostPageContentProps {
  slug: string;
  page: number;
  totalPages: number;
  totalCount: number;
  posts: Post[];
}

const PostPageContent = ({
  slug,
  page,
  totalPages,
  totalCount,
  posts,
}: PostPageContentProps) => {
  return (
    <>
      <InnerHeader title={`Posts ${slug} ${totalCount}`} />
      <Tags currTag={slug} />
      <PostArticle
        posts={posts}
        page={page}
        slug={slug}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </>
  );
};

export default PostPageContent;
