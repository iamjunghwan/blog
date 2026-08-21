import InnerHeader from "@/components/Layout/InnerHeader";
import MainArticleList from "@/components/MainArticleList";
import { allPosts } from "@/app/lib/posts/repository";

const Page = () => {
  // 메인은 최신 5개만 보여준다 (윗줄 3개 + 아랫줄 2개)
  const posts = allPosts().slice(0, 5);

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <MainArticleList posts={posts} />
    </>
  );
};

export default Page;
