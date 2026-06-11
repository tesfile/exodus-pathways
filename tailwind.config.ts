import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        exodus: {
          navy: "#0f3d73",
          blue: "#1769aa",
          light: "#e9f3fb",
          gold: "#c99a2e",
          goldSoft: "#f6e8c4",
          ink: "#172033",
          slate: "#5d6b82"
        }
      },
      boxShadow: {
        soft: "0 24px 70px rgba(15, 61, 115, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
