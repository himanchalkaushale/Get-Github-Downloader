/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        cursive: ["Pacifico", "cursive"],
      },
    },
  },
  plugins: [],
  safelist: [
    // Blue colors
    'bg-blue-700', 'hover:bg-blue-600', 'active:bg-blue-800', 'bg-blue-200', 'bg-blue-900', 'border-blue-700', 'text-blue-100', 'text-blue-200', 'text-blue-300', 'text-blue-400',
    'from-blue-950', 'via-blue-900', 'to-blue-700',
    // Green colors
    'bg-green-700', 'hover:bg-green-600', 'active:bg-green-800', 'bg-green-200', 'bg-green-900', 'border-green-700', 'text-green-100', 'text-green-200', 'text-green-300', 'text-green-400',
    'from-green-950', 'via-green-900', 'to-green-700',
    // Purple colors
    'bg-purple-700', 'hover:bg-purple-600', 'active:bg-purple-800', 'bg-purple-200', 'bg-purple-900', 'border-purple-700', 'text-purple-100', 'text-purple-200', 'text-purple-300', 'text-purple-400',
    'from-purple-950', 'via-purple-900', 'to-purple-700',
  ]
}

