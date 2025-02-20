import "./globals.css";
import Headers from "../components/Header";
import Footer from "../components/Footer";
import { ThemeProvider } from "next-themes";

export async function generateMetadata() {
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
          url: "",
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
          <div className="layoutOuter">
            <div className="layoutInner">
              <Headers />
              <main style={{ marginBottom: "auto" }}>{children}</main>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
