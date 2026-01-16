import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getFrontendUrlFromRequest } from '../utils/oauth.js';
import fs from 'fs';
import {
  createTeam,
  joinTeam,
  getUserTeams,
  getTeamDetails,
  contributePointsToTeam,
  redeemRewardFromTeam,
  dissolveTeam,
  leaveTeam,
  getTeamQrCode,
  getTeamTotalPoints,
  getUserActiveTeam,
  getTeamRanking,
  getAllTeams,
  updateTeam,
  enableTeamRegistration,
  getTeamRegistrationQrCode,
  generateTeamRegistrationQrCode,
  bulkUpdateTeamsStatus,
  bulkDeleteTeams,
  addTeamMembers,
  removeTeamMembers,
  getTeamMembersAdmin,
} from '../services/team.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * POST /api/teams/create
 * Erstellt ein neues Team
 * Body: { teamName?: string }
 */
export const createTeamController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { teamName } = req.body;
  
  const team = await createTeam(authReq.user.id, teamName);
  res.status(201).json(team);
});

/**
 * POST /api/teams/join
 * Tritt einem Team bei durch Scannen des Team-QR-Codes
 * Body: { teamQrToken: string }
 */
export const joinTeamController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { teamQrToken } = req.body;
  
  if (!teamQrToken || typeof teamQrToken !== 'string') {
    return res.status(400).json({ error: 'teamQrToken is required' });
  }
  
  const team = await joinTeam(authReq.user.id, teamQrToken);
  res.json(team);
});

/**
 * GET /api/teams
 * Ruft alle Teams des angemeldeten Benutzers ab
 */
export const getUserTeamsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const teams = await getUserTeams(authReq.user.id);
  res.json(teams);
});

/**
 * GET /api/teams/:id
 * Ruft Team-Details ab
 */
export const getTeamDetailsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  const teamDetails = await getTeamDetails(id, authReq.user.id);
  
  if (!teamDetails) {
    return res.status(404).json({ error: 'Team not found or access denied' });
  }
  
  res.json(teamDetails);
});

/**
 * POST /api/teams/:id/contribute
 * Trägt Punkte zum Team-Pool bei
 * Body: { points: number }
 */
export const contributePointsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  const { points } = req.body;
  
  if (!points || typeof points !== 'number' || points <= 0) {
    return res.status(400).json({ error: 'Valid points amount is required' });
  }
  
  await contributePointsToTeam(authReq.user.id, id, points);
  res.json({ success: true });
});

/**
 * POST /api/teams/:id/redeem
 * Löst eine Belohnung mit Team-Punkten ein
 * Body: { rewardId: string }
 */
export const redeemRewardController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  const { rewardId } = req.body;
  
  if (!rewardId || typeof rewardId !== 'string') {
    return res.status(400).json({ error: 'rewardId is required' });
  }
  
  const result = await redeemRewardFromTeam(id, rewardId, authReq.user.id);
  res.json(result);
});

/**
 * DELETE /api/teams/:id
 * Löst ein Team auf (nur Ersteller)
 */
export const dissolveTeamController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.controller.ts:146',message:'dissolveTeamController entry',data:{method:req.method,path:req.path,params:req.params,userId:authReq.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (!authReq.user) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.controller.ts:149',message:'dissolveTeamController unauthorized',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.controller.ts:153',message:'dissolveTeamController before dissolveTeam',data:{teamId:id,userId:authReq.user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  // Administratoren und Rezeption können Teams löschen, auch wenn sie nicht der Ersteller sind
  const isAdminOrRezeption = authReq.user.role === 'administrator' || authReq.user.role === 'rezeption';
  await dissolveTeam(id, authReq.user.id, isAdminOrRezeption);
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.controller.ts:154',message:'dissolveTeamController after dissolveTeam success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  res.json({ success: true });
});

/**
 * POST /api/teams/:id/leave
 * Tritt aus einem Team aus (nicht der Ersteller)
 */
export const leaveTeamController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  await leaveTeam(authReq.user.id, id);
  res.json({ success: true });
});

/**
 * GET /api/teams/:id/qr-code
 * Ruft den QR-Code eines Teams ab
 * Für Administratoren: Immer erlaubt
 * Für normale Benutzer: Nur wenn Mitglied
 */
export const getTeamQrCodeController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  
  // Administratoren und Rezeption haben immer Zugriff
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    // Prüfe ob Benutzer Mitglied ist
    const teamDetails = await getTeamDetails(id, authReq.user.id);
    if (!teamDetails) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }
  }
  
  const qrToken = await getTeamQrCode(id);
  
  if (!qrToken) {
    return res.status(404).json({ error: 'QR code not found' });
  }
  
  res.json({ qrToken });
});

