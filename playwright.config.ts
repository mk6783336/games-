import { defineConfig } from "@playwright/test";

// Dedicated ports and database so the E2E run never touches a developer's
// preview server or their local profile.
const API_ORIGIN = "http://127.0.0.1:8791";
const WEB_ORIGIN = "http://127.0.0.1:5174";

const baseEnv: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
  if (value != null) baseEnv[key] = value;
}

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  use: {
    baseURL: WEB_ORIGIN,
    // Use the browser already installed. For CI, run `npx playwright install
    // chromium` and remove this channel.
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run server:start",
      port: 8791,
      reuseExistingServer: false,
      timeout: 90_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...baseEnv,
        PORT: "8791",
        PGLITE_DIR: ".data/e2e",
        // Keep the run on the isolated PGlite database even if .env points at
        // a hosted Postgres instance.
        DATABASE_URL: "",
        APP_ORIGIN: WEB_ORIGIN,
        NODE_ENV: "development",
      },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
      url: WEB_ORIGIN,
      reuseExistingServer: false,
      timeout: 90_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...baseEnv,
        VITE_API_URL: API_ORIGIN,
      },
    },
  ],
});
