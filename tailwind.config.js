/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#ffffff",
        card: "#ffffff",
        border: "#e2e8f0", // slate-200
        accent: {
          DEFAULT: "#0d6efd", // Primary vibrant blue
          violet: "#0b5ed7",
          glow: "rgba(13, 110, 253, 0.25)",
        },
        rag: {
          red: "#dc2626",
          "red-bg": "rgba(220,38,38,0.1)",
          amber: "#d97706",
          "amber-bg": "rgba(217,119,6,0.1)",
          green: "#16a34a",
          "green-bg": "rgba(22,163,74,0.1)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)",
        "page-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(13, 110, 253, 0.08) 0%, #eef4ff 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease both",
        "progress-fill": "progressFill 0.5s ease",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        progressFill: {
          "0%": { width: "0%" },
        },
      },
    },
  },
  plugins: [],
};
