import { FullConfig } from '@playwright/test';

/**
 * Gegen Live-Installationen (z. B. luise.bio) wird kein User-Seeding über die lokale API ausgeführt.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'https://luise.bio';
  console.log(`E2E-Ziel (ohne registerViaApi): ${baseURL}`);
}

export default globalSetup;
