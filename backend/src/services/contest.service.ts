import { getPool } from '../database/connection.js';
import { getUserById } from './user.service.js';
import { generateQrToken } from './user-qr.service.js';
import { UserRole } from '../constants/enums.js';

export interface Contest {
  id: string;
  name: string | null;
  created_by: string;
  start_date: Date;
  end_date: Date;
  reward_first_place: number | null;
  reward_second_place: number | null;
  reward_third_place: number | null;
  rewards_awarded?: boolean;
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
  startDate: Date,
  endDate: Date,
  contestName?: string,
  rewards?: ContestRewards,
  participantIds?: string[]
): Promise<Contest> {
  const db = getPool();
  
  // Prüfe ob Benutzer existiert
  const creator = await getUserById(creatorId);
  
  if (!creator) {
    throw new Error('Creator user not found');
  }
  
  // Prüfe ob Startdatum vor Enddatum liegt
  if (startDate >= endDate) {
    throw new Error('Start date must be before end date');
  }
  
  // Prüfe ob Enddatum in der Zukunft liegt
  if (endDate <= new Date()) {
    throw new Error('End date must be in the future');
  }
  
  // Prüfe ob Ersteller Rezeption ist (für Belohnungen)
  if (rewards && (rewards.reward_first_place || rewards.reward_second_place || rewards.reward_third_place)) {
    if (creator.role !== 'rezeption' && creator.role !== 'administrator') {
      throw new Error('Only rezeption and administrators can create contests with rewards');
    }
  }
  
  // Erstelle Contest
  const finalContestName = contestName || `Contest ${creator.name}`;
  const contestResult = await db.query(
    `INSERT INTO contests (created_by, name, start_date, end_date, reward_first_place, reward_second_place, reward_third_place) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING *`,
    [
      creatorId,
      finalContestName,
      startDate,
      endDate,
      rewards?.reward_first_place || null,
      rewards?.reward_second_place || null,
      rewards?.reward_third_place || null,
    ]
  );
  
  const contest = contestResult.rows[0];
  
  // Sammle alle Teilnehmer-IDs
  const allParticipantIds = new Set<string>();
  
  // Füge optionale Teilnehmer hinzu, falls vorhanden
  if (participantIds && Array.isArray(participantIds) && participantIds.length > 0) {
    participantIds.forEach((id: string) => allParticipantIds.add(id));
  }
  
  // Prüfe ob alle Teilnehmer Mitarbeiter oder Administratoren sind
  // Wenn ja, füge den Ersteller auch hinzu (interner Contest)
  // Wenn nein, füge den Ersteller NICHT hinzu (Contest für Gäste)
  if (allParticipantIds.size > 0) {
    const participantRoles = await db.query(
      `SELECT role FROM users WHERE id = ANY($1::uuid[])`,
      [Array.from(allParticipantIds)]
    );
    
    const allAreEmployees = participantRoles.rows.every(
      (row: any) => row.role === 'rezeption' || row.role === 'administrator'
    );
    
    // Nur wenn alle Teilnehmer Mitarbeiter/Administratoren sind, füge den Ersteller hinzu
    if (allAreEmployees) {
      allParticipantIds.add(creatorId);
    }
  } else {
    // Wenn keine Teilnehmer angegeben wurden, füge nur den Ersteller hinzu (interner Contest)
    allParticipantIds.add(creatorId);
  }
  
  // Füge alle Teilnehmer hinzu
  for (const userId of allParticipantIds) {
    await db.query(
      'INSERT INTO contest_participants (contest_id, user_id, points) VALUES ($1, $2, 0) ON CONFLICT (contest_id, user_id) DO NOTHING',
      [contest.id, userId]
    );
  }
  
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
    // Benutzer ist bereits Teilnehmer, einfach Contest zurückgeben
    return contest;
  }
  
  // Füge Benutzer als Teilnehmer hinzu (startet mit 0 Punkten)
  await db.query(
    'INSERT INTO contest_participants (contest_id, user_id, points) VALUES ($1, $2, 0)',
    [contestId, userId]
  );
  
  return contest;
}

/**
 * Ruft alle Contests eines Benutzers ab
 */
