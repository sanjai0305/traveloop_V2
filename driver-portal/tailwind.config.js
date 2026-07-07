/** @type {import('tailwindcss').Config} */
import traveloopPreset from "../shared-ui/tailwind.preset.js";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [traveloopPreset],
  
  theme: {
    extend: {
      // Driver portal uses dark theme by default
      // Standardized to use unified design system colors
      colors: {
        background: "#0B1325",
        surface: "#111827",
      },
    },
  },

  plugins: [],
};
