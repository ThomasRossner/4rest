import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://luise.bio';
/** Vollständige E2E-Suite gegen die Remote-URL (benötigt passende Accounts / API). */
const fullSuite = process.env.E2E_LUISE_FULL === '1';

export default defineConfig({
  testDir: './e2e/specs',
  testMatch: fullSuite ? undefined : '**/smoke/**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  timeout: 60 * 1000,
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  globalSetup: require.resolve('./e2e/setup/global-setup-luise.ts'),
  globalTeardown: require.resolve('./e2e/setup/global-teardown.ts'),
});
