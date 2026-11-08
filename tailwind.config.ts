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
          navy: "#073c7b",
          blue: "#08559e",
          light: "#fff9e9",
          gold: "#f2c34f",
          goldSoft: "#ffe08b",
          ink: "#172033",
          slate: "#5d6b82"
        }
      },
      boxShadow: {
        soft: "0 24px 70px rgba(6, 31, 73, 0.2)"
      }
    }
  },
  plugins: []
};

export default config;
