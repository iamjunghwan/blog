import Image from "next/image";
import Link from "next/link";
import Theme from "../Button/Theme";
import Search from "../Search/components/Search";
import MenuToggleButton from "../Button/MenuToggleButton";
import { allPosts } from "@/app/lib/posts/repository";
import { postsIn, searchIndex } from "@/app/lib/posts/queries";
import { localePath } from "@/app/lib/i18n/paths";
import type { Lang } from "@/app/lib/posts/types";

export default function Header({ lang }: { lang: Lang }) {
  // 빌드 타임에 만든 검색 인덱스를 클라이언트 컴포넌트에 넘긴다.
  // 별도 JSON 파일과 fetch가 필요 없고, 모달을 열면 즉시 검색된다.
  // 보고 있는 언어의 글만 담는다 — 한국어 화면에서 영어 글이 나오면 혼란스럽다.
  const index = searchIndex(postsIn(allPosts(), lang));

  return (
    <header className="pt-10 pb-10 flex justify-between items-center">
      <Link href={localePath(lang, "/")}>
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
          <Link className="p-4" href={localePath(lang, "/post/all/1")}>
            {"Posts"}
          </Link>
          <Link className="p-4" href={localePath(lang, "/about")}>
            {"About"}
          </Link>
          <Search index={index} lang={lang} />
          <Theme />
        </div>
        <div className="sm:hidden flex items-center">
          <Search index={index} lang={lang} />
          <Theme />
          <MenuToggleButton lang={lang} />
        </div>
      </div>
    </header>
  );
}
