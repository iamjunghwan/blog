/****************************************
 *
 * HomePage : 메인 본체
 *
 * 라우트 파일이 아니라 여기에 둔다. 한국어(/)와 영어(/en)가 같은 화면을 쓰는데
 * 루트 레이아웃이 달라 라우트 파일을 둘로 나눠야 하기 때문이다. 본체가 하나면
 * 한쪽만 고쳐져 두 언어가 어긋나는 일이 없다.
 *
 ****************************************/

import InnerHeader from "@/components/Layout/InnerHeader";
import MainArticleList from "@/components/MainArticleList";
import { allPosts } from "@/app/lib/posts/repository";
import { postsIn } from "@/app/lib/posts/queries";
import type { Lang } from "@/app/lib/posts/types";

/** 메인에 보여줄 글 개수. 이 값만 쓴다. */
const LATEST_COUNT = 5;

const HomePage = ({ lang }: { lang: Lang }) => {
  const posts = postsIn(allPosts(), lang).slice(0, LATEST_COUNT);

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <MainArticleList posts={posts} lang={lang} />
    </>
  );
};

export default HomePage;
