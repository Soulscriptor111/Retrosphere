import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: ["essentia.js"],
  },
  build: {
    rollupOptions: {
      external: ["path", "fs", "crypto"],
      output: {
        globals: {
          path: "path",
          fs: "fs",
          crypto: "crypto",
        },
      },
    },
  },
  resolve: {
    alias: {
      // If essentia.js has a browser-specific build
      "essentia.js": "essentia.js/dist/essentia-wasm.umd.js",
    },
  },
});
