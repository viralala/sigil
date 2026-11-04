import { defineConfig } from "@playwright/test";

const PORT = 3100;

// docs/QA.md: every control on mobile (390x844) AND desktop (1440x900).
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  // The end-to-end journeys share the seeded database; serialize them to avoid cross-test writes.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    // Tests run from one address, so the per-client limits would trip; the limiter has its own unit test.
    env: { SIGIL_AUDIENCE: `http://localhost:${PORT}`, SIGIL_NO_RATE_LIMIT: "1", SIGIL_INSECURE_COOKIES: "1" },
  },
});
