import ArticleCard from "@/components/Card/ArticleCard";
import type { Post } from "@/app/lib/posts/types";

const MainArticleList = ({ posts }: { posts: Post[] }) => {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 ">
      {posts.slice(0, 3).map((post: Post) => (
        <li
          key={post.slug}
          className="flex flex-col h-full justify-start pt-8 pb-12"
        >
          <div className="h-full">
            <ArticleCard post={post} />
          </div>
        </li>
      ))}

      {/* 아랫줄은 남은 글을 보여준다. 기존 코드는 `> 4`로 게이트해서 글이 정확히
          4개일 때 4번째 글이 어디에도 렌더되지 않고 사라졌다. */}
      {posts.length > 3 ? (
        <li className="md:col-span-3 flex flex-col md:flex-row gap-2  items-stretch">
          {posts.slice(3).map((post: Post) => (
            <div key={post.slug} className="flex-1 h-full pt-8 pb-12">
              <ArticleCard post={post} />
            </div>
          ))}
        </li>
      ) : null}
    </ul>
  );
};

export default MainArticleList;
