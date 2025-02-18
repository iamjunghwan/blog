"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
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
      <a href="/">
        <div className="headerAlign">
          <img src="/image4.png" className="leftHeaderInImgArea" />

          <div className="leftHeaderInTextArea">
            <span style={{ fontStyle: "italic" }}> {"IamAn"}</span>
          </div>
        </div>
      </a>
      <div className="rightHeaderInTextArea">
        <div className="headerAlign">
          <a className="padding" href="/post">
            {"Posts"}
          </a>
          <a className="padding">{"About"}</a>
          <a className="padding">
            <button onClick={toggleTheme}>
              {theme === "light" ? <LightMode /> : <DarkMode />}
            </button>
          </a>
        </div>
      </div>
    </header>
  );
}
