"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import DarkModeIcon from "@/components/Icon/DarkModeIcon";
import LightModeIcon from "@/components/Icon/LightModeIcon";

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
      <button type="button" onClick={toggleTheme} aria-label="ThemeButton">
        {theme === "light" ? <LightModeIcon /> : <DarkModeIcon />}
      </button>
    </div>
  );
};

export default Theme;
