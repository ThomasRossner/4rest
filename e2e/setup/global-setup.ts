import { chromium, FullConfig } from '@playwright/test';
import { createApiClient, registerViaApi } from '../helpers/api';
import { TEST_USERS } from '../helpers/test-users';

async function globalSetup(config: FullConfig) {
  console.log('Running global setup...');
  
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  const apiURL = process.env.API_URL || 'http://localhost:5000/api';
  
  // Try to create test users if they don't exist
  try {
    for (const [key, user] of Object.entries(TEST_USERS)) {
      try {
        await registerViaApi({
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          userType: user.userType,
        });
        console.log(`Created test user: ${key}`);
      } catch (error: any) {
        // User might already exist, that's okay
        if (error.response?.status === 409 || error.response?.status === 400) {
          console.log(`Test user ${key} already exists, skipping...`);
        } else {
          console.warn(`Failed to create test user ${key}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.warn('Could not create test users (backend might not be running):', error);
  }
  
  console.log('Global setup complete.');
}

export default globalSetup;
