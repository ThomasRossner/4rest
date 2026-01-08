import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
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
} from '../services/contest.service.js';
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
  
  const contests = await getUserContests(authReq.user.id);
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
  
  const contests = await getAllUserContests(authReq.user.id);
  res.json(contests);
});

/**
 * GET /api/contests/employee
 * Ruft alle Contests für Mitarbeitende ab (nur Contests mit Gästen und Stakeholdern)
 */
export const getEmployeeContestsController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (authReq.user.role !== 'employee' && authReq.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Forbidden: Only employees and administrators can access this endpoint' });
  }
  
  const contests = await getEmployeeContests(authReq.user.id);
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
  const contestDetails = await getContestDetails(id, authReq.user.id);
  
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
  await dissolveContest(id, authReq.user.id);
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
 */
export const getContestQrCodeController: RequestHandler = asyncHandler(async (req, res) => {
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
  
  const qrToken = await getContestQrCode(id);
  
  if (!qrToken) {
    return res.status(404).json({ error: 'QR code not found' });
  }
  
  res.json({ qrToken });
});

