import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist-react",
    rollupOptions: {
      external: [
        "better-sqlite3",
        "sqlite-vec",
        "langchain",
        "@langchain/core",
      ],
    },
  },
  server: {
    port: 5123,
    strictPort: true,
  },
});
