/****************************************
 *
 * 파비콘 만들기
 *
 * 사용법:
 *   pnpm icons
 *
 * public/iaman.png(2400x2400 선화)에서 app/ 아래 아이콘을 뽑는다.
 *
 * 원본을 그대로 줄이면 두 가지가 문제다.
 *   1. 여백이 넓어 48px로 줄이면 그림이 점이 된다 — 투명 여백을 잘라내고 다시 채운다.
 *   2. 배경이 투명하고 선이 검다 — 다크 배경에서 사라진다. 흰 바탕을 깐다.
 *
 * 크기는 48의 배수로 맞춘다. 구글이 검색 결과에 파비콘을 쓸 때 권장하는 규격이다.
 *
 ****************************************/

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE = path.join("public", "iaman.png");
const APP_DIR = "app";

/** 그림 둘레에 남길 여백. 꽉 채우면 둥글게 깎는 플랫폼에서 잘린다. */
const PADDING_RATIO = 0.12;

/** 선화가 검은색이라 흰 바탕을 깐다. 투명으로 두면 다크 모드에서 안 보인다. */
const BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

/** 48의 배수. 구글이 검색 결과 파비콘에 권장하는 규격이다. */
const ICON_SIZE = 192;

/** 애플 기기 홈 화면용. 애플이 정한 값이라 48의 배수가 아니다. */
const APPLE_SIZE = 180;

/** .ico 안에 넣을 크기들. 브라우저 탭과 북마크가 쓴다. */
const ICO_SIZES = [48, 96];

/** 여백을 잘라낸 그림을 흰 정사각형 가운데에 올린다. */
async function renderSquare(size: number): Promise<Buffer> {
  const inner = Math.round(size * (1 - PADDING_RATIO * 2));
  const art = await sharp(SOURCE)
    .trim()
    .resize(inner, inner, { fit: "contain", background: { ...BACKGROUND, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: art, gravity: "centre" }])
    .png()
    .toBuffer();
}

/**
 * PNG 여러 장을 .ico 한 장으로 묶는다.
 *
 * sharp는 .ico를 못 쓴다. 포맷이 단순해서 직접 만든다 —
 * 6바이트 헤더 + 이미지당 16바이트 목록 + PNG 원본. 최신 .ico는 PNG를 그대로 담는다.
 */
function buildIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // 예약
  header.writeUInt16LE(1, 2); // 1 = 아이콘
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;

  images.forEach((image, index) => {
    const at = index * 16;
    // 256은 0으로 적는다. 1바이트라 256이 안 들어간다.
    directory[at] = image.size >= 256 ? 0 : image.size;
    directory[at + 1] = image.size >= 256 ? 0 : image.size;
    directory[at + 2] = 0; // 팔레트 색 수
    directory[at + 3] = 0; // 예약
    directory.writeUInt16LE(1, at + 4); // 색상 평면
    directory.writeUInt16LE(32, at + 6); // 픽셀당 비트
    directory.writeUInt32LE(image.png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += image.png.length;
  });

  return Buffer.concat([header, directory, ...images.map((image) => image.png)]);
}

async function main(): Promise<void> {
  if (!fs.existsSync(SOURCE)) {
    console.error(`${SOURCE} 가 없다`);
    process.exit(1);
  }

  const meta = await sharp(SOURCE).metadata();
  const trimmed = await sharp(SOURCE).trim().toBuffer({ resolveWithObject: true });

  console.log(`원본        ${meta.width}x${meta.height}`);
  console.log(
    `여백 제거   ${trimmed.info.width}x${trimmed.info.height}` +
      `  (가로 ${Math.round((trimmed.info.width / (meta.width ?? 1)) * 100)}%만 그림이었다)`
  );
  console.log("");

  const icon = await renderSquare(ICON_SIZE);
  fs.writeFileSync(path.join(APP_DIR, "icon.png"), icon);
  console.log(`app/icon.png        ${ICON_SIZE}x${ICON_SIZE}  ${Math.round(icon.length / 1024)}KB`);

  const apple = await renderSquare(APPLE_SIZE);
  fs.writeFileSync(path.join(APP_DIR, "apple-icon.png"), apple);
  console.log(
    `app/apple-icon.png  ${APPLE_SIZE}x${APPLE_SIZE}  ${Math.round(apple.length / 1024)}KB`
  );

  const icoImages = [];
  for (const size of ICO_SIZES) {
    icoImages.push({ size, png: await renderSquare(size) });
  }
  const ico = buildIco(icoImages);
  fs.writeFileSync(path.join(APP_DIR, "favicon.ico"), ico);
  console.log(
    `app/favicon.ico     ${ICO_SIZES.join("+")}  ${Math.round(ico.length / 1024)}KB`
  );
}

main().catch((error) => {
  console.error("실패:", error.message);
  process.exit(1);
});
