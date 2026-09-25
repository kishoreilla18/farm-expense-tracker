import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: "#1F3D2B",
        sprout: "#4C7A3D",
        mustard: "#D9A441",
        soil: "#6B4A2F",
        paper: "#FBF9F4",
        ink: "#22261F",
        clay: "#B5533C",
        line: "#DED6C3"
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
