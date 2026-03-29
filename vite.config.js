import { defineConfig } from "vite";

export default defineConfig({
  base: "/kunst-app/",
  esbuild: {
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
    loader: "jsx",
  },
});
