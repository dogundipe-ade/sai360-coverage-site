import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1220",
          900: "#0B1220",
          800: "#111827",
          700: "#1F2937",
          600: "#374151",
          500: "#4B5563",
          400: "#6B7280",
          300: "#9CA3AF",
          200: "#D1D5DB",
          100: "#E5E7EB",
          50: "#F3F4F6",
        },
        brand: {
          deep: "#003A42",
          teal: "#00856C",
          mint: "#65BC7B",
          sky: "#9DDFD4",
          pale: "#EDF8F4",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F7F9F9",
          subtle: "#F1F5F4",
        },
        accent: {
          DEFAULT: "#00856C",
          hover: "#006650",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
        ],
      },
      fontSize: {
        "display-lg": ["3.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "650" }],
        "display": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "650" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        lift: "0 8px 24px -8px rgba(16,24,40,0.12), 0 2px 6px rgba(16,24,40,0.04)",
        drawer: "-12px 0 32px -8px rgba(16,24,40,0.12)",
      },
      borderRadius: {
        xl2: "14px",
      },
      maxWidth: {
        page: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
