export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  //글 제목, 내용, 이미지 경로,

  const post = {
    title: "Posts",
    description: "안정환 블로그 Posts",
    imageUrl: "localhost:3000/image4.png",
  };

  return {
    title: post.title,
    description: "post 영역",
    openGraph: {
      title: post.title,
      description: "An insightful blog post about modern web development.",
      siteName: "Example Blog",
      images: [
        {
          url: "https://yceffort.kr/opengraph-image?7f9a4b94e109db7b",
          width: 800,
          height: 600,
          alt: "Blog Post Image",
        },
      ],
      locale: "en_US",
      type: "article",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div style={{ border: "1px solid white", paddingLeft: "1rem" }}>
      {children}
    </div>
  );
}
