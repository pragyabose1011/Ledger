/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        "ledger-pink": "#e485b6",
      },
      boxShadow: {
        "glow-pink": "0 0 20px rgba(228,133,182,0.4)",
        "glow-pink-lg": "0 0 40px rgba(228,133,182,0.5)",
      },
      keyframes: {
        "float-up": {
          "0%":   { transform: "translateY(0) scale(1)",    opacity: "1" },
          "80%":  { transform: "translateY(-120px) scale(1.15)", opacity: "0.9" },
          "100%": { transform: "translateY(-160px) scale(0.9)", opacity: "0" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(100%)", opacity: "0" },
        },
        "skeleton-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.2s ease-out",
        "slide-out": "slide-out 0.2s ease-in",
        "skeleton": "skeleton-pulse 1.5s ease-in-out infinite",
        "float-up": "float-up 3s ease-out forwards",
      },
    },
  },
  plugins: [],
}