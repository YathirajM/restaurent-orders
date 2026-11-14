import type { Config } from "tailwindcss";

/**
 * Saffron & Slate — premium restaurant ordering identity.
 *
 * Design tokens:
 * - ink:    near-black warm slate for text and surfaces (avoid pure #000)
 * - ember:  deep terracotta-saffron brand color (CTAs, accents)
 * - saffron: bright warm accent for badges/highlights, used sparingly
 * - cream:  warm paper background for the customer app
 * - sage:   success/veg indicator family
 * - chili:  destructive / non-veg indicator
 *
 * The palette is warm, food-adjacent, and deliberately NOT the generic
 * blue/purple AI look. Dark mode is supported for the KDS (kitchens run dim).
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f6f4",
          100: "#edeae5",
          200: "#d9d4cc",
          300: "#b8afa3",
          400: "#8f8577",
          500: "#6f665a",
          600: "#584f45",
          700: "#463e36",
          800: "#302a24",
          900: "#1e1a16",
          950: "#14110e",
        },
        ember: {
          50: "#fdf3ef",
          100: "#fbe3d9",
          200: "#f6c5b1",
          300: "#ef9d7f",
          400: "#e6714c",
          500: "#d94f28",
          600: "#c43f1c",
          700: "#a33117",
          800: "#832a16",
          900: "#6b2616",
          950: "#3a110a",
        },
        saffron: {
          50: "#fffaeb",
          100: "#fef0c7",
          200: "#fedf89",
          300: "#fec84b",
          400: "#fdb022",
          500: "#f79009",
          600: "#dc6803",
          700: "#b54708",
          800: "#93370d",
          900: "#7a2e0e",
          950: "#4a1c08",
        },
        cream: {
          DEFAULT: "#faf7f2",
          dark: "#f3eee6",
        },
        sage: {
          50: "#f0f9f0",
          100: "#dcf1dc",
          200: "#bbe3bc",
          300: "#8ecf90",
          400: "#5cb461",
          500: "#3a9a42",
          600: "#2a7d33",
          700: "#24642c",
          800: "#215027",
          900: "#1d4223",
          950: "#0c2411",
        },
        chili: {
          50: "#fef2f1",
          100: "#fee4e2",
          200: "#fecdca",
          300: "#fda29b",
          400: "#f97066",
          500: "#f04438",
          600: "#d92d20",
          700: "#b42318",
          800: "#912018",
          900: "#7a271a",
          950: "#45120c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(30,26,22,0.06), 0 1px 3px rgba(30,26,22,0.08)",
        lift: "0 4px 12px rgba(30,26,22,0.10), 0 2px 4px rgba(30,26,22,0.06)",
        sheet: "0 -8px 30px rgba(30,26,22,0.18)",
        btn: "0 1px 2px rgba(30,26,22,0.12)",
      },
      keyframes: {
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "sheet-up": "sheet-up 0.28s cubic-bezier(0.32,0.72,0,1)",
        "fade-in": "fade-in 0.2s ease-out",
        "pop-in": "pop-in 0.3s cubic-bezier(0.32,0.72,0,1)",
        pulse: "pulse 1.8s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
