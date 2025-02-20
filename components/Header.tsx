"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import DarkMode from "../public/darkMode.svg";
import LightMode from "../public/lightMode.svg";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="header">
      <Link href="/">
        <div className="headerAlign">
          <Image src="/image4.png" alt="" className="leftHeaderInImgArea" />

          <div className="leftHeaderInTextArea">
            <span style={{ fontStyle: "italic" }}> {"IamAn"}</span>
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
          <Link className="padding" href="/">
            <button onClick={toggleTheme}>
              {theme === "light" ? <LightMode /> : <DarkMode />}
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
