import { NextRequest } from "next/server";
interface PostData {
  uid: string;
  createdAt: string;
  data: {
    slug: string;
    content: string;
    title: {
      KO: string;
    };
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { slug } = body;

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
  const content = result.list
    .filter((val: PostData) => val.data.slug === slug)
    .map((obj: PostData) => obj.data.content)
    .toString();

  return new Response(JSON.stringify({ data: content }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
