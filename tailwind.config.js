/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        panel: '#121215',
        surface: '#18181b',
        'surface-border': '#27272a',
        'surface-border-subtle': '#1f1f23',
        'cell-locked': '#141417',
        accent: {
          blue: '#2563eb',
          'blue-hover': '#1d4ed8',
          'blue-light': '#3b82f6',
        },
        muted: {
          dark: '#3f3f46',
          DEFAULT: '#71717a',
          light: '#a1a1aa',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
