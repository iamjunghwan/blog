import { generateCommonMetadata } from "../utils/metadata";
import { PostData } from "@/type/index";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const response = await fetch(
    "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/search/v2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token":
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJSRUJFTDkiLCJpYXQiOjE3Mzk3NzcxMzUsImV4cCI6MjA1NTEzNzEzNSwiSUQiOiIwZTljMTQ4YiIsIkRPTUFJTiI6WyIqIl0sIlRZUEUiOiJFWFRFUk5BTCJ9.i-PuX7QzNpJiqncP06Tc5FyDbFpAg11D-W5csSTdRkg",
        "X-Forwarded-Host": "localhost:3000",
      },
      body: JSON.stringify({
        size: 20,
        page: 0,
        direction: "DESC",
      }),
    }
  );

  const result = await response.json();

  try {
    const { data } = result.list.filter(
      (obj: PostData) => obj.data.slug === slug
    )[0];

    return generateCommonMetadata({
      title: data.title.KO,
      description: "https://iaman.kr",
    });
  } catch (err) {
    return generateCommonMetadata({
      title: "Not Found",
      description: "Page not found",
      type: "website",
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
