/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef9ff",
          100: "#d8f0ff",
          200: "#b8e6ff",
          300: "#8ad8ff",
          400: "#53c0ff",
          500: "#2ba3f5",
          600: "#1485e0",
          700: "#106bbc",
          800: "#145896",
          900: "#164b7b",
          950: "#112f52",
        },
        dark: {
          900: "#080c14",
          800: "#0d1520",
          700: "#101c2a",
          600: "#142234",
          500: "#1a2c44",
          400: "#1f3554",
          300: "#253f64",
        },
        accent: {
          green: "#00e676",
          amber: "#ffab40",
          red:   "#ff5252",
          cyan:  "#18ffff",
          purple: "#e040fb",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "scan": "scan 2s linear infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scan: {
          "0%": { transform: "translateY(0%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
