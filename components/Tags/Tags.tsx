import TagList from "./TagList";
import { allPosts } from "@/app/lib/posts/repository";
import { allTags, postsIn } from "@/app/lib/posts/queries";
import type { Lang } from "@/app/lib/posts/types";

const Tags = ({ currTag, lang }: { currTag: string; lang: Lang }) => {
  // 태그 목록은 그 언어의 글에서만 뽑는다. 두 언어를 합치면 글이 없는 태그의
  // 목록 페이지로 가는 링크가 생긴다.
  return (
    <TagList
      currTag={currTag}
      lang={lang}
      tagNames={allTags(postsIn(allPosts(), lang))}
    />
  );
};

export default Tags;
