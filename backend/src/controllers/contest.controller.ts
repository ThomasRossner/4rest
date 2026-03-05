import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getFrontendUrlFromRequest } from '../utils/oauth.js';
import {
  createContest,
  joinContest,
  getUserContests,
  getAllUserContests,
  getEmployeeContests,
  getContestDetails,
  getContestRanking,
  dissolveContest,
  leaveContest,
  getContestQrCode,
  getAllContests,
  updateContest,
  enableContestRegistration,
  getContestRegistrationQrCode,
  generateContestRegistrationQrCode,
  bulkUpdateContestsStatus,
  bulkDeleteContests,
  addContestParticipants,
  removeContestParticipants,
  getContestParticipantsAdmin,
} from '../services/contest.service.js';
import { getPreferredLanguage } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * POST /api/contests/create
 * Erstellt einen neuen Contest
 * Body: { startDate: string (ISO), endDate: string (ISO), contestName?: string, rewards?: { reward_first_place?: number, reward_second_place?: number, reward_third_place?: number } }
 */
export const createContestController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { startDate, endDate, contestName, rewards, participantIds } = req.body;
  
  if (!startDate || typeof startDate !== 'string') {
    return res.status(400).json({ error: 'startDate is required (ISO string)' });
  }
  
  if (!endDate || typeof endDate !== 'string') {
    return res.status(400).json({ error: 'endDate is required (ISO string)' });
  }
  
  const startDateObj = new Date(startDate);
  if (isNaN(startDateObj.getTime())) {
    return res.status(400).json({ error: 'Invalid startDate format' });
  }
  
  const endDateObj = new Date(endDate);
  if (isNaN(endDateObj.getTime())) {
    return res.status(400).json({ error: 'Invalid endDate format' });
  }
  
  // Validate participantIds if provided
  if (participantIds !== undefined) {
    if (!Array.isArray(participantIds)) {
      return res.status(400).json({ error: 'participantIds must be an array' });
    }
    if (!participantIds.every((id: any) => typeof id === 'string')) {
      return res.status(400).json({ error: 'All participantIds must be strings' });
    }
  }
  
  const contest = await createContest(
    authReq.user.id,
    startDateObj,
    endDateObj,
    contestName,
    rewards,
    participantIds
  );
  
  res.status(201).json(contest);
});

/**
 * POST /api/contests/join
 * Tritt einem Contest bei durch Scannen des Contest-QR-Codes
 * Body: { contestQrToken: string }
 */
export const joinContestController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { contestQrToken } = req.body;
  
  if (!contestQrToken || typeof contestQrToken !== 'string') {
    return res.status(400).json({ error: 'contestQrToken is required' });
  }
  
  const contest = await joinContest(authReq.user.id, contestQrToken);
  res.json(contest);
});

/**
 * GET /api/contests
 * Ruft alle Contests des angemeldeten Benutzers ab (nur aktive, nicht abgelaufene)
 */
export const getUserContestsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const preferredLanguage = await getPreferredLanguage(authReq.user.id);
  const contests = await getUserContests(authReq.user.id, preferredLanguage ?? undefined);
  res.json(contests);
});

/**
 * GET /api/contests/all
 * Ruft alle Contests des angemeldeten Benutzers ab (inkl. abgelaufene) - für Rankings-Seite
 */
export const getAllUserContestsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const preferredLanguage = await getPreferredLanguage(authReq.user.id);
  const contests = await getAllUserContests(authReq.user.id, preferredLanguage ?? undefined);
  res.json(contests);
});

/**
 * GET /api/contests/employee
 * Ruft alle Contests für Front Office ab (nur Contests mit Gästen)
 */
export const getEmployeeContestsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (authReq.user.role !== 'rezeption' && authReq.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Forbidden: Only rezeption and administrators can access this endpoint' });
  }
  const preferredLanguage = await getPreferredLanguage(authReq.user.id);
  const contests = await getEmployeeContests(authReq.user.id, preferredLanguage ?? undefined);
  res.json(contests);
});

/**
 * GET /api/contests/:id
 * Ruft Contest-Details ab
 */
export const getContestDetailsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.params;
  const preferredLanguage = await getPreferredLanguage(authReq.user.id);
  const contestDetails = await getContestDetails(id, authReq.user.id, preferredLanguage ?? undefined);
  if (!contestDetails) {
    return res.status(404).json({ error: 'Contest not found or access denied' });
  }
  res.json(contestDetails);
});

/**
 * GET /api/contests/:id/ranking
 * Ruft das Ranking eines Contests ab
 */
export const getContestRankingController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  
  // Prüfe ob Benutzer Teilnehmer ist
  const contestDetails = await getContestDetails(id, authReq.user.id);
  if (!contestDetails) {
    return res.status(404).json({ error: 'Contest not found or access denied' });
  }
  
  const ranking = await getContestRanking(id);
  res.json(ranking);
});

/**
 * DELETE /api/contests/:id
 * Löst einen Contest auf (nur Ersteller)
 */
export const dissolveContestController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  
  // Administratoren und Rezeption können Wettbewerbe löschen, auch wenn sie nicht der Ersteller sind
  const isAdminOrRezeption = authReq.user.role === 'administrator' || authReq.user.role === 'rezeption';
  await dissolveContest(id, authReq.user.id, isAdminOrRezeption);
  res.json({ success: true });
});

/**
 * POST /api/contests/:id/leave
 * Verlässt einen Contest (entfernt Benutzer als Teilnehmer)
 */
export const leaveContestController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  await leaveContest(id, authReq.user.id);
  res.json({ success: true });
});

/**
 * GET /api/contests/:id/qr-code
 * Ruft den QR-Code eines Contests ab
 * Für Administratoren: Immer erlaubt
 * Für normale Benutzer: Nur wenn Teilnehmer
 */
