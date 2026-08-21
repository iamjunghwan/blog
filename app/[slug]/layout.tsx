import { generateCommonMetadata } from "../utils/metadata";
import { allPosts } from "@/app/lib/posts/repository";
import { postBySlug } from "@/app/lib/posts/queries";

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

  return generateCommonMetadata({
    title: post.title,
    description: "https://iaman.kr",
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="prose dark:prose-invert">{children}</div>;
}
