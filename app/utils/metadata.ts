import { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";
import { localePath } from "@/app/lib/i18n/paths";
import type { Lang } from "@/app/lib/posts/types";

export interface MetadataOptions {
  title: string;
  description: string;
  imageUrl?: string;
  type?: "article" | "website";
  /** 이 페이지의 언어. og:locale과 hreflang을 정한다. */
  lang?: Lang;
  /**
   * 언어 접두사를 뺀 경로 (예: "/swe-bench", "/about", "/").
   * 주어지면 canonical과 hreflang을 만든다. 없으면 둘 다 넣지 않는다 —
   * 틀린 canonical은 아예 없는 것보다 나쁘다.
   */
  path?: string;
  /** 반대 언어판이 있는가. 없으면 hreflang을 한쪽만 넣는다. */
  hasCounterpart?: boolean;
}

const OG_LOCALE: Record<Lang, string> = {
  ko: "ko_KR",
  en: "en_US",
};

export function generateCommonMetadata(options: MetadataOptions): Metadata {
  const {
    title,
    description,
    imageUrl = `${SITE_URL}/default-thumbnail.png`,
    type = "article",
    lang = "ko",
    path,
    hasCounterpart = false,
  } = options;

  const alternates =
    path === undefined
      ? undefined
      : {
          canonical: `${SITE_URL}${localePath(lang, path)}`,
          // 반대판이 없으면 자기 자신만 적는다. 없는 주소를 가리키면 구글이 오류로 본다.
          languages: hasCounterpart
            ? {
                ko: `${SITE_URL}${localePath("ko", path)}`,
                en: `${SITE_URL}${localePath("en", path)}`,
              }
            : { [lang]: `${SITE_URL}${localePath(lang, path)}` },
        };

  return {
    title,
    description,
    ...(alternates === undefined ? {} : { alternates }),
    openGraph: {
      title,
      description,
      siteName: "iaman Blog",
      // 크기는 적지 않는다. 글마다 대표 이미지가 달라 실제 크기를 여기서 알 수 없고,
      // 틀린 값을 적으면 공유 카드가 잘리거나 큰 이미지 카드로 안 잡힌다.
      images: [{ url: imageUrl, alt: title }],
      locale: OG_LOCALE[lang],
      type,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    icons: { icon: "/iaman.ico" },
  };
}
