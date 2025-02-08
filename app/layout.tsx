import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Headers from "../components/Header";
import { ThemeProvider } from "next-themes";
// https://github.com/pacocoursey/next-themes

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  //글 제목, 내용, 이미지 경로,
  //fetch 영역
  const post = {
    title: "안정환",
    description: "안정환 블로그",
    imageUrl: "localhost:3000/image4.png",
  };

  return {
    title: post.title,
    description: "An insightful blog post about modern web development.",
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
    <html lang="kr" suppressHydrationWarning className="mce-content-body">
      <body>
        <ThemeProvider
          defaultTheme="light"
          storageKey="blog-Theme"
          attribute="class"
        >
          <div
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              paddingLeft: "1.5rem",
              paddingRight: "1.5rem",
              maxWidth: "50rem",
            }}
            id="test"
          >
            <div
              style={{
                justifyContent: "space-between",
                flexDirection: "column",
                display: "flex",
              }}
            >
              <Headers />
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
