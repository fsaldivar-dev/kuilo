import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },

  snapshotPathTemplate: "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",

  projects: [
    {
      // Web mode: runs against Vite dev server (fast, no Electron needed)
      name: "web",
      use: {
        baseURL: "http://localhost:5173",
      },
      testMatch: "**/e2e/web/**/*.spec.js",
    },
    {
      // Electron mode: launches the real Electron app
      name: "electron",
      testMatch: "**/e2e/electron/**/*.spec.js",
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 15000,
  },
});
