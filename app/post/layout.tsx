import { generateCommonMetadata } from "../utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "Posts by iaman",
    description: "This blog was created by an.",
    type: "website",
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div style={{ paddingLeft: "1rem" }}>{children}</div>;
}
