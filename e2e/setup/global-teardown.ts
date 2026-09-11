import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');
  // Cleanup if needed
  console.log('Global teardown complete.');
}

export default globalTeardown;
