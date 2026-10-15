"use client";

/****************************************
 *
 * LanguageSwitch : 언어 전환 버튼
 *
 * 헤더는 자기가 어떤 글 위에 있는지 모른다. 그래서 usePathname으로 현재 주소를 읽어
 * 반대 언어의 주소를 만든다.
 *
 * 글 페이지인데 반대 언어판이 없으면 버튼을 감춘다 — 눌렀더니 404가 나는 것보다 낫다.
 * 양쪽 다 있는 slug 목록은 빌드 타임에 받아 온다.
 *
 * 목록 페이지는 주소를 그대로 옮기지 않고 반대 언어의 전체 목록 1페이지로 보낸다.
 * 언어마다 글 수와 태그가 달라 같은 태그·페이지가 없을 수 있기 때문이다.
 *
 ****************************************/

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ALL_TAG } from "@/app/lib/posts/constants";
import { localePath } from "@/app/lib/i18n/paths";
import { messages } from "@/app/lib/i18n/messages";
import type { Lang } from "@/app/lib/posts/types";

/** 목록 페이지인가. /post/<태그>/<페이지> 형태다. */
function isPostListPath(pathWithoutPrefix: string): boolean {
  return pathWithoutPrefix.startsWith("/post/");
}

/** 글 페이지의 주소는 접두사를 뺀 뒤 segment가 하나뿐이다. */
function articleSlugOf(pathWithoutPrefix: string): string | null {
  const segments = pathWithoutPrefix.split("/").filter((s) => s !== "");

  if (segments.length !== 1) {
    return null;
  }
  // /about 은 글이 아니다. /post/... 는 segment가 둘 이상이라 여기 오지 않는다.
  return segments[0] === "about" ? null : segments[0];
}

export default function LanguageSwitch({
  lang,
  bilingualSlugs,
}: {
  lang: Lang;
  bilingualSlugs: string[];
}) {
  const pathname = usePathname() ?? "/";
  const other: Lang = lang === "ko" ? "en" : "ko";

  // 현재 주소에서 접두사를 떼어 '언어 중립 경로'로 만든다.
  const neutral = lang === "en" ? pathname.replace(/^\/en(?=\/|$)/, "") || "/" : pathname;

  const slug = articleSlugOf(neutral);
  if (slug !== null && !bilingualSlugs.includes(slug)) {
    return null;
  }

  // 목록은 주소를 그대로 옮기면 안 된다. 언어마다 글 수와 태그가 달라
  // /post/all/2 나 /post/browser/1 의 반대 언어 주소는 없을 수 있다.
  // 전체 목록 1페이지는 그 언어에 글이 있는 한 항상 존재한다.
  const target = isPostListPath(neutral) ? `/post/${ALL_TAG}/1` : neutral;

  return (
    <Link
      className="p-4 text-sm font-semibold uppercase"
      href={localePath(other, target)}
      hrefLang={other}
      title={messages(lang).switchTo}
    >
      {other.toUpperCase()}
    </Link>
  );
}
