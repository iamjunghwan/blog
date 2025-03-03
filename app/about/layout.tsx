export async function generateMetadata() {
  //글 제목, 내용, 이미지 경로,

  const post = {
    title: "안정환 detail",
    description: "안정환 블로그 detail",
    imageUrl: "localhost:3000/iaman.png",
  };

  return {
    title: "IamAn의 블로그 / About",
    description: "This blog was created by an.",
    openGraph: {
      title: "IamAn의 블로그 / About",
      description: "Click here to access the blog.",
      siteName: "Example Blog",
      images: [
        {
          url: "https://iaman.kr/iaman.png",
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
  return <div>{children}</div>;
}
