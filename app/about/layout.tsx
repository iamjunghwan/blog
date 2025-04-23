import { generateCommonMetadata } from "../utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "About by iaman",
    description: "This blog was created by an.",
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}
