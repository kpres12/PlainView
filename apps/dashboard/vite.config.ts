import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    dedupe: ["react", "react-dom", "three"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"],
    force: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
