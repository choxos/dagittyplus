/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The app is published to GitHub Pages under /dagittyplus/app/.
// In development the base is "/" so the dev server and the vendored
// engine script in public/ resolve correctly.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/dagittyplus/app/" : "/",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
}));
