import { PostData } from "@/type/index";

const API_URL =
  "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/search/v2";
const API_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJSRUJFTDkiLCJpYXQiOjE3Mzk3NzcxMzUsImV4cCI6MjA1NTEzNzEzNSwiSUQiOiIwZTljMTQ4YiIsIkRPTUFJTiI6WyIqIl0sIlRZUEUiOiJFWFRFUk5BTCJ9.i-PuX7QzNpJiqncP06Tc5FyDbFpAg11D-W5csSTdRkg";

export async function getArticleContent(slug: string): Promise<string> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": API_TOKEN,
      "X-Forwarded-Host": "localhost:3000",
    },
    body: JSON.stringify({
      size: 20,
      page: 0,
      direction: "DESC",
    }),
    cache: "no-store",
  });

  const result = await response.json();
  const content = result.list
    .filter((obj: PostData) => obj.data.slug === slug)
    .map((obj: PostData) => obj.data.content)
    .toString();

  return content;
}
