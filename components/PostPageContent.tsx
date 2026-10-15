import InnerHeader from "@/components/Layout/InnerHeader";
import Tags from "@/components/Tags/Tags";
import PostArticle from "@/components/PostArticle/index";
import type { Lang, Post } from "@/app/lib/posts/types";

interface PostPageContentProps {
  slug: string;
  page: number;
  totalPages: number;
  totalCount: number;
  posts: Post[];
  lang: Lang;
}

const PostPageContent = ({
  slug,
  page,
  totalPages,
  totalCount,
  posts,
  lang,
}: PostPageContentProps) => {
  return (
    <>
      <InnerHeader title={`Posts ${slug} ${totalCount}`} />
      <Tags currTag={slug} lang={lang} />
      <PostArticle
        posts={posts}
        page={page}
        slug={slug}
        totalPages={totalPages}
        totalCount={totalCount}
        lang={lang}
      />
    </>
  );
};

export default PostPageContent;
