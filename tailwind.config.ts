/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom background and foreground colors used in the project
        background: "#FAFAFA",   // light neutral background
        foreground: "#1F2937",  // dark neutral text color
      },
    },
  },
  plugins: [],
}