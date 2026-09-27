import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 30000,
  // A stray test.only must not silently skip the rest of the suite in CI.
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  // One at a time: tests assert on the OS-wide global shortcut, which only one app can hold.
  workers: 1,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
