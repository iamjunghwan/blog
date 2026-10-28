import localFont from "next/font/local";

/**
 * 본문 폰트 — Pretendard Variable 서브셋.
 *
 * 이 블로그가 실제로 쓰는 글자만 남긴 파일이다(2MB → 202KB). `pnpm fonts`가 만들고,
 * 새 글에 없던 글자를 쓰면 app/lib/fonts/subset.test.ts 가 실패시킨다.
 *
 * 변수 폰트라 100~900을 파일 하나가 담당한다. 이전에는 굵기 400짜리 라틴 서브셋만
 * 있어서 두 가지가 어긋나 있었다 — 한글은 웹폰트가 아예 안 걸려 OS 기본 글꼴로
 * 떨어졌고, font-bold·font-semibold·<strong>은 브라우저가 가짜 굵게로 번지게 그렸다.
 */
export const fonts = localFont({
  src: "../../public/fonts/pretendard-subset.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-custom",
  // 웹폰트가 뜨기 전까지 쓰일 글꼴. 한글은 OS마다 이름이 달라 전부 적는다.
  fallback: [
    "Pretendard",
    "-apple-system",
    "BlinkMacSystemFont",
    "system-ui",
    "Segoe UI",
    "Apple SD Gothic Neo",
    "Malgun Gothic",
    "Noto Sans KR",
    "sans-serif",
  ],
});
