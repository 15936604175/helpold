/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFA000',
          light: '#FFD54F',
          dark: '#FF6F00',
        },
        sos: '#D32F2F',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#E53935',
        info: '#29B6F6',
        'surface': '#FAFAFA',
      },
    },
  },
  plugins: [],
};
