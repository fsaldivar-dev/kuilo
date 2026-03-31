import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "node_modules/",
        "src/tests/",
        "src/components/tiptap-templates/**",
        "src/components/tiptap-ui/**",
        "src/components/tiptap-ui-primitive/**",
        "src/components/tiptap-node/**",
        "src/components/tiptap-icons/**",
        "src/components/tiptap-hooks/**",
      ],
    },
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
});
