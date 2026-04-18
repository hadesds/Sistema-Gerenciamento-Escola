/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#f5a623",
        "primary-dark": "#d4881a",
        "primary-light": "#fff3d6",
        secondary: "#ffc107",
        tertiary: "#f39c12",
        dark: "#1a1a2e",
        "dark-2": "#16213e",
        "gray-muted": "#6b7280",
        "gray-border": "#e5e7eb",
        "text-base": "#1f2937",
        "bg-page": "#fafaf7",
      },
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
        sora: ["Sora", "sans-serif"],
      },
      boxShadow: {
        primary: "0 0.4rem 2.4rem rgba(245, 166, 35, 0.15)",
        md: "0 0.8rem 4rem rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
