/** 사이트 원점. 사이트맵·robots·메타데이터가 전부 이 값을 쓴다. */
export const SITE_URL = "https://iaman.kr";

/** 상대 경로를 절대 URL로 만든다. og:image처럼 절대 URL이 필요한 자리에 쓴다. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