export async function getUserContests(userId: string): Promise<Contest[]> {
  const db = getPool();
  
  // Nur aktive Contests, die noch nicht abgelaufen sind
  const result = await db.query(
    `SELECT c.* FROM contests c
     INNER JOIN contest_participants cp ON cp.contest_id = c.id
     WHERE cp.user_id = $1 
       AND c.active = TRUE
       AND c.end_date > NOW()
     ORDER BY c.end_date ASC`,
    [userId]
  );
  
  return result.rows;
}

/**
 * Ruft alle Contests eines Benutzers ab (inkl. abgelaufene) - für Rankings-Seite
 */
export async function getAllUserContests(userId: string): Promise<Contest[]> {
  const db = getPool();
  
  // Alle Contests, auch abgelaufene
  const result = await db.query(
    `SELECT c.* FROM contests c
     INNER JOIN contest_participants cp ON cp.contest_id = c.id
     WHERE cp.user_id = $1 AND c.active = TRUE
     ORDER BY c.end_date DESC`,
    [userId]
  );
  
  return result.rows;
}

/**
 * Ruft alle Contests für Front Office ab (nur Contests mit Gästen)
 */
export async function getEmployeeContests(userId: string): Promise<Contest[]> {
  const db = getPool();
  
  // Hole alle Contests, die der Front Office Mitarbeiter erstellt hat
  // UND die mindestens einen Teilnehmer haben, der Gast ist
  const result = await db.query(
    `SELECT DISTINCT c.* 
     FROM contests c
     WHERE c.created_by = $1 
       AND c.active = TRUE
       AND EXISTS (
         SELECT 1 
         FROM contest_participants cp2
         INNER JOIN users u ON u.id = cp2.user_id
         WHERE cp2.contest_id = c.id
           AND u.role = 'guest'
       )
     ORDER BY c.end_date ASC`,
    [userId]
  );
  
  // Prüfe und vergib automatisch Belohnungen für abgelaufene Contests
  for (const contest of result.rows) {
    await checkAndAwardContestRewards(contest.id);
  }
  
  // Lade Contests erneut, um aktualisierte rewards_awarded Flags zu erhalten
  const updatedResult = await db.query(
    `SELECT DISTINCT c.* 
     FROM contests c
     WHERE c.created_by = $1 
       AND c.active = TRUE
       AND EXISTS (
         SELECT 1 
         FROM contest_participants cp2
         INNER JOIN users u ON u.id = cp2.user_id
         WHERE cp2.contest_id = c.id
           AND u.role = 'guest'
       )
     ORDER BY c.end_date ASC`,
    [userId]
  );
  
  return updatedResult.rows;
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
 * Nur Punkte, die innerhalb des Contest-Zeitraums (start_date bis end_date) gesammelt werden, zählen
 */
export async function updateContestPoints(userId: string, contestId: string, points: number): Promise<void> {
  const db = getPool();
  
  if (points <= 0) {
    return; // Keine negativen oder null Punkte
  }
  
  const now = new Date();
  
  // Prüfe ob Contest noch aktiv ist und ob wir innerhalb des Zeitraums sind
  const contestResult = await db.query(
    'SELECT id, start_date, end_date FROM contests WHERE id = $1 AND active = TRUE',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    return; // Contest ist nicht aktiv
  }
  
  const contest = contestResult.rows[0];
  const startDate = new Date(contest.start_date);
  const endDate = new Date(contest.end_date);
  
  // Prüfe ob wir innerhalb des Contest-Zeitraums sind
  if (now < startDate || now > endDate) {
    return; // Außerhalb des Contest-Zeitraums
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
/**
 * Prüft und vergibt automatisch Belohnungen für abgelaufene Contests
 */
export async function checkAndAwardContestRewards(contestId: string): Promise<void> {
  const db = getPool();
  
  // Hole Contest-Informationen
  const contestResult = await db.query(
    'SELECT * FROM contests WHERE id = $1',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    return; // Contest nicht gefunden
  }
  
  const contest = contestResult.rows[0];
  
  // Prüfe ob Contest bereits beendet ist
  if (new Date(contest.end_date) > new Date()) {
    return; // Contest noch nicht beendet
  }
  
  // Prüfe ob Belohnungen bereits vergeben wurden
  if (contest.rewards_awarded) {
    return; // Bereits vergeben
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
    
    // Markiere Belohnungen als vergeben
    await db.query(
      'UPDATE contests SET rewards_awarded = TRUE WHERE id = $1',
      [contestId]
    );
    
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

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
  
  // Prüfe ob Belohnungen bereits vergeben wurden
  if (contest.rewards_awarded) {
    throw new Error('Rewards have already been awarded');
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
    
    // Markiere Belohnungen als vergeben
    await db.query(
      'UPDATE contests SET rewards_awarded = TRUE WHERE id = $1',
      [contestId]
    );
    
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

/**
 * Löst einen Contest auf (nur Ersteller)
 */
export async function dissolveContest(contestId: string, userId: string, skipCreatorCheck: boolean = false): Promise<void> {
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
  
  if (!skipCreatorCheck && contest.created_by !== userId) {
    throw new Error('Only the contest creator can dissolve the contest');
  }
  
  // Beginne Transaktion
  await db.query('BEGIN');
  
  try {
    // Entferne alle Teilnehmer (CASCADE sollte das automatisch machen, aber zur Sicherheit)
    await db.query(
      'DELETE FROM contest_participants WHERE contest_id = $1',
      [contestId]
    );
    
    // Lösche Contest physisch (CASCADE entfernt automatisch contest_participants, aber wir haben es oben schon gemacht)
    // Die Trigger in der Datenbank kümmern sich um die Deaktivierung von zugeordneten Tasks/Rewards
    const deleteResult = await db.query(
      'DELETE FROM contests WHERE id = $1',
      [contestId]
    );
    
    
    if (deleteResult.rowCount === 0) {
      throw new Error('Contest not found or could not be deleted');
    }
    
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

/**
 * Verlässt einen Contest (entfernt Benutzer als Teilnehmer)
 */
export async function leaveContest(contestId: string, userId: string): Promise<void> {
  const db = getPool();
  
  // Prüfe ob Contest existiert und aktiv ist
  const contestResult = await db.query(
    'SELECT id, created_by FROM contests WHERE id = $1 AND active = TRUE',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    throw new Error('Contest not found or inactive');
  }
  
  const contest = contestResult.rows[0];
  
  // Ersteller kann Contest nicht verlassen, nur auflösen
  if (contest.created_by === userId) {
    throw new Error('Contest creator cannot leave the contest. Use dissolve instead.');
  }
  
  // Prüfe ob Benutzer Teilnehmer ist
  const participantCheck = await db.query(
    'SELECT id FROM contest_participants WHERE contest_id = $1 AND user_id = $2',
    [contestId, userId]
  );
  
  if (participantCheck.rows.length === 0) {
    throw new Error('User is not a participant in this contest');
  }
  
  // Entferne Benutzer als Teilnehmer
  // Punkte bleiben auf dem persönlichen Konto (wie spezifiziert)
  await db.query(
    'DELETE FROM contest_participants WHERE contest_id = $1 AND user_id = $2',
    [contestId, userId]
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

/**
 * Tritt einem Contest direkt bei (ohne QR-Code-Validierung)
 * Wird intern verwendet, z.B. bei der Registrierung mit Contest-Token
 */
export async function joinContestById(userId: string, contestId: string): Promise<Contest> {
  const db = getPool();
  
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
    // Benutzer ist bereits Teilnehmer, einfach Contest zurückgeben
    return contest;
  }
  
  // Füge Benutzer als Teilnehmer hinzu (startet mit 0 Punkten)
  await db.query(
    'INSERT INTO contest_participants (contest_id, user_id, points) VALUES ($1, $2, 0)',
    [contestId, userId]
  );
  
  return contest;
}

/**
 * Generiert einen Registrierungs-QR-Code für einen Contest
 * Dieser QR-Code ermöglicht es neuen Benutzern, sich zu registrieren und automatisch dem Contest beizutreten
 */
export async function generateContestRegistrationQrCode(contestId: string): Promise<string> {
  const db = getPool();
  
  // Prüfe ob Contest existiert
  const contestResult = await db.query(
    'SELECT id FROM contests WHERE id = $1 AND active = TRUE',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    throw new Error('Contest not found or inactive');
  }
  
  // Prüfe ob bereits ein Registrierungs-QR-Code existiert
  const existing = await db.query(
    'SELECT qr_token FROM contest_registration_qr_codes WHERE contest_id = $1',
    [contestId]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].qr_token;
  }
  
  // Erstelle neuen Registrierungs-QR-Code
  const qrToken = generateQrToken();
  await db.query(
    'INSERT INTO contest_registration_qr_codes (contest_id, qr_token, enabled) VALUES ($1, $2, TRUE)',
    [contestId, qrToken]
  );
  
  return qrToken;
}

/**
 * Ruft den Registrierungs-QR-Code eines Contests ab
 */
export async function getContestRegistrationQrCode(contestId: string): Promise<{ qrToken: string | null; enabled: boolean }> {
  const db = getPool();
  
  const result = await db.query(
    'SELECT qr_token, enabled FROM contest_registration_qr_codes WHERE contest_id = $1',
    [contestId]
  );
  
  if (result.rows.length === 0) {
    return { qrToken: null, enabled: false };
  }
  
  return {
    qrToken: result.rows[0].qr_token,
    enabled: result.rows[0].enabled,
  };
}

/**
 * Aktiviert oder deaktiviert die Registrierung für einen Contest
 */
export async function enableContestRegistration(contestId: string, enabled: boolean): Promise<void> {
  const db = getPool();
  
  // Prüfe ob Contest existiert
  const contestResult = await db.query(
    'SELECT id FROM contests WHERE id = $1',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    throw new Error('Contest not found');
  }
  
  // Prüfe ob Registrierungs-QR-Code existiert
  const existing = await db.query(
    'SELECT id FROM contest_registration_qr_codes WHERE contest_id = $1',
    [contestId]
  );
  
  if (existing.rows.length === 0) {
    // Erstelle QR-Code wenn er nicht existiert
    if (enabled) {
      await generateContestRegistrationQrCode(contestId);
    } else {
      // Nichts zu tun, wenn disabled und nicht vorhanden
      return;
    }
  } else {
    // Aktualisiere enabled-Status
    await db.query(
      'UPDATE contest_registration_qr_codes SET enabled = $1 WHERE contest_id = $2',
      [enabled, contestId]
    );
  }
}

/**
 * Validiert einen Contest-Registrierungs-Token und gibt die Contest-ID zurück
 */
export async function validateContestRegistrationToken(qrToken: string): Promise<string | null> {
  const db = getPool();
  
  const result = await db.query(
    'SELECT contest_id FROM contest_registration_qr_codes WHERE qr_token = $1 AND enabled = TRUE',
    [qrToken]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Prüfe ob Contest noch aktiv ist und nicht abgelaufen
  const contestResult = await db.query(
    'SELECT id FROM contests WHERE id = $1 AND active = TRUE AND end_date > NOW()',
    [result.rows[0].contest_id]
  );
  
  if (contestResult.rows.length === 0) {
    return null;
  }
  
  return result.rows[0].id;
}

/**
 * Ruft alle Contests ab (für Admin-Verwaltung)
 */
export async function getAllContests(options?: { includeInactive?: boolean }): Promise<Contest[]> {
  const db = getPool();
  
  const includeInactive = options?.includeInactive ?? false;
  const whereClause = includeInactive ? '' : 'WHERE c.active = TRUE';
  
  const result = await db.query(
    `SELECT c.*, u.name as creator_name, u.email as creator_email,
     (SELECT COUNT(*) FROM contest_participants WHERE contest_id = c.id) as participant_count
     FROM contests c
     INNER JOIN users u ON u.id = c.created_by
     ${whereClause}
     ORDER BY c.created_at DESC`
  );
  
  return result.rows;
}

/**
 * Aktualisiert den Status mehrerer Contests (Bulk-Operation)
 */
export async function bulkUpdateContestsStatus(contestIds: string[], active: boolean): Promise<void> {
  const db = getPool();
  
  if (contestIds.length === 0) {
    return;
  }
  
  await db.query(
    `UPDATE contests SET active = $1, updated_at = NOW() WHERE id = ANY($2::uuid[])`,
    [active, contestIds]
  );
}

/**
 * Löscht mehrere Contests (Bulk-Operation)
 * Hinweis: Contests werden nicht physisch gelöscht, sondern deaktiviert
 */
export async function bulkDeleteContests(contestIds: string[]): Promise<void> {
  const db = getPool();
  
  if (contestIds.length === 0) {
    return;
  }
  
  // Deaktiviere Contests (CASCADE sollte contest_participants automatisch entfernen)
  await db.query(
    `UPDATE contests SET active = FALSE, updated_at = NOW() WHERE id = ANY($1::uuid[])`,
    [contestIds]
  );
}

/**
 * Aktualisiert Contest-Daten
 */
export async function updateContest(contestId: string, data: Partial<{ name: string | null; active: boolean; end_date?: Date }>): Promise<Contest> {
  const db = getPool();
  
  // Prüfe ob Contest existiert
  const contestResult = await db.query(
    'SELECT * FROM contests WHERE id = $1',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    throw new Error('Contest not found');
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  
  if (data.active !== undefined) {
    updates.push(`active = $${paramIndex++}`);
    values.push(data.active);
  }
  
  if (data.end_date !== undefined) {
    updates.push(`end_date = $${paramIndex++}`);
    values.push(data.end_date);
  }
  
  if (updates.length === 0) {
    return contestResult.rows[0];
  }
  
  updates.push(`updated_at = NOW()`);
  values.push(contestId);
  
  const result = await db.query(
    `UPDATE contests SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  return result.rows[0];
}

/**
 * Generiert einen Registrierungs-QR-Code für einen Contest
 * Dieser QR-Code ermöglicht es neuen Benutzern, sich zu registrieren und automatisch dem Contest beizutreten
 */

/**
 * Fügt Benutzer zu einem Contest hinzu (nur für Administratoren)
 */
export async function addContestParticipants(contestId: string, userIds: string[]): Promise<void> {
  const db = getPool();
  
  if (userIds.length === 0) {
    return;
  }
  
  // Prüfe ob Contest existiert
  const contestResult = await db.query(
    'SELECT id, active FROM contests WHERE id = $1',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    throw new Error('Contest not found');
  }
  
  // Füge Benutzer hinzu (ignoriere Duplikate)
  for (const userId of userIds) {
    // Prüfe ob Benutzer bereits Teilnehmer ist
    const existingParticipant = await db.query(
      'SELECT id FROM contest_participants WHERE contest_id = $1 AND user_id = $2',
      [contestId, userId]
    );
    
    if (existingParticipant.rows.length === 0) {
      // Füge Benutzer hinzu
      await db.query(
        'INSERT INTO contest_participants (contest_id, user_id, points) VALUES ($1, $2, 0)',
        [contestId, userId]
      );
    }
  }
}

/**
 * Entfernt Benutzer aus einem Contest (nur für Administratoren)
 */
export async function removeContestParticipants(contestId: string, userIds: string[]): Promise<void> {
  const db = getPool();
  
  if (userIds.length === 0) {
    return;
  }
  
  // Prüfe ob Contest existiert
  const contestResult = await db.query(
    'SELECT id, created_by FROM contests WHERE id = $1',
    [contestId]
  );
  
  if (contestResult.rows.length === 0) {
    throw new Error('Contest not found');
  }
  
  const contest = contestResult.rows[0];
  
  // Entferne Benutzer (außer Ersteller)
  for (const userId of userIds) {
    // Ersteller kann nicht entfernt werden
    if (contest.created_by === userId) {
      continue;
    }
    
    await db.query(
      'DELETE FROM contest_participants WHERE contest_id = $1 AND user_id = $2',
      [contestId, userId]
    );
  }
}

/**
 * Ruft alle Teilnehmer eines Contests ab (nur für Administratoren)
 */
export async function getContestParticipantsAdmin(contestId: string): Promise<ContestParticipant[]> {
  const db = getPool();
  
  const result = await db.query(
    `SELECT cp.*, u.name as user_name, u.email as user_email
     FROM contest_participants cp
     INNER JOIN users u ON u.id = cp.user_id
     WHERE cp.contest_id = $1
     ORDER BY cp.joined_at ASC`,
    [contestId]
  );
  
  return result.rows;
}
