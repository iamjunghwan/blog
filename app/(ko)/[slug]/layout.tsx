import { generateCommonMetadata } from "@/app/utils/metadata";
import { allPosts } from "@/app/lib/posts/repository";
import { counterpart, postBySlug, postsIn } from "@/app/lib/posts/queries";
import { excerptOf } from "@/app/lib/posts/excerpt";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import { absoluteUrl } from "@/app/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  // 메타데이터도 본문과 같은 언어의 글에서 찾는다. 고정하지 않으면 영어 글이 들어올 때
  // 정렬상 앞서는 영어판 제목이 한국어 URL에 붙는다. 다음 단계에서 "ko"가 라우트 언어로 바뀐다.
  const post = postBySlug(postsIn(allPosts(), "ko"), slug);

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
    lang: "ko",
    path: `/${post.slug}`,
    hasCounterpart: counterpart(allPosts(), post.slug, "ko") !== undefined,
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="prose dark:prose-invert">{children}</div>;
}
