import { getPool } from '../database/connection.js';
import { getUserById } from './user.service.js';
import { generateQrToken } from './user-qr.service.js';
import { UserRole } from '../constants/enums.js';

export interface Contest {
  id: string;
  name: string | null;
  created_by: string;
  end_date: Date;
  reward_first_place: number | null;
  reward_second_place: number | null;
  reward_third_place: number | null;
  created_at: Date;
  updated_at: Date;
  active: boolean;
}

export interface ContestParticipant {
  id: string;
  contest_id: string;
  user_id: string;
  points: number;
  joined_at: Date;
  user_name?: string;
  user_email?: string | null;
}

export interface ContestDetails extends Contest {
  participants: ContestParticipant[];
  creator_name: string;
  creator_email: string | null;
  user_rank?: number | null;
  user_points?: number | null;
}

export interface ContestRankingEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_email: string | null;
  points: number;
}

export interface ContestRewards {
  reward_first_place: number | null;
  reward_second_place: number | null;
  reward_third_place: number | null;
}

/**
 * Erstellt einen neuen Contest (nur Ersteller als Teilnehmer)
 */
export async function createContest(
  creatorId: string,
  endDate: Date,
  contestName?: string,
  rewards?: ContestRewards
): Promise<Contest> {
  const db = getPool();
  
  // Prüfe ob Benutzer existiert
  const creator = await getUserById(creatorId);
  
  if (!creator) {
    throw new Error('Creator user not found');
  }
  
  // Prüfe ob Enddatum in der Zukunft liegt
  if (endDate <= new Date()) {
    throw new Error('End date must be in the future');
  }
  
  // Prüfe ob Ersteller Mitarbeiter ist (für Belohnungen)
  if (rewards && (rewards.reward_first_place || rewards.reward_second_place || rewards.reward_third_place)) {
    if (creator.role !== 'employee' && creator.role !== 'administrator') {
      throw new Error('Only employees and administrators can create contests with rewards');
    }
  }
  
  // Erstelle Contest
  const finalContestName = contestName || `Contest ${creator.name}`;
  const contestResult = await db.query(
    `INSERT INTO contests (created_by, name, end_date, reward_first_place, reward_second_place, reward_third_place) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [
      creatorId,
      finalContestName,
      endDate,
      rewards?.reward_first_place || null,
      rewards?.reward_second_place || null,
      rewards?.reward_third_place || null,
    ]
  );
  
  const contest = contestResult.rows[0];
  
  // Füge Ersteller als Teilnehmer hinzu
  await db.query(
    'INSERT INTO contest_participants (contest_id, user_id) VALUES ($1, $2)',
    [contest.id, creatorId]
  );
  
  // Generiere QR-Code für Contest
  await generateContestQrCode(contest.id);
  
  return contest;
}

/**
 * Tritt einem Contest bei durch Scannen des Contest-QR-Codes
 */
export async function joinContest(userId: string, contestQrToken: string): Promise<Contest> {
  const db = getPool();
  
  // Finde Contest über QR-Token
  const qrResult = await db.query(
    'SELECT contest_id FROM contest_qr_codes WHERE qr_token = $1',
    [contestQrToken]
  );
  
  if (qrResult.rows.length === 0) {
    throw new Error('Invalid contest QR code');
  }
  
  const contestId = qrResult.rows[0].contest_id;
  
  // Prüfe ob Contest noch aktiv ist und nicht abgelaufen
  const contestResult = await db.query(
    'SELECT * FROM contests WHERE id = $1 AND active = TRUE AND end_date > NOW()',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    throw new Error('Contest not found, inactive, or expired');
  }
  
  const contest = contestResult.rows[0];
  
  // Prüfe ob Benutzer bereits Teilnehmer ist
  const existingParticipant = await db.query(
    'SELECT id FROM contest_participants WHERE contest_id = $1 AND user_id = $2',
    [contestId, userId]
  );
  
  if (existingParticipant.rows.length > 0) {
    throw new Error('User is already a participant in this contest');
  }
  
  // Füge Benutzer als Teilnehmer hinzu
  await db.query(
    'INSERT INTO contest_participants (contest_id, user_id) VALUES ($1, $2)',
    [contestId, userId]
  );
  
  return contest;
}

/**
 * Ruft alle Contests eines Benutzers ab
 */
export async function getUserContests(userId: string): Promise<Contest[]> {
  const db = getPool();
  
  const result = await db.query(
    `SELECT c.* FROM contests c
     INNER JOIN contest_participants cp ON cp.contest_id = c.id
     WHERE cp.user_id = $1 AND c.active = TRUE
     ORDER BY c.end_date ASC`,
    [userId]
  );
  
  return result.rows;
}

/**
 * Ruft Contest-Details mit Teilnehmern und Ranking ab
 */
export async function getContestDetails(contestId: string, userId: string): Promise<ContestDetails | null> {
  const db = getPool();
  
  // Prüfe ob Benutzer Teilnehmer ist
  const participantCheck = await db.query(
    'SELECT points FROM contest_participants WHERE contest_id = $1 AND user_id = $2',
    [contestId, userId]
  );
  
  if (participantCheck.rows.length === 0) {
    return null;
  }
  
  const userPoints = participantCheck.rows[0].points;
  
  // Hole Contest-Informationen
  const contestResult = await db.query(
    'SELECT * FROM contests WHERE id = $1',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    return null;
  }
  
  const contest = contestResult.rows[0];
  
  // Hole Ersteller-Informationen
  const creatorResult = await db.query(
    'SELECT name, email FROM users WHERE id = $1',
    [contest.created_by]
  );
  const creator = creatorResult.rows[0];
  
  // Hole Teilnehmer
  const participantsResult = await db.query(
    `SELECT cp.*, u.name as user_name, u.email as user_email
     FROM contest_participants cp
     INNER JOIN users u ON u.id = cp.user_id
     WHERE cp.contest_id = $1
     ORDER BY cp.points DESC, cp.joined_at ASC`,
    [contestId]
  );
  
  // Berechne Rang des Benutzers
  let userRank: number | null = null;
  for (let i = 0; i < participantsResult.rows.length; i++) {
    if (participantsResult.rows[i].user_id === userId) {
      userRank = i + 1;
      break;
    }
  }
  
  return {
    ...contest,
    participants: participantsResult.rows,
    creator_name: creator?.name || 'Unknown',
    creator_email: creator?.email || null,
    user_rank: userRank,
    user_points: userPoints,
  };
}

/**
 * Ruft das Ranking eines Contests ab
 */
export async function getContestRanking(contestId: string): Promise<ContestRankingEntry[]> {
  const db = getPool();
  
  const result = await db.query(
    `SELECT 
       cp.user_id,
       u.name as user_name,
       u.email as user_email,
       cp.points,
       ROW_NUMBER() OVER (ORDER BY cp.points DESC, cp.joined_at ASC) as rank
     FROM contest_participants cp
     INNER JOIN users u ON u.id = cp.user_id
     WHERE cp.contest_id = $1
     ORDER BY cp.points DESC, cp.joined_at ASC`,
    [contestId]
  );
  
  return result.rows.map((row) => ({
    rank: parseInt(row.rank, 10),
    user_id: row.user_id,
    user_name: row.user_name,
    user_email: row.user_email,
    points: row.points,
  }));
}

/**
 * Aktualisiert die Punkte eines Benutzers in einem Contest
 * Wird automatisch aufgerufen, wenn ein Benutzer eine Aufgabe abschließt
 */
export async function updateContestPoints(userId: string, contestId: string, points: number): Promise<void> {
  const db = getPool();
  
  if (points <= 0) {
    return; // Keine negativen oder null Punkte
  }
  
  // Prüfe ob Contest noch aktiv ist
  const contestResult = await db.query(
    'SELECT id, end_date FROM contests WHERE id = $1 AND active = TRUE AND end_date > NOW()',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    return; // Contest ist nicht aktiv oder abgelaufen
  }
  
  // Prüfe ob Benutzer Teilnehmer ist
  const participantCheck = await db.query(
    'SELECT id FROM contest_participants WHERE contest_id = $1 AND user_id = $2',
    [contestId, userId]
  );
  
  if (participantCheck.rows.length === 0) {
    return; // Benutzer ist kein Teilnehmer
  }
  
  // Aktualisiere Punkte
  await db.query(
    'UPDATE contest_participants SET points = points + $1 WHERE contest_id = $2 AND user_id = $3',
    [points, contestId, userId]
  );
}

/**
 * Vergibt Belohnungen nach Contest-Ende
 * Sollte von einem Cron-Job oder manuell aufgerufen werden
 */
export async function awardContestRewards(contestId: string): Promise<void> {
  const db = getPool();
  
  // Hole Contest-Informationen
  const contestResult = await db.query(
    'SELECT * FROM contests WHERE id = $1',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    throw new Error('Contest not found');
  }
  
  const contest = contestResult.rows[0];
  
  // Prüfe ob Contest bereits beendet ist
  if (new Date(contest.end_date) > new Date()) {
    throw new Error('Contest has not ended yet');
  }
  
  // Prüfe ob Belohnungen definiert sind
  if (!contest.reward_first_place && !contest.reward_second_place && !contest.reward_third_place) {
    return; // Keine Belohnungen definiert
  }
  
  // Hole Top 3 Teilnehmer
  const ranking = await getContestRanking(contestId);
  
  if (ranking.length === 0) {
    return; // Keine Teilnehmer
  }
  
  // Beginne Transaktion
  await db.query('BEGIN');
  
  try {
    // Vergib Belohnungen
    if (ranking.length >= 1 && contest.reward_first_place) {
      await db.query(
        'UPDATE users SET points = points + $1 WHERE id = $2',
        [contest.reward_first_place, ranking[0].user_id]
      );
    }
    
    if (ranking.length >= 2 && contest.reward_second_place) {
      await db.query(
        'UPDATE users SET points = points + $1 WHERE id = $2',
        [contest.reward_second_place, ranking[1].user_id]
      );
    }
    
    if (ranking.length >= 3 && contest.reward_third_place) {
      await db.query(
        'UPDATE users SET points = points + $1 WHERE id = $2',
        [contest.reward_third_place, ranking[2].user_id]
      );
    }
    
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

/**
 * Löst einen Contest auf (nur Ersteller)
 */
export async function dissolveContest(contestId: string, userId: string): Promise<void> {
  const db = getPool();
  
  // Prüfe ob Benutzer der Ersteller ist
  const contestResult = await db.query(
    'SELECT created_by FROM contests WHERE id = $1',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    throw new Error('Contest not found');
  }
  
  const contest = contestResult.rows[0];
  
  if (contest.created_by !== userId) {
    throw new Error('Only the contest creator can dissolve the contest');
  }
  
  // Deaktiviere Contest
  // Punkte bleiben auf den persönlichen Konten (wie spezifiziert)
  await db.query(
    'UPDATE contests SET active = FALSE, updated_at = NOW() WHERE id = $1',
    [contestId]
  );
}

/**
 * Generiert einen QR-Code für einen Contest
 */
export async function generateContestQrCode(contestId: string): Promise<string> {
  const db = getPool();
  
  // Prüfe ob bereits ein QR-Code existiert
  const existing = await db.query(
    'SELECT qr_token FROM contest_qr_codes WHERE contest_id = $1',
    [contestId]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].qr_token;
  }
  
  // Erstelle neuen QR-Code
  const qrToken = generateQrToken();
  await db.query(
    'INSERT INTO contest_qr_codes (contest_id, qr_token) VALUES ($1, $2)',
    [contestId, qrToken]
  );
  
  return qrToken;
}

/**
 * Ruft den QR-Code eines Contests ab
 */
export async function getContestQrCode(contestId: string): Promise<string | null> {
  const db = getPool();
  
  const result = await db.query(
    'SELECT qr_token FROM contest_qr_codes WHERE contest_id = $1',
    [contestId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0].qr_token;
}

