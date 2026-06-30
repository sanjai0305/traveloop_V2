/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // ── Brand Palette ──────────────────────────────
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
          50:  "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
        },

        // ── Surfaces ───────────────────────────────────
        surface: "#FFFFFF",
        "surface-2": "#F8FAFC",
        "surface-3": "#F1F5F9",
        background: "#F8FAFC",
        card: "#FFFFFF",

        // ── Semantic ──────────────────────────────────
        brand: "#14B8B5",
      },

      fontFamily: {
        sans: ["Inter", "Poppins", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },

      fontSize: {
        "mobile-h1":      ["32px", { lineHeight: "1.15", fontWeight: "800" }],
        "mobile-h2":      ["24px", { lineHeight: "1.2",  fontWeight: "700" }],
        "mobile-h3":      ["20px", { lineHeight: "1.25", fontWeight: "600" }],
        "mobile-body":    ["16px", { lineHeight: "1.65" }],
        "mobile-sm":      ["14px", { lineHeight: "1.5"  }],
        "mobile-caption": ["12px", { lineHeight: "1.4"  }],
        "mobile-tiny":    ["10px", { lineHeight: "1.4"  }],
      },

      boxShadow: {
        "xs":         "0 1px 3px rgba(15,23,42,0.06)",
        "sm":         "0 4px 12px rgba(15,23,42,0.08)",
        "card":       "0 8px 24px rgba(15,23,42,0.10)",
        "card-hover": "0 16px 40px rgba(15,23,42,0.14)",
        "brand":      "0 8px 32px rgba(20,184,181,0.35)",
        "brand-lg":   "0 16px 48px rgba(20,184,181,0.40)",
        "nav":        "0 -4px 24px rgba(15,23,42,0.08)",
        "bar":        "0 4px 24px rgba(15,23,42,0.08)",
        "float":      "0 20px 60px rgba(15,23,42,0.15), 0 8px 24px rgba(15,23,42,0.10)",
        "glow":       "0 0 40px rgba(20,184,181,0.3)",
        "amber-glow": "0 0 32px rgba(245,158,11,0.4)",
      },

      borderRadius: {
        "mobile-sm":  "12px",
        "mobile-md":  "16px",
        "mobile-lg":  "20px",
        "mobile-xl":  "24px",
        "mobile-2xl": "32px",
        "mobile-3xl": "40px",
        "pill":       "999px",
      },

      spacing: {
        "safe-top":    "env(safe-area-inset-top, 12px)",
        "safe-bottom": "env(safe-area-inset-bottom, 8px)",
        "app-bar":     "60px",
        "bottom-nav":  "80px",
        "18":          "72px",
        "22":          "88px",
      },

      animation: {
        "float":            "float 3s ease-in-out infinite",
        "float-slow":       "float 5s ease-in-out infinite",
        "fade-in":          "fadeIn 300ms ease forwards",
        "fade-in-up":       "fadeInUp 400ms cubic-bezier(0.34,1.56,0.64,1) forwards",
        "slide-up":         "slideUp 350ms cubic-bezier(0.34,1.56,0.64,1) forwards",
        "slide-up-sheet":   "slideUpSheet 380ms cubic-bezier(0.32,0.72,0,1) forwards",
        "slide-down-sheet": "slideDownSheet 300ms cubic-bezier(0.32,0.72,0,1) forwards",
        "bounce-in":        "bounceIn 400ms cubic-bezier(0.34,1.56,0.64,1) forwards",
        "skeleton":         "skeletonPulse 1.6s ease-in-out infinite",
        "toast":            "toastSlideUp 300ms cubic-bezier(0.34,1.56,0.64,1) forwards",
        "page":             "pageEnter 300ms ease forwards",
        "pulse-scale":      "pulseScale 2s ease-in-out infinite",
        "shimmer":          "shimmer 2s linear infinite",
        "spin-slow":        "spin 3s linear infinite",
        "ripple":           "ripple 600ms ease-out forwards",
        "scale-in":         "scaleIn 300ms cubic-bezier(0.34,1.56,0.64,1) forwards",
      },

      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideUpSheet: {
          from: { transform: "translateY(100%)" },
          to:   { transform: "translateY(0)" },
        },
        slideDownSheet: {
          from: { transform: "translateY(0)" },
          to:   { transform: "translateY(100%)" },
        },
        bounceIn: {
          "0%":   { transform: "scale(0)", opacity: "0" },
          "60%":  { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        skeletonPulse: {
          "0%":   { backgroundPosition: "-300px 0" },
          "100%": { backgroundPosition: "calc(300px + 100%) 0" },
        },
        toastSlideUp: {
          from: { transform: "translateY(100px)", opacity: "0" },
          to:   { transform: "translateY(0)", opacity: "1" },
        },
        pageEnter: {
          from: { opacity: "0", transform: "translateX(20px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        pulseScale: {
          "0%,100%": { transform: "scale(1)" },
          "50%":     { transform: "scale(1.05)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        ripple: {
          "0%":   { transform: "scale(0)", opacity: "0.6" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        scaleIn: {
          from: { transform: "scale(0.8)", opacity: "0" },
          to:   { transform: "scale(1)", opacity: "1" },
        },
      },

      backgroundImage: {
        "gradient-brand":      "linear-gradient(135deg, #14B8B5, #0D9488)",
        "gradient-brand-warm": "linear-gradient(135deg, #14B8B5, #F59E0B)",
        "gradient-brand-deep": "linear-gradient(135deg, #0F172A, #14B8B5)",
        "gradient-hero":       "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)",
        "gradient-card":       "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))",
        "gradient-amber":      "linear-gradient(135deg, #F59E0B, #D97706)",
        "gradient-dark":       "linear-gradient(135deg, #0F172A, #1E293B)",
      },

      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "snap":   "cubic-bezier(0.32, 0.72, 0, 1)",
      },

      backdropBlur: {
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "40px",
      },
    },
  },

  plugins: [],
};