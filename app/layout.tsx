import "./globals.css";
import Headers from "../components/Header";
import Footer from "../components/Footer";
import { ThemeProvider } from "next-themes";
import Head from "next/head";

export async function generateMetadata() {
  return {
    title: "Iaman",
    description: "This blog was created by an.",
    openGraph: {
      title: "Iaman",
      description: "Click here to access the blog.",
      siteName: "Example Blog",
      images: [
        {
          url: "https://iaman.kr/iaman.png",
          width: 800,
          height: 600,
          alt: "Blog Image",
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
  return (
    <html lang="kr" suppressHydrationWarning className="mce-content-body">
      <Head>
        <link rel="icon" href="/iaman.ico" sizes="any" />
        <meta name="robots" content="index, follow " /> {/* noindex 제거 */}
      </Head>
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
