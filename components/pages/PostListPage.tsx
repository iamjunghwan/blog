import { notFound } from "next/navigation";
import PostPageContent from "@/components/PostPageContent";
import { allPosts } from "@/app/lib/posts/repository";
import { paginate, postsByTag, postsIn } from "@/app/lib/posts/queries";
import type { Lang } from "@/app/lib/posts/types";

const PostListPage = ({
  lang,
  tag,
  page,
}: {
  lang: Lang;
  tag: string;
  page: number;
}) => {
  if (!Number.isInteger(page) || page < 1) {
    notFound();
  }

  const tagged = postsByTag(postsIn(allPosts(), lang), tag);
  const { items, totalPages } = paginate(tagged, page);

  if (items.length === 0) {
    notFound();
  }

  return (
    <PostPageContent
      slug={tag}
      page={page}
      totalPages={totalPages}
      totalCount={tagged.length}
      posts={items}
      lang={lang}
    />
  );
};

export default PostListPage;
