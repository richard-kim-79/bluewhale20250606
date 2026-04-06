import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f5ff",
          100: "#e0ebff",
          200: "#b8d4fe",
          300: "#7ab3fc",
          400: "#3b8ff8",
          500: "#1a73e8",
          600: "#0d5bc6",
          700: "#0b47a1",
          800: "#0d3a85",
          900: "#10326e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
