import Image from "next/image";
import Link from "next/link";
import Theme from "../Button/Theme";
import Search from "../Search/components/Search";
import MenuToggleButton from "../Button/MenuToggleButton";
import { allPosts } from "@/app/lib/posts/repository";
import { searchIndex } from "@/app/lib/posts/queries";

export default function Header() {
  // 빌드 타임에 만든 검색 인덱스를 클라이언트 컴포넌트에 넘긴다.
  // 별도 JSON 파일과 fetch가 필요 없고, 모달을 열면 즉시 검색된다.
  const index = searchIndex(allPosts());

  return (
    <header className="pt-10 pb-10 flex justify-between items-center">
      <Link href="/">
        <div className="flex items-center">
          <img
            src="/iaman.png"
            alt="blog logo"
            className="w-10 h-10 rounded-full mr-2"
            aria-label="blogLogo"
            width={100}
            height={100}
          />

          <div className="flex max-[500px]:hidden">
            <span className="italic"> {"iaman"}</span>
          </div>
        </div>
      </Link>
      <div className="flex justify-between items-center">
        <div className="hidden sm:flex items-center">
          <Link className="p-4" href="/post/all/1">
            {"Posts"}
          </Link>
          <Link className="p-4" href="/about">
            {"About"}
          </Link>
          <Search index={index} />
          <Theme />
        </div>
        <div className="sm:hidden flex items-center">
          <Search index={index} />
          <Theme />
          <MenuToggleButton />
        </div>
      </div>
    </header>
  );
}
