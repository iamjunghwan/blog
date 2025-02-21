export async function generateMetadata() {
  return {
    title: "IamAn의 블로그 / Detail",
    description: "AnThis blog was created by an.",
    openGraph: {
      title: "IamAn의 블로그 / Detail",
      description: "Click here to access the blog.",
      siteName: "Example Blog",
      images: [
        {
          url: "http://43.200.3.68:3000/iaman.jpeg",
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
