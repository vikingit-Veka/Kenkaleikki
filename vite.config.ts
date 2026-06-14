import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the app from /<repo>/, so the asset base path must match.
// The deploy workflow sets VITE_BASE to "/<repo>/". Locally it defaults to "/".
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
});
