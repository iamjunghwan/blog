import "./globals.css";
import Headers from "../components/Header";
import Footer from "../components/Footer";
import { ThemeProvider } from "next-themes";
import Head from "next/head";
import Provider from "./Provider";
import { generateCommonMetadata } from "./utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "Iaman",
    description: "This blog was created by an.",
    type: "website",
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kr" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/iaman.ico" sizes="any" />
        <meta name="robots" content="index, follow " />
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
              <Provider>{children}</Provider>
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
