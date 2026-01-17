import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import {
  getUserProgressService,
  getUserProfileService,
  updateUserProfileService,
  getMeService,
  listUsersService,
  getUserDetailsService,
  updateUserRoleService,
  updateUserPointsService,
  toggleUserActiveService,
  resetUserPasswordService,
  setUserPasswordService,
  deleteUserService,
  getUserStatisticsService,
  getUserTimelineService,
  createUserByAdminService,
} from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendAdminCreatedUserEmail } from '../services/auth-email.service.js';
import { USER_ROLES, UserRole } from '../constants/enums.js';

export const getMe: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await getMeService(authReq.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

export const getUserProgress: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const progress = await getUserProgressService(req.params.id);
  res.json(progress);
});

export const getUserProfile: RequestHandler = asyncHandler(async (req, res) => {
  const profile = await getUserProfileService(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(profile);
});

export const updateUserProfile: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user || authReq.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const profile = await updateUserProfileService(req.params.id, req.body);
  res.json(profile);
});

export const listUsers: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const filters = {
    role: req.query.role as string | undefined,
    active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
    search: req.query.search as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
  };

  const result = await listUsersService(filters as any);
  res.json(result);
});

export const getUserDetails: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userDetails = await getUserDetailsService(req.params.id);
  if (!userDetails) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: userDetails });
});

export const updateUserRole: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { role } = req.body;
  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }

  const user = await updateUserRoleService(req.params.id, role, authReq.user.id);
  res.json({ user });
});

export const updateUserPoints: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { points } = req.body;
  if (typeof points !== 'number') {
    return res.status(400).json({ error: 'Points must be a number' });
  }

  const user = await updateUserPointsService(req.params.id, points);
  res.json({ user });
});

export const toggleUserActive: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await toggleUserActiveService(req.params.id, authReq.user.id);
  res.json({ user });
});

export const resetUserPassword: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const result = await resetUserPasswordService(req.params.id);
  res.json(result);
});

export const setUserPassword: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  await setUserPasswordService(req.params.id, password);
  res.json({ message: 'Password set successfully' });
});

export const deleteUser: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const hardDelete = req.query.hard === 'true';
  await deleteUserService(req.params.id, authReq.user.id, hardDelete);
  res.json({ success: true, message: hardDelete ? 'User permanently deleted' : 'User soft deleted' });
});

export const getUserStatistics: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const statistics = await getUserStatisticsService(req.params.id);
  res.json(statistics);
});

/**
 * GET /api/users/:id/timeline
 * Ruft den zeitlichen Verlauf von Punkten, Bäumen und CO2 für einen Benutzer ab
 */
export const getUserTimeline: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Benutzer kann nur seinen eigenen Timeline abrufen
  if (authReq.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden: You can only view your own timeline' });
  }

  const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
  const timeline = await getUserTimelineService(req.params.id, days);
  res.json(timeline);
});

export const createUserByAdmin: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, role, name } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!role || !(USER_ROLES as readonly string[]).includes(role)) {
    return res.status(400).json({ error: 'Valid role is required' });
  }

  try {
    // Create user without password and set as inactive
    const user = await createUserByAdminService(email, role as UserRole, name);

    // Send admin created user email (different from password setup email) - non-blocking
    sendAdminCreatedUserEmail(user.id, user.email!, user.name).catch((error) => {
      console.error('[CREATE_USER] Failed to send admin created user email:', error);
      // Continue anyway - user is created
    });

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully. Activation email has been sent.',
      user 
    });
  } catch (error: any) {
    if (error.message === 'User with this email already exists') {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }
});
