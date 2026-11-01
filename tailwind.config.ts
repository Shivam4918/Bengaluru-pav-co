import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8ed",
          100: "#ffeed4",
          200: "#ffd9a8",
          300: "#ffbe71",
          400: "#ff9838",
          500: "#f97316", // Vibrant saffron-orange
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        thecha: {
          500: "#dc2626", // Fiery spicy red
          600: "#b91c1c",
          700: "#991b1b",
        },
        kadai: {
          800: "#1e1e24",
          900: "#121217",
          950: "#09090b",
        },
        chutney: {
          500: "#16a34a", // Coriander mint green
          600: "#15803d",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Impact", "Trebuchet MS", "sans-serif"],
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slight": "bounce 2s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
