import { generateCommonMetadata } from "../utils/metadata";
import { ApiResponse } from "@/type/index";
import { callApi } from "../utils/callApi";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const result = await callApi();
  if (!("list" in result)) {
    return generateCommonMetadata({
      title: "Not Found",
      description: "Page not found",
      type: "website",
    });
  }
  const { data } = result.list.filter(
    (obj: ApiResponse) => obj.data.slug === slug
  )[0];

  return generateCommonMetadata({
    title: data.title.KO,
    description: "https://iaman.kr",
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}
