import Image from "next/image";
import Link from "next/link";
import Theme from "./Theme";

export default function Header() {
  return (
    <header className="header">
      <Link href="/">
        <div className="headerAlign">
          <Image
            src="/iaman.png"
            alt="blog logo"
            className="leftHeaderInImgArea"
            aria-label="blogLogo"
            width={100}
            height={100}
          />

          <div className="leftHeaderInTextArea">
            <span style={{ fontStyle: "italic" }}> {"iaman"}</span>
          </div>
        </div>
      </Link>
      <div className="rightHeaderInTextArea">
        <div className="headerAlign">
          <Link className="padding" href="/post">
            {"Posts"}
          </Link>
          <Link className="padding" href="/about">
            {"About"}
          </Link>
          <Theme />
        </div>
      </div>
    </header>
  );
}
