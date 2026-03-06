/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
  safelist: [
    { pattern: /bg-(blue|rose|emerald|violet|amber|gray|indigo|teal|orange|red)-(50|100|200|600|700|800)/ },
    { pattern: /text-(blue|rose|emerald|violet|amber|gray|indigo|teal|orange|red)-(400|500|600|700|800)/ },
    { pattern: /border-(blue|rose|emerald|violet|amber|gray|indigo|teal|orange|red)-(100|200|300|600)/ },
  ],
};