/**
 * GET /api/teams/:id/total-points
 * Ruft den Gesamtbetrag aller Mitglieder eines Teams ab
 */
export const getTeamTotalPointsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  
  // Prüfe ob Benutzer Mitglied ist
  const teamDetails = await getTeamDetails(id, authReq.user.id);
  if (!teamDetails) {
    return res.status(404).json({ error: 'Team not found or access denied' });
  }
  
  const totalPoints = await getTeamTotalPoints(id);
  res.json({ totalPoints });
});

/**
 * GET /api/teams/active
 * Ruft das aktive Team des angemeldeten Benutzers ab (falls vorhanden)
 */
export const getUserActiveTeamController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const team = await getUserActiveTeam(authReq.user.id);
  
  if (!team) {
    return res.json(null);
  }
  
  // Berechne Gesamtbetrag
  const totalPoints = await getTeamTotalPoints(team.id);
  
  res.json({
    ...team,
    totalPoints,
  });
});

/**
 * GET /api/teams/:id/ranking
 * Ruft das Ranking eines Teams ab (sortiert nach Punkten)
 */
export const getTeamRankingController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  
  // Prüfe ob Benutzer Mitglied ist
  const teamDetails = await getTeamDetails(id, authReq.user.id);
  if (!teamDetails) {
    return res.status(404).json({ error: 'Team not found or access denied' });
  }
  
  const ranking = await getTeamRanking(id);
  res.json(ranking);
});

/**
 * GET /api/teams/all
 * Ruft alle Teams ab (nur für Administratoren)
 * Query: ?includeInactive=true
 */
