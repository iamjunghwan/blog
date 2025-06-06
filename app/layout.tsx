import "./globals.css";
import Headers from "../components/Header";
import Footer from "../components/Footer";
import { ThemeProvider } from "next-themes";
import { generateCommonMetadata } from "./utils/metadata";
import Article from "@/components/Article";
import { fonts } from "./utils/fonts";
import { StagewiseToolbar } from "@stagewise/toolbar-next";
import ApolloWrapper from "./ApolloWrapper";

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
    <>
      <html lang="kr" className={fonts.variable} suppressHydrationWarning>
        <body className="font-custom min-h-full bg-white dark:bg-black text-black dark:text-white">
          <StagewiseToolbar
            config={{
              plugins: [], // Add your custom plugins here
            }}
          />
          <ApolloWrapper>
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
          </ApolloWrapper>
        </body>
      </html>
    </>
  );
}
