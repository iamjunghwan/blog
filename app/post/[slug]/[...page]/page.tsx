import { notFound } from "next/navigation";
import PostPageContent from "@/components/PostPageContent";
import { allPosts } from "@/app/lib/posts/repository";
import { paginate, postListParams, postsByTag } from "@/app/lib/posts/queries";

export function generateStaticParams() {
  return postListParams(allPosts());
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

  const tagged = postsByTag(allPosts(), slug);
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
