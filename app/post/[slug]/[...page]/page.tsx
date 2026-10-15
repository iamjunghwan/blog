import { notFound } from "next/navigation";
import PostPageContent from "@/components/PostPageContent";
import { allPosts } from "@/app/lib/posts/repository";
import { paginate, postListParams, postsByTag, postsIn } from "@/app/lib/posts/queries";

// 목록·태그·페이지 수는 한 언어의 글로만 센다. 영어 글이 들어오면 두 언어가 한 목록에
// 섞여 페이지네이션이 어긋나므로 지금 고정한다. 다음 단계에서 "ko"가 라우트 언어로 바뀐다.
const LANG = "ko";

export function generateStaticParams() {
  return postListParams(postsIn(allPosts(), LANG));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; page: string[] }>;
}) {
  const { slug, page } = await params;
  const pageNumber = Number(page[0]);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    notFound();
  }

  const tagged = postsByTag(postsIn(allPosts(), LANG), slug);
  const { items, totalPages } = paginate(tagged, pageNumber);

  if (items.length === 0) {
    notFound();
  }

  return (
    <PostPageContent
      slug={slug}
      page={pageNumber}
      totalPages={totalPages}
      totalCount={tagged.length}
      posts={items}
    />
  );
}
