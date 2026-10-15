import { generateCommonMetadata } from "@/app/utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "Posts by iaman",
    description: "This blog was created by an.",
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
