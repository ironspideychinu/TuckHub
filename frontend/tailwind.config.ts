import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ee8c2b",
        "background-light": "#f8f7f6",
        "background-dark": "#181411",
        "surface-light": "#ffffff",
        "surface-dark": "#221910",
        "text-light": "#181411",
        "text-dark": "#f8f7f6",
        "text-muted-light": "#897561",
        "text-muted-dark": "#a19181",
        "border-light": "#f4f2f0",
        "border-dark": "#3a2e21",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        full: "9999px",
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
export default config;
