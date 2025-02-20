import { NextRequest } from "next/server";
// import formidable, { Fields, Files } from "formidable";
// import path from "path";
// import fs from "fs";
// import { Readable } from "stream";
// import { IncomingMessage } from "http";
//req: NextRequest
export async function POST() {
  // const uploadDir = path.join(process.cwd(), "/public/uploads");
  // if (!fs.existsSync(uploadDir)) {
  //   fs.mkdirSync(uploadDir, { recursive: true });
  // }
  // const buffer = await req.arrayBuffer(); // NextRequest의 body를 buffer로 가져옴
  // const form = formidable({
  //   uploadDir,
  //   keepExtensions: true,
  //   maxFileSize: 100 * 1024 * 1024, // 5MB 제한 (선택)
  // });
  // try {
  //   const { fields, files } = await new Promise<{
  //     fields: Fields;
  //     files: Files;
  //   }>((resolve, reject) => {
  //     // 버퍼를 스트림으로 변환 (핵심 부분)
  //     const stream: Readable = new Readable();
  //     stream.push(Buffer.from(buffer));
  //     stream.push(null);
  //     // 헤더 임의 세팅 (content-length 꼭 있어야 함)
  //     const reqStream = new IncomingMessage(stream);
  //     reqStream.headers = {
  //       "content-type": req.headers.get("content-type") || "",
  //       "content-length": buffer.byteLength.toString(),
  //     };
  //     // formidable로 스트림 파싱
  //     form.parse(reqStream, (err, fields: Fields, files: Files) => {
  //       if (err) reject(err);
  //       else resolve({ fields, files });
  //     });
  //   });
  //   if (files.file && files.file[0]) {
  //     return new Response(
  //       JSON.stringify({ filepath: files.file[0].filepath }),
  //       {
  //         status: 200,
  //         headers: { "Content-Type": "application/json" },
  //       }
  //     );
  //   } else {
  //     return new Response("파일이 업로드되지 않았습니다.", { status: 400 });
  //   }
  // } catch (err: unknown) {
  //   // `err`를 `Error`로 타입 단언하여 사용
  //   if (err instanceof Error) {
  //     console.error("파일 업로드 실패:", err.message);
  //     return new Response("파일 업로드 실패: " + err.message, { status: 500 });
  //   }
  //   // 예상치 못한 오류가 발생한 경우
  //   console.error("파일 업로드 실패: 알 수 없는 오류", err);
  //   return new Response("파일 업로드 실패: 알 수 없는 오류", { status: 500 });
  // }
}
