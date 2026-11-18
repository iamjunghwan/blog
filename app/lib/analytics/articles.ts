/****************************************
 *
 * GA4 경로별 조회수 → 글 단위 조회수
 *
 * 블로그 주소 규칙: 한국어 `/<slug>`, 영어 `/en/<slug>` (app/lib/i18n/paths.ts).
 * 같은 slug의 두 언어판을 한 줄로 합치고, 조회수 0인 글도 남긴다.
 *
 ****************************************/

import type { Row } from "@/app/lib/analytics/ga4";
import type { Lang } from "@/app/lib/posts/types";

/** 빌드 때 페이지가 클라이언트로 넘기는 글 정보. 본문은 싣지 않는다. */
export type ArticleRef = { slug: string; title: string; lang: Lang };

export type ArticleViews = {
  slug: string;
  title: string;
  total: number;
  ko: number;
  en: number;
};

function decode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * 글 모양의 경로면 언어와 slug을, 아니면 null.
 * 실제로 있는 글인지는 여기서 보지 않는다 — /about도 글 모양이다. articleViews가 거른다.
 */
export function pathToArticle(path: string): { slug: string; lang: Lang } | null {
  const segments = path.split("/").filter((segment) => segment !== "");

  if (segments.length === 1 && segments[0] !== "en") {
    return { slug: decode(segments[0]), lang: "ko" };
  }
  if (segments.length === 2 && segments[0] === "en") {
    return { slug: decode(segments[1]), lang: "en" };
  }
  return null;
}

export function articleViews(pages: Row[], articles: ArticleRef[]): ArticleViews[] {
  const bySlug = new Map<string, ArticleViews>();
  const known = new Set(articles.map((a) => `${a.lang}:${a.slug}`));

  for (const article of articles) {
    const entry = bySlug.get(article.slug);

    if (!entry) {
      bySlug.set(article.slug, { slug: article.slug, title: article.title, total: 0, ko: 0, en: 0 });
    } else if (article.lang === "ko") {
      // 제목은 한국어판이 우선이다.
      entry.title = article.title;
    }
  }

  for (const page of pages) {
    const target = pathToArticle(page.label);

    if (!target || !known.has(`${target.lang}:${target.slug}`)) {
      continue;
    }
    const entry = bySlug.get(target.slug)!;

    entry[target.lang] += page.value;
    entry.total += page.value;
  }

  // 같은 합계면 입력 순서를 유지한다 (Array.prototype.sort는 안정 정렬).
  return [...bySlug.values()].sort((a, b) => b.total - a.total);
}