export const getAllTeamsController: RequestHandler = asyncHandler(async (req, res) => {
  // #region agent log
  await import('fs').then(fs => fs.promises.appendFile('/Users/thomas/Development/4rest/.cursor/debug.log', JSON.stringify({location:'team.controller.ts:298',message:'getAllTeamsController called',data:{hasUser:!!(req as AuthRequest).user,userRole:(req as AuthRequest).user?.role,includeInactive:req.query.includeInactive},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n').catch(()=>{}));
  // #endregion
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    // #region agent log
    await import('fs').then(fs => fs.promises.appendFile('/Users/thomas/Development/4rest/.cursor/debug.log', JSON.stringify({location:'team.controller.ts:302',message:'getAllTeamsController unauthorized',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n').catch(()=>{}));
    // #endregion
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    // #region agent log
    await import('fs').then(fs => fs.promises.appendFile('/Users/thomas/Development/4rest/.cursor/debug.log', JSON.stringify({location:'team.controller.ts:306',message:'getAllTeamsController forbidden',data:{userRole:authReq.user.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n').catch(()=>{}));
    // #endregion
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const includeInactive = req.query.includeInactive === 'true';
  try {
    const teams = await getAllTeams({ includeInactive });
    // #region agent log
    await import('fs').then(fs => fs.promises.appendFile('/Users/thomas/Development/4rest/.cursor/debug.log', JSON.stringify({location:'team.controller.ts:312',message:'getAllTeamsController success',data:{teamsCount:teams?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n').catch(()=>{}));
    // #endregion
    res.json(teams);
  } catch (error: any) {
    // #region agent log
    await import('fs').then(fs => fs.promises.appendFile('/Users/thomas/Development/4rest/.cursor/debug.log', JSON.stringify({location:'team.controller.ts:316',message:'getAllTeamsController error',data:{error:error?.message,stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n').catch(()=>{}));
    // #endregion
    throw error;
  }
});

/**
 * PUT /api/teams/:id
 * Aktualisiert Team-Daten (nur für Administratoren)
 */
export const updateTeamController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const { id } = req.params;
  const { name, active } = req.body;
  
  const team = await updateTeam(id, { name, active });
  res.json(team);
});

/**
 * POST /api/teams/:id/registration/enable
 * Aktiviert oder deaktiviert die Registrierung für ein Team (nur für Administratoren)
 */
export const enableTeamRegistrationController: RequestHandler = asyncHandler(async (req, res) => {
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
  
  await enableTeamRegistration(id, enabled);
  res.json({ success: true });
});

/**
 * GET /api/teams/:id/registration-qr-code
 * Ruft den Registrierungs-QR-Code eines Teams ab (nur für Administratoren)
 */
export const getTeamRegistrationQrCodeController: RequestHandler = asyncHandler(async (req, res) => {
  // #region agent log
  const logPath='/Users/thomas/Development/4rest/.cursor/debug.log';try{fs.appendFileSync(logPath,JSON.stringify({location:'team.controller.ts:358',message:'getTeamRegistrationQrCodeController entry',data:{method:req.method,path:req.path,params:req.params,userId:(req as any).user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');}catch(e){}
  // #endregion
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    // #region agent log
    try{fs.appendFileSync(logPath,JSON.stringify({location:'team.controller.ts:361',message:'getTeamRegistrationQrCodeController unauthorized',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');}catch(e){}
    // #endregion
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    // #region agent log
    try{fs.appendFileSync(logPath,JSON.stringify({location:'team.controller.ts:365',message:'getTeamRegistrationQrCodeController forbidden',data:{userRole:authReq.user.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');}catch(e){}
    // #endregion
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const { id } = req.params;
  // #region agent log
  try{fs.appendFileSync(logPath,JSON.stringify({location:'team.controller.ts:370',message:'getTeamRegistrationQrCodeController before getTeamRegistrationQrCode',data:{teamId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
  // #endregion
  const registrationQr = await getTeamRegistrationQrCode(id);
  // #region agent log
  try{fs.appendFileSync(logPath,JSON.stringify({location:'team.controller.ts:372',message:'getTeamRegistrationQrCodeController after getTeamRegistrationQrCode',data:{hasQrToken:!!registrationQr.qrToken,enabled:registrationQr.enabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');}catch(e){}
  // #endregion
  
  if (!registrationQr.qrToken) {
    // #region agent log
    try{fs.appendFileSync(logPath,JSON.stringify({location:'team.controller.ts:374',message:'getTeamRegistrationQrCodeController no qrToken found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');}catch(e){}
    // #endregion
    return res.status(404).json({ error: 'Registration QR code not found. Enable registration first.' });
  }
  
  const frontendUrl = getFrontendUrlFromRequest(req);
  // #region agent log
  try{fs.appendFileSync(logPath,JSON.stringify({location:'team.controller.ts:394',message:'getTeamRegistrationQrCodeController frontendUrl determined',data:{frontendUrl,hasEnvVar:!!(process.env.FRONTEND_URL||process.env.APP_URL),reqHost:req.headers?.host,reqProtocol:req.protocol},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');}catch(e){}
  // #endregion
  const registrationUrl = `${frontendUrl}/register?team=${registrationQr.qrToken}`;
  // #region agent log
  try{fs.appendFileSync(logPath,JSON.stringify({location:'team.controller.ts:397',message:'getTeamRegistrationQrCodeController returning response',data:{qrToken:registrationQr.qrToken,registrationUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');}catch(e){}
  // #endregion
  
  res.json({
    qrToken: registrationQr.qrToken,
    enabled: registrationQr.enabled,
    registrationUrl,
  });
});

/**
 * POST /api/teams/bulk/status
 * Aktualisiert den Status mehrerer Teams (Bulk-Operation, nur für Administratoren)
 * Body: { teamIds: string[], active: boolean }
 */
export const bulkUpdateTeamsStatusController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Forbidden: Administrator access required' });
  }
  
  const { teamIds, active } = req.body;
  
  if (!Array.isArray(teamIds) || teamIds.length === 0) {
    return res.status(400).json({ error: 'teamIds must be a non-empty array' });
  }
  
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'active must be a boolean' });
  }
  
  await bulkUpdateTeamsStatus(teamIds, active);
  res.json({ success: true });
});

/**
 * POST /api/teams/bulk/delete
 * Löscht mehrere Teams (Bulk-Operation, nur für Administratoren)
 * Body: { teamIds: string[] }
 */
export const bulkDeleteTeamsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Forbidden: Administrator access required' });
  }
  
  const { teamIds } = req.body;
  
  if (!Array.isArray(teamIds) || teamIds.length === 0) {
    return res.status(400).json({ error: 'teamIds must be a non-empty array' });
  }
  
  await bulkDeleteTeams(teamIds);
  res.json({ success: true });
});

/**
 * GET /api/teams/:id/members
 * Ruft alle Mitglieder eines Teams ab (nur für Administratoren)
 */
export const getTeamMembersAdminController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'administrator' && authReq.user.role !== 'rezeption') {
    return res.status(403).json({ error: 'Forbidden: Administrator or Rezeption access required' });
  }
  
  const { id } = req.params;
  
  const members = await getTeamMembersAdmin(id);
  res.json(members);
});

/**
 * POST /api/teams/:id/members/add
 * Fügt Benutzer zu einem Team hinzu (nur für Administratoren)
 * Body: { userIds: string[] }
 */
export const addTeamMembersController: RequestHandler = asyncHandler(async (req, res) => {
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
  
  await addTeamMembers(id, userIds);
  res.json({ success: true });
});

/**
 * POST /api/teams/:id/members/remove
 * Entfernt Benutzer aus einem Team (nur für Administratoren)
 * Body: { userIds: string[] }
 */
export const removeTeamMembersController: RequestHandler = asyncHandler(async (req, res) => {
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
  
  await removeTeamMembers(id, userIds);
  res.json({ success: true });
});
