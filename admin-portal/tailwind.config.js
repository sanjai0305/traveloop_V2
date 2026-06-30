/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#14B8B5",
          light: "#5EEAD4",
          dark: "#0D9488",
          50:  "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8B5",
          600: "#0D9488",
          700: "#0F766E",
        },
        secondary: {
          DEFAULT: "#0F172A",
          light: "#1E293B",
          dark: "#020617",
        },
        accent: {
          DEFAULT: "#F59E0B",
          light: "#FCD34D",
          dark: "#D97706",
        },
        surface: "#1E293B",
        background: "#0F172A",
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
