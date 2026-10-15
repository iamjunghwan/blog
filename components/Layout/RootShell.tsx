/****************************************
 *
 * RootShell : 두 언어의 루트 레이아웃이 공유하는 틀
 *
 * <html lang>이 언어마다 달라야 해서 루트 레이아웃을 그룹별로 둘 만들어야 하는데,
 * 그 안의 GA·테마·폰트·헤더·푸터는 완전히 같다. 복사해 두면 한쪽만 고쳐진다.
 *
 ****************************************/

import { ThemeProvider } from "next-themes";
import Headers from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Article from "@/components/Layout/Article";
import { fonts } from "@/app/utils/fonts";
import type { Lang } from "@/app/lib/posts/types";

const isProd = process.env.NODE_ENV === "production";

export default function RootShell({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <html lang={lang} className={fonts.variable} suppressHydrationWarning>
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
              <Headers lang={lang} />
              <Article>{children}</Article>
              <Footer lang={lang} />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
