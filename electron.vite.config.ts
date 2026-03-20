import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/main",
      lib: {
        entry: resolve(__dirname, "packages/app/src/main.ts"),
      },
    },
    resolve: {
      alias: {
        "@engine": resolve(__dirname, "packages/engine/src"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "out/preload",
      lib: {
        entry: resolve(__dirname, "packages/app/src/preload.ts"),
      },
    },
  },
  renderer: {
    root: resolve(__dirname, "packages/renderer"),
    build: {
      outDir: resolve(__dirname, "out/renderer"),
      rollupOptions: {
        input: resolve(__dirname, "packages/renderer/index.html"),
      },
    },
    resolve: {
      alias: {
        "@renderer": resolve(__dirname, "packages/renderer/src"),
        "@engine": resolve(__dirname, "packages/engine/src"),
      },
    },
    plugins: [react()],
  },
});
