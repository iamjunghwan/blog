import "./globals.css";
import Headers from "../components/Header";
import Footer from "../components/Footer";
import { ThemeProvider } from "next-themes";

export async function generateMetadata() {
  return {
    title: "IamAn의 블로그",
    description: "This blog was created by an.",
    openGraph: {
      title: "IamAn의 블로그",
      description: "Click here to access the blog.",
      siteName: "Example Blog",
      images: [
        {
          url: "http://43.200.3.68:3000/iaman.jpeg",
          width: 800,
          height: 600,
          alt: "Blog Image",
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
