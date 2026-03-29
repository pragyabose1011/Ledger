/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // tweak this hex to the exact pink you like
        "ledger-pink": "#e485b6",
      },
    },
  },
  plugins: [],
}