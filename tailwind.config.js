/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,vue}",
  ],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: ["emerald"],
  },
  plugins: [require("daisyui")],
}