export const getContestQrCodeController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  
  // Administratoren und Rezeption haben immer Zugriff
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    // Prüfe ob Benutzer Teilnehmer ist
    const contestDetails = await getContestDetails(id, authReq.user.id);
    if (!contestDetails) {
      return res.status(404).json({ error: 'Contest not found or access denied' });
    }
  }
  
  const qrToken = await getContestQrCode(id);
  
  if (!qrToken) {
    return res.status(404).json({ error: 'QR code not found' });
  }
  
  res.json({ qrToken });
});

/**
 * GET /api/contests/admin/all
 * Ruft alle Contests ab (nur für Administratoren)
 * Query: ?includeInactive=true
 */
export const getAllContestsAdminController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const includeInactive = req.query.includeInactive === 'true';
  const preferredLanguage = await getPreferredLanguage(authReq.user.id);
  const contests = await getAllContests({ includeInactive, preferredLanguage: preferredLanguage ?? undefined });
  res.json(contests);
});

/**
 * PUT /api/contests/:id
 * Aktualisiert Contest-Daten (nur für Administratoren)
 */
export const updateContestController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const { id } = req.params;
  const { name, name_i18n, active, endDate } = req.body;
  
  const updateData: any = {};
  if (name_i18n !== undefined) updateData.name_i18n = name_i18n;
  if (name !== undefined) updateData.name = name;
  if (active !== undefined) updateData.active = active;
  if (endDate !== undefined) {
    const endDateObj = new Date(endDate);
    if (isNaN(endDateObj.getTime())) {
      return res.status(400).json({ error: 'Invalid endDate format' });
    }
    updateData.end_date = endDateObj;
  }
  
  const contest = await updateContest(id, updateData);
  res.json(contest);
});

/**
 * POST /api/contests/:id/registration/enable
 * Aktiviert oder deaktiviert die Registrierung für einen Contest (nur für Administratoren)
 */
export const enableContestRegistrationController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const { id } = req.params;
  const { enabled } = req.body;
  
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled must be a boolean' });
  }
  
  await enableContestRegistration(id, enabled);
  res.json({ success: true });
});

/**
 * GET /api/contests/:id/registration-qr-code
 * Ruft den Registrierungs-QR-Code eines Contests ab (nur für Administratoren)
 * Generiert automatisch einen QR-Code, falls noch keiner existiert
 */
export const getContestRegistrationQrCodeController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const { id } = req.params;
  
  let registrationQr = await getContestRegistrationQrCode(id);
  
  // Wenn kein QR-Code existiert, generiere einen neuen
  if (!registrationQr.qrToken) {
    try {
      const qrToken = await generateContestRegistrationQrCode(id);
      registrationQr = await getContestRegistrationQrCode(id);
    } catch (error: any) {
      return res.status(400).json({ 
        error: error.message || 'Failed to generate registration QR code. Contest may not exist or be inactive.' 
      });
    }
  }
  
  if (!registrationQr.qrToken) {
    return res.status(404).json({ error: 'Registration QR code not found. Enable registration first.' });
  }
  
  const frontendUrl = getFrontendUrlFromRequest(req);
  const registrationUrl = `${frontendUrl}/register?contest=${registrationQr.qrToken}`;
  
  res.json({
    qrToken: registrationQr.qrToken,
    enabled: registrationQr.enabled,
    registrationUrl,
  });
});

/**
 * POST /api/contests/bulk/status
 * Aktualisiert den Status mehrerer Contests (Bulk-Operation, nur für Administratoren)
 * Body: { contestIds: string[], active: boolean }
 */
export const bulkUpdateContestsStatusController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Forbidden: Administrator access required' });
  }
  
  const { contestIds, active } = req.body;
  
  if (!Array.isArray(contestIds) || contestIds.length === 0) {
    return res.status(400).json({ error: 'contestIds must be a non-empty array' });
  }
  
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'active must be a boolean' });
  }
  
  await bulkUpdateContestsStatus(contestIds, active);
  res.json({ success: true });
});

/**
 * POST /api/contests/bulk/delete
 * Löscht mehrere Contests (Bulk-Operation, nur für Administratoren)
 * Body: { contestIds: string[] }
 */
export const bulkDeleteContestsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Forbidden: Administrator access required' });
  }
  
  const { contestIds } = req.body;
  
  if (!Array.isArray(contestIds) || contestIds.length === 0) {
    return res.status(400).json({ error: 'contestIds must be a non-empty array' });
  }
  
  await bulkDeleteContests(contestIds);
  res.json({ success: true });
});

/**
 * GET /api/contests/:id/participants
 * Ruft alle Teilnehmer eines Contests ab (nur für Administratoren)
 */
export const getContestParticipantsAdminController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const { id } = req.params;
  
  const participants = await getContestParticipantsAdmin(id);
  res.json(participants);
});

/**
 * POST /api/contests/:id/participants/add
 * Fügt Benutzer zu einem Contest hinzu (nur für Administratoren)
 * Body: { userIds: string[] }
 */
export const addContestParticipantsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const { id } = req.params;
  const { userIds } = req.body;
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds must be a non-empty array' });
  }
  
  await addContestParticipants(id, userIds);
  res.json({ success: true });
});

/**
 * POST /api/contests/:id/participants/remove
 * Entfernt Benutzer aus einem Contest (nur für Administratoren)
 * Body: { userIds: string[] }
 */
export const removeContestParticipantsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const { id } = req.params;
  const { userIds } = req.body;
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds must be a non-empty array' });
  }
  
  await removeContestParticipants(id, userIds);
  res.json({ success: true });
});
