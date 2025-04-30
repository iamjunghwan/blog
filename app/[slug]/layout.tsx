import { generateCommonMetadata } from "../utils/metadata";
import { ApiItem } from "@/type/index";
import { callApi } from "../utils/callApi";
import { helperCallApi } from "../utils/helperCallApi";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  try {
    const result = await helperCallApi();

    const { data } = result.list.filter(
      (obj: ApiItem) => obj.data.slug === slug
    )[0];

    return generateCommonMetadata({
      title: data.title.KO,
      description: "https://iaman.kr",
    });
  } catch (error) {
    return generateCommonMetadata({
      title: "Not Found",
      description: "Page not found",
    });
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}
