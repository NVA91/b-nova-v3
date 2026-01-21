/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nova-primary': '#3B82F6',
        'nova-secondary': '#8B5CF6',
        'nova-accent': '#10B981',
        'nova-dark': '#1F2937',
      },
    },
  },
  plugins: [],
}
