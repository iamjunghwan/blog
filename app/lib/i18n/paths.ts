/****************************************
 *
 * 내부 링크의 언어별 경로
 *
 * 한국어는 접두사가 없다 — 기존 주소가 이미 구글에 색인돼 있어 바꿀 수 없다.
 * 영어만 /en 을 붙인다. 이 비대칭 때문에 링크를 만드는 곳마다 분기가 생기는데,
 * 그 분기를 여기 한 곳에 모은다.
 *
 ****************************************/

import type { Lang } from "@/app/lib/posts/types";

const PREFIX: Record<Lang, string> = {
  ko: "",
  en: "/en",
};

export function localePath(lang: Lang, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefix = PREFIX[lang];

  if (prefix === "") {
    return normalized;
  }

  // 이미 붙어 있으면 그대로 둔다. 호출부가 완성된 경로를 넘겨도 /en/en/... 이 되지 않는다.
  // 경계를 함께 보지 않으면 "/english-is-hard" 같은 slug을 접두사로 오인한다.
  if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
    return normalized;
  }

  // 루트는 "/en/"이 아니라 "/en"이어야 한다. 정적 export에서 끝 슬래시가 파일을 가른다.
  return normalized === "/" ? prefix : `${prefix}${normalized}`;
}
