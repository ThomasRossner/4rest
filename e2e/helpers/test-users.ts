export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'guest' | 'front_office' | 'employee' | 'administrator' | 'stakeholder';
  userType?: 'explorer' | 'collector' | 'champion';
}

export const TEST_USERS: Record<string, TestUser> = {
  guest: {
    email: 'guest@test.com',
    password: 'Test123!',
    name: 'Test Guest',
    role: 'guest',
    userType: 'explorer',
  },
  employee: {
    email: 'employee@test.com',
    password: 'Test123!',
    name: 'Test Employee',
    role: 'front_office',
    userType: 'explorer',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123!',
    name: 'Test Admin',
    role: 'administrator',
    userType: 'explorer',
  },
  stakeholder: {
    email: 'stakeholder@test.com',
    password: 'Test123!',
    name: 'Test Stakeholder',
    role: 'stakeholder',
    userType: 'explorer',
  },
};

export function getTestUser(key: keyof typeof TEST_USERS): TestUser {
  return TEST_USERS[key];
}
