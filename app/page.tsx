import InnerHeader from "@/components/Layout/InnerHeader";
import MainArticleList from "@/components/MainArticleList";
import { allPosts } from "@/app/lib/posts/repository";

const Page = () => {
  // 메인에 보여줄 글 개수는 여기서만 정한다.
  // MainArticleList는 받은 글을 그대로 나열한다 — 개수 분기가 양쪽에 있으면 어긋난다.
  const posts = allPosts().slice(0, 5);

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <MainArticleList posts={posts} />
    </>
  );
};

export default Page;
