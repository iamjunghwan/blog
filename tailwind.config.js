import typography from "@tailwindcss/typography";

const config = {
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
      typography: (theme) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme("colors.blue.500"),
              "font-weight": "600",
              "text-decoration": "none",
              "&:hover": {
                color: "colors.blue.600",
              },
            },
            time: {
              "text-decoration": "none",
            },
            "blockquote p:first-of-type::before": {
              content: "none",
            },
          },
        },
        dark: {
          css: {
            color: theme("colors.white"),
            h1: {
              color: theme("colors.white"),
            },
            h2: {
              color: theme("colors.white"),
            },
            h3: {
              color: theme("colors.white"),
            },
            p: {
              color: theme("colors.white"),
            },
            strong: {
              color: theme("colors.white"),
            },
            li: {
              color: theme("colors.white"),
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};

export default config;
