export async function generateMetadata() {
  return {
    title: "Posts by iaman",
    description: "This blog was created by an.",
    openGraph: {
      title: "Posts by iaman",
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
    icons: {
      icon: "/iaman.ico",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div style={{ paddingLeft: "1rem" }}>{children}</div>;
}
