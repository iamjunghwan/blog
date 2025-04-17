"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import DarkMode from "../public/darkMode.svg";
import LightMode from "../public/lightMode.svg";

const Theme = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState<Boolean>(false);

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
    <div className="p-4">
      <button type="button" onClick={toggleTheme} aria-label="toggleTheme">
        {theme === "light" ? <LightMode /> : <DarkMode />}
      </button>
    </div>
  );
};

export default Theme;
