/**
 * 기본 대표 이미지 생성기 (일회성 에셋 생성).
 */
import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

const WIDTH = 2400;
const HEIGHT = 1260;

async function main() {
  const out = process.argv[2];
  if (!out) {
    console.error(
      "사용법: npx tsx scripts/gen-default-thumbnail.tsx <출력경로.png>",
    );
    process.exit(1);
  }

  const logo = fs.readFileSync("public/iaman.png");
  const dataUri = `data:image/png;base64,${logo.toString("base64")}`;

  const image = new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
      }}
    >
      {/* 세로를 꽉 채우면 원본 로고의 여백 때문에 오히려 작아 보인다.
            로고 자체에 여백이 넉넉해서 캔버스 높이만큼 키워도 답답하지 않다. */}
      <img src={dataUri} width={HEIGHT} height={HEIGHT} />
    </div>,
    { width: WIDTH, height: HEIGHT },
  );

  const buffer = Buffer.from(await image.arrayBuffer());
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buffer);

  console.log(
    `${out} — ${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)}, ` +
      `${(buffer.length / 1024).toFixed(0)}KB`,
  );
}

main().catch((error) => {
  console.error("실패:", error.message);
  process.exit(1);
});
