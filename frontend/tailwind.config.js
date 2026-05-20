/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        gold: {
          50:  "#fdfbf3",
          100: "#fdf3d0",
          200: "#fbe58a",
          300: "#f7d044",
          400: "#f2bc1a",
          500: "#d4a017",
          600: "#a97c0e",
          700: "#7d5b0a",
          800: "#523c07",
          900: "#2a1e03",
        },
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
