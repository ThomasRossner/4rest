import { z } from 'zod';
import { USER_ROLES, USER_TYPES } from '../constants/enums.js';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum([...USER_ROLES]).optional(),
  userType: z.enum([...USER_TYPES]).optional(),
  preferredLanguage: z.enum(['de', 'en']).optional(),
});
