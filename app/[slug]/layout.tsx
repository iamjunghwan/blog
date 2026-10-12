import { generateCommonMetadata } from "../utils/metadata";
import { allPosts } from "@/app/lib/posts/repository";
import { postBySlug } from "@/app/lib/posts/queries";
import { excerptOf } from "@/app/lib/posts/excerpt";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import { absoluteUrl } from "@/app/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = postBySlug(allPosts(), slug);

  if (post === undefined) {
    return generateCommonMetadata({
      title: "Not Found",
      description: "Page not found",
    });
  }

  // 설명은 frontmatter의 description이 있으면 그것, 없으면 본문에서 뽑는다.
  // 공유 이미지도 글의 대표 이미지를 쓴다 — 전부 로고로 나가면 어떤 글인지 알 수 없다.
  return generateCommonMetadata({
    title: post.title,
    description: excerptOf(post),
    imageUrl: absoluteUrl(thumbnailOf(post)),
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="prose dark:prose-invert">{children}</div>;
}
