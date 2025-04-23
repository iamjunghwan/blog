import "./globals.css";
import Headers from "../components/Header";
import Footer from "../components/Footer";
import { ThemeProvider } from "next-themes";
import { generateCommonMetadata } from "./utils/metadata";
import Article from "@/components/Article";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "iaman",
    description: "This blog was created by an.",
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kr" suppressHydrationWarning>
      <body className="min-h-full bg-white dark:bg-black text-black dark:text-white">
        <ThemeProvider
          defaultTheme="light"
          storageKey="blog-Theme"
          attribute="class"
        >
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex flex-col justify-between min-h-screen">
              <Headers />
              <Article>{children}</Article>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
