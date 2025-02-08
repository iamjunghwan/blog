import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/test")) {
    console.log(new Date().toLocaleString());

    // return NextResponse.next();
  }
}

// export const config = {
//   matcher: "/test:path*",
// };
