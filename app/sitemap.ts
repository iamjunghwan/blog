import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";
import { allPosts, LANGS } from "@/app/lib/posts/repository";
import { bilingualSlugs, postListUrls, postsIn } from "@/app/lib/posts/queries";
import { localePath } from "@/app/lib/i18n/paths";

// 정적 export에서는 메타데이터 라우트도 빌드 타임에 고정된 정적 파일로
// 내보내야 한다는 것을 Next에 명시해야 한다.
export const dynamic = "force-static";

/**
 * 양쪽 다 있는 주소에만 alternates를 단다. 없는 주소를 가리키면 구글이 오류로 본다.
 *
 * 반환값은 항목에 그대로 펼쳐 넣는다. Next가 읽는 모양은 `alternates.languages`이고,
 * `languages`를 항목 최상위에 올리면 조용히 무시된다 — 객체 스프레드는 타입 검사도 통과한다.
 */
function alternatesFor(path: string, both: boolean) {
  if (!both) {
    return {};
  }
  return {
    alternates: {
      languages: {
        ko: `${SITE_URL}${localePath("ko", path)}`,
        en: `${SITE_URL}${localePath("en", path)}`,
      },
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts();
  const both = new Set(bilingualSlugs(posts));
  const entries: MetadataRoute.Sitemap = [];

  // 홈과 소개는 글이 한 편이라도 있는 언어마다 나온다. 그래서 두 언어 모두
  // 글을 가질 때에만 서로의 대역이 존재한다.
  const bothLangsHavePosts = LANGS.every((lang) => postsIn(posts, lang).length > 0);

  for (const lang of LANGS) {
    const inLang = postsIn(posts, lang);
    if (inLang.length === 0) {
      continue;
    }
    const latestDate = inLang[0]?.date;

    entries.push({
      url: `${SITE_URL}${localePath(lang, "/")}`,
      lastModified: latestDate,
      ...alternatesFor("/", bothLangsHavePosts),
    });
    entries.push({
      url: `${SITE_URL}${localePath(lang, "/about")}`,
      ...alternatesFor("/about", bothLangsHavePosts),
    });

    for (const post of inLang) {
      entries.push({
        url: `${SITE_URL}${localePath(lang, `/${post.slug}`)}`,
        lastModified: post.date,
        ...alternatesFor(`/${post.slug}`, both.has(post.slug)),
      });
    }

    for (const path of postListUrls(inLang)) {
      entries.push({
        url: `${SITE_URL}${localePath(lang, path)}`,
        lastModified: latestDate,
      });
    }
  }

  return entries;
}
