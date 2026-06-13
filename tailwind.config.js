/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens backed by CSS variables defined in src/index.css.
        // This lets light/dark themes swap by toggling data-theme on <html>.
        bg: "var(--bg)",
        canvas: "var(--canvas)",
        panel: "var(--panel)",
        line: "var(--line)",
        text: "var(--text)",
        dim: "var(--dim)",
        faint: "var(--faint)",
        accent: "var(--accent)",
        "accent-ghost": "var(--accent-ghost)",
        exposure: "var(--exposure)",
        outcome: "var(--outcome)",
        causal: "var(--causal)",
        biasing: "var(--biasing)",
        neutral: "var(--neutral)",
        ok: "var(--ok)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(20,30,55,.06), 0 12px 30px -16px rgba(20,30,55,.22)",
      },
    },
  },
  plugins: [],
};
