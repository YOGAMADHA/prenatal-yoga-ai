/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: "#4a7c59",
        cream: "#faf7f2",
        blush: "#c9806a",
      },
    },
  },
  plugins: [],
};
