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
      // Portal-specific extensions can be added here
      // All design tokens are inherited from shared-ui preset
    },
  },

  plugins: [],
};
