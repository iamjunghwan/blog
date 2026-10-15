import InnerHeader from "@/components/Layout/InnerHeader";
import MainArticleList from "@/components/MainArticleList";
import { allPosts } from "@/app/lib/posts/repository";
import { postsIn } from "@/app/lib/posts/queries";

const Page = () => {
  // 메인에 보여줄 글 개수는 여기서만 정한다.
  // MainArticleList는 받은 글을 그대로 나열한다 — 개수 분기가 양쪽에 있으면 어긋난다.
  // 메인은 한국어 글만 보인다. 지금은 영어 글이 없어 결과가 같지만, 들어오면 두 언어가
  // 섞여 최신 5편을 차지하므로 미리 고정한다. 다음 단계에서 "ko"가 라우트 언어로 바뀐다.
  const posts = postsIn(allPosts(), "ko").slice(0, 5);

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <MainArticleList posts={posts} lang="ko" />
    </>
  );
};

export default Page;
