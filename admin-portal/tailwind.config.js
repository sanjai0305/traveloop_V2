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
      // Admin portal uses dark theme by default
      colors: {
        surface: "#1E293B",
        background: "#0F172A",
      },
    },
  },

  plugins: [],
};
