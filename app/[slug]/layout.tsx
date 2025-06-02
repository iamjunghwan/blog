import { generateCommonMetadata } from "../utils/metadata";
import { GET_ARTICLES_BY_SLUG } from "@/graphql/queries/articleQueries";
import { getClient } from "../lib/apollo-server-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  try {
    const { data } = await getClient.query({
      query: GET_ARTICLES_BY_SLUG,
      variables: { slug },
    });

    return generateCommonMetadata({
      title: data.title,
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
