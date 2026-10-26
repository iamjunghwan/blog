import { generateCommonMetadata } from "@/app/utils/metadata";
import { SITE_COPY } from "@/app/lib/i18n/site-copy";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "Posts by iaman",
    description: SITE_COPY.ko.postList,
    lang: "ko",
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}
