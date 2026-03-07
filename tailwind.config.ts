import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0f0f0f',
          secondary: '#1a1a1a',
          tertiary: '#242424',
          hover: '#2a2a2a',
        },
        text: {
          primary: '#e8e8e8',
          secondary: '#b0b0b0',
          tertiary: '#808080',
          disabled: '#4a4a4a',
        },
        accent: {
          primary: '#3b82f6',
          primaryHover: '#2563eb',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#06b6d4',
        },
        confidence: {
          high: '#10b981',
          medium: '#f59e0b',
          low: '#ef4444',
        },
        border: {
          default: '#333333',
          focus: '#3b82f6',
          error: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};

export default config;
