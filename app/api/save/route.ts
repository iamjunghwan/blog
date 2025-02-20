// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest, res: NextResponse) {
//   try {
//     // 블로그 내용
//     const { title, content, tags, url } = req.body;

//     console.log("------------");
//     console.log(req, res);
//     console.log("------------");

//     // Memex API에 블로그 데이터 저장하기
//     const response = await fetch(
//       "https://api.memexdata.io/memex/external/projects/0e9c148b/models/blog/contents",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Access-Token":
//             "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJSRUJFTDkiLCJpYXQiOjE3Mzk3NzcxMzUsImV4cCI6MjA1NTEzNzEzNSwiSUQiOiIwZTljMTQ4YiIsIkRPTUFJTiI6WyIqIl0sIlRZUEUiOiJFWFRFUk5BTCJ9.i-PuX7QzNpJiqncP06Tc5FyDbFpAg11D-W5csSTdRkg",
//           "X-Forwarded-Host": "localhost:3000",
//         },
//         body: JSON.stringify({
//           title: title,
//           text: content,
//           tags: tags,
//           url: url,
//         }),
//       }
//     );

//     const data = await response.json();

//     if (response.ok) {
//       return new Response(
//         JSON.stringify({ message: "Post saved successfully", data }),
//         {
//           status: 200,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     } else {
//       return res.status(500).json({ message: "Error saving post", data });
//     }
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error saving post", error: error.message });
//   }
// }
