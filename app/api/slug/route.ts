import { NextRequest } from "next/server";
import { ApiResponse } from "@/type/index";
import { callApi } from "@/app/utils/callApi";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { slug } = body;

  const result = await callApi();
  if (!("list" in result)) {
    return new Response(
      JSON.stringify({
        error: result.error,
        message: result.message,
        status: result.status,
      }),
      {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const content: string = result.list
    .filter((obj: ApiResponse) => obj.data.slug === slug)
    .map((obj: ApiResponse) => obj.data.content)
    .toString();

  return new Response(JSON.stringify({ content }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
