/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          light: "#3B82F6",
          dark: "#1D4ED8",
          shading: "#EFF6FF",
        },
        bg: {
          DEFAULT: "#F8FAFC",
          card: "#FFFFFF",
          dark: "#0F172A",
          darkCard: "#1E293B",
        },
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        text: {
          primary: "#1E293B",
          secondary: "#64748B",
          light: "#94A3B8",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        card: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        premium: '0 20px 25px -5px rgb(0 0 0 / 0.03), 0 8px 10px -6px rgb(0 0 0 / 0.03)',
      }
    },
  },
  plugins: [],
}
