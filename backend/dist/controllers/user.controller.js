import { getUserProgressService, getUserProfileService, updateUserProfileService, getMeService, updatePlayerProfileForMeService, listUsersService, getUserDetailsService, updateUserRoleService, updateUserPointsService, toggleUserActiveService, resetUserPasswordService, setUserPasswordService, deleteUserService, getUserStatisticsService, getUserTimelineService, createUserByAdminService, } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendAdminCreatedUserEmail } from '../services/auth-email.service.js';
import { USER_ROLES } from '../constants/enums.js';
export const getMe = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await getMeService(authReq.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
});
/** PATCH /users/me/player-profile – Spielerprofilierung (Dyaden, Skip, Anzeigename) */
export const updateMyPlayerProfile = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const user = await updatePlayerProfileForMeService(authReq.user.id, req.body ?? {});
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Bad request';
        res.status(400).json({ error: message });
    }
});
export const getUserProgress = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const progress = await getUserProgressService(req.params.id);
    res.json(progress);
});
export const getUserProfile = asyncHandler(async (req, res) => {
    const profile = await getUserProfileService(req.params.id);
    if (!profile) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(profile);
});
export const updateUserProfile = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user || authReq.user.id !== req.params.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const profile = await updateUserProfileService(req.params.id, req.body);
    res.json(profile);
});
export const listUsers = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const filters = {
        role: req.query.role,
        active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
        search: req.query.search,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
    };
    const result = await listUsersService(filters);
    res.json(result);
});
export const getUserDetails = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userDetails = await getUserDetailsService(req.params.id);
    if (!userDetails) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: userDetails });
});
export const updateUserRole = asyncHandler(async (req, res) => {
    const authReq = req;
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
export const updateUserPoints = asyncHandler(async (req, res) => {
    const authReq = req;
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
export const toggleUserActive = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await toggleUserActiveService(req.params.id, authReq.user.id);
    res.json({ user });
});
export const resetUserPassword = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await resetUserPasswordService(req.params.id);
    res.json(result);
});
export const setUserPassword = asyncHandler(async (req, res) => {
    const authReq = req;
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
export const deleteUser = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    await deleteUserService(req.params.id, authReq.user.id, true);
    res.json({ success: true, message: 'User permanently deleted' });
});
export const getUserStatistics = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const statistics = await getUserStatisticsService(req.params.id);
    res.json(statistics);
});
/**
 * GET /api/users/:id/timeline
 * Kumulierter Punkteverlauf nach Kategorie von Registrierung bis heute (ein Eintrag pro Kalendertag).
 */
export const getUserTimeline = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Benutzer kann nur seinen eigenen Timeline abrufen
    if (authReq.user.id !== req.params.id) {
        return res.status(403).json({ error: 'Forbidden: You can only view your own timeline' });
    }
    const timeline = await getUserTimelineService(req.params.id);
    res.json(timeline);
});
export const createUserByAdmin = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { email, role, name } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    if (!role || !USER_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Valid role is required' });
    }
    try {
        // Create user without password and set as inactive
        const user = await createUserByAdminService(email, role, name);
        // Send admin created user email (different from password setup email) - non-blocking
        sendAdminCreatedUserEmail(user.id, user.email, user.name).catch((error) => {
            console.error('[CREATE_USER] Failed to send admin created user email:', error);
            // Continue anyway - user is created
        });
        res.status(201).json({
            success: true,
            message: 'User created successfully. Activation email has been sent.',
            user
        });
    }
    catch (error) {
        if (error.message === 'User with this email already exists') {
            return res.status(400).json({ error: error.message });
        }
        throw error;
    }
});
//# sourceMappingURL=user.controller.js.map