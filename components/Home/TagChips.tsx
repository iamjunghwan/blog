/****************************************
 *
 * TagChips : 히어로 아래의 주제 칩
 *
 * 간판이자 내비게이션이다. 손으로 적은 키워드 목록이면 장식에 그치고,
 * 글이 쌓일수록 실제 내용과 어긋난다. 여기 뜨는 건 전부 콘텐츠에서 센 값이라
 * 틀릴 수가 없고, 각 칩이 그 태그의 글 목록으로 가는 진짜 링크다.
 *
 ****************************************/

import Link from "next/link";
import { localePath } from "@/app/lib/i18n/paths";
import { messages } from "@/app/lib/i18n/messages";
import type { TagCount } from "@/app/lib/blog/stats";
import type { Lang } from "@/app/lib/posts/types";

interface TagChipsProps {
  lang: Lang;
  tags: TagCount[];
}

const TagChips = ({ lang, tags }: TagChipsProps) => {
  if (tags.length === 0) return null;
  const m = messages(lang);

  return (
    <nav aria-label={m.heroTagsLabel} className="mt-5">
      <ul className="flex list-none flex-wrap justify-center gap-2">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link href={localePath(lang, `/post/${tag}/1`)} className="tag-chip">
              <span className="tag-chip-hash" aria-hidden="true">
                #
              </span>
              {tag}
              {/*
                개수는 눈으로는 작은 숫자지만, 스크린리더로는 "javascript 14"
                라고만 읽히면 14가 무엇인지 알 수 없다. 단위를 숨겨서 덧붙인다.
              */}
              <span className="tag-chip-count" aria-hidden="true">
                {count}
              </span>
              <span className="sr-only">{m.heroTagCount(count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TagChips;
