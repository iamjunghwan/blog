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
    <header
      style={{
        paddingTop: "2.5rem",
        paddingBottom: "2.5rem",
        justifyContent: "space-between",
        alignItems: "center",
        display: "flex",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <img
          src="/image4.png"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "100%",
            marginRight: ".5rem",
          }}
        />
        <div style={{ display: "flex" }}>
          <span style={{ fontStyle: "italic" }}> {"IamAn"}</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <a style={{ padding: "1rem" }}>{"Posts"}</a>
          <a style={{ padding: "1rem" }}>{"About"}</a>
          <a style={{ padding: "1rem" }}>
            <button onClick={toggleTheme}>
              {theme === "light" ? <LightMode /> : <DarkMode />}
            </button>
          </a>
        </div>
      </div>
    </header>
  );
}
