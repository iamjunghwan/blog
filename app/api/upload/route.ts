import { NextRequest } from "next/server";
import formidable from "formidable";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
  const uploadDir = path.join(process.cwd(), "/public/uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const buffer = await req.arrayBuffer(); // NextRequest의 body를 buffer로 가져옴

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 100 * 1024 * 1024, // 5MB 제한 (선택)
  });

  try {
    const { fields, files } = await new Promise<{
      fields: formidable.Fields;
      files: formidable.Files;
    }>((resolve, reject) => {
      // 버퍼를 스트림으로 변환 (핵심 부분)
      const stream: any = new Readable();
      stream.push(Buffer.from(buffer));
      stream.push(null);

      // 헤더 임의 세팅 (content-length 꼭 있어야 함)
      stream.headers = {
        "content-type": req.headers.get("content-type") || "",
        "content-length": buffer.byteLength.toString(),
      };

      // formidable로 스트림 파싱
      form.parse(stream as any, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    console.log("fields:", fields);
    console.log("files:", files);

    return new Response(JSON.stringify({ filepath: files.file[0].filepath }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("파일 업로드 실패:", err);
    return new Response("파일 업로드 실패", { status: 500 });
  }
}
