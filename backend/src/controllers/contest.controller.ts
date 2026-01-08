import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import {
  createContest,
  joinContest,
  getUserContests,
  getContestDetails,
  getContestRanking,
  dissolveContest,
  getContestQrCode,
} from '../services/contest.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * POST /api/contests/create
 * Erstellt einen neuen Contest
 * Body: { endDate: string (ISO), contestName?: string, rewards?: { reward_first_place?: number, reward_second_place?: number, reward_third_place?: number } }
 */
export const createContestController: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { endDate, contestName, rewards } = req.body;
  
  if (!endDate || typeof endDate !== 'string') {
    return res.status(400).json({ error: 'endDate is required (ISO string)' });
  }
  
  const endDateObj = new Date(endDate);
  if (isNaN(endDateObj.getTime())) {
    return res.status(400).json({ error: 'Invalid endDate format' });
  }
  
  const contest = await createContest(
    authReq.user.id,
    endDateObj,
    contestName,
    rewards
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
 * Ruft alle Contests des angemeldeten Benutzers ab
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

