/****************************************
 *
 * MainArticleList : 메인의 최신 글 목록
 *
 * 받은 글을 그대로 나열한다. 몇 개를 보여 줄지는 호출자(app/page.tsx)가 정한다.
 * 예전에는 3단 그리드 + 아랫줄 2개 구조라 호출자의 slice(0, 5)와 여기의
 * slice(0, 3)/slice(3, 5)가 겹쳐 있었고, 아랫줄 카드가 윗줄보다 1.6배 컸다.
 * 세로 스택은 개수에 따라 분기할 일이 없어 그 두 문제가 함께 사라진다.
 *
 ****************************************/

import Link from "next/link";
import MainArticleItem from "@/components/MainArticleItem";
import { ALL_TAG } from "@/app/lib/posts/constants";
import type { Post } from "@/app/lib/posts/types";

const MainArticleList = ({ posts }: { posts: Post[] }) => {
  return (
    <>
      <ul className="list-none">
        {posts.map((post: Post, index: number) => (
          <MainArticleItem key={post.slug} post={post} priority={index === 0} />
        ))}
      </ul>

      <div className="flex justify-center py-8">
        <Link
          href={`/post/${ALL_TAG}/1`}
          className="font-semibold text-blue-600 dark:text-blue-400"
        >
          모든 글 보기 →
        </Link>
      </div>
    </>
  );
};

export default MainArticleList;
