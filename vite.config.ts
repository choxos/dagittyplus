/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The app is published to GitHub Pages under /dagittyplus/app/.
// The build and `vite preview` use that base so a local preview matches
// production exactly; the dev server uses "/" so it and the vendored engine
// script in public/ resolve correctly.
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/dagittyplus/app/" : "/",
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
