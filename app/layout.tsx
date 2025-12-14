//check
import "./globals.css";
import Headers from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import { ThemeProvider } from "next-themes";
import { generateCommonMetadata } from "./utils/metadata";
import Article from "@/components/Layout/Article";
import { fonts } from "./utils/fonts";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "iaman",
    description: "This blog was created by an.",
  });
}

const isProd = process.env.NODE_ENV === "production";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="kr" className={fonts.variable} suppressHydrationWarning>
        <head>
          {isProd && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASURE_ID}`}
              ></script>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.GA_MEASURE_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
                }}
              />
            </>
          )}
        </head>
        <body className="font-custom min-h-full bg-white dark:bg-black text-black dark:text-white">
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
    </>
  );
}
