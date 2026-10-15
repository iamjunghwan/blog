import TagList from "./TagList";
import { allPosts } from "@/app/lib/posts/repository";
import { allTags, postsIn } from "@/app/lib/posts/queries";

const Tags = ({ currTag }: { currTag: string }) => {
  // 태그 목록은 한국어 글에서만 뽑는다. 영어 글이 들어오면 두 언어 태그가 섞여
  // /post/<태그>/1 라우트와 어긋난다. 다음 단계에서 이 "ko"가 라우트 언어로 바뀐다.
  return (
    <TagList currTag={currTag} tagNames={allTags(postsIn(allPosts(), "ko"))} />
  );
};

export default Tags;
