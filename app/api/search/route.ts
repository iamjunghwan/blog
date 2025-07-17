// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const API_URL =
    "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/search/v2";
  const body = await req.json();

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": process.env.API_TOKEN || "", // 환경변수 사용
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
