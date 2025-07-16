import Image from "next/image";
import Link from "next/link";
import Theme from "./Theme";

export default function Header() {
  return (
    <header className="pt-10 pb-10 flex justify-between items-center">
      <Link href="/">
        <div className="flex items-center">
          <Image
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
        <div className="flex items-center">
          <Link className="p-4" href="/post/all/1">
            {"Posts"}
          </Link>
          <Link className="p-4" href="/about">
            {"About"}
          </Link>
          <Theme />
        </div>
      </div>
    </header>
  );
}
