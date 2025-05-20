import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./components/**/*.{js,ts,tsx}", "./app/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        custom: ["var(--font-custom)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
