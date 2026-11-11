import { defineConfig, devices } from '@playwright/test';

const configuredBaseURL = process.env.BASE_URL || 'http://localhost:3002';
const runAgainstLiveLuise = /^https?:\/\/(www\.)?luise\.bio\/?$/i.test(configuredBaseURL);
const disableWebServer = process.env.PW_NO_WEBSERVER === '1' || runAgainstLiveLuise;

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  use: {
    baseURL: configuredBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  globalSetup: require.resolve('./e2e/setup/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/setup/global-teardown.ts'),
  webServer: disableWebServer
    ? undefined
    : {
        command: 'npm run dev',
        url: configuredBaseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
      },
});
