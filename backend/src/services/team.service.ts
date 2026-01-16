import { getPool } from '../database/connection.js';
import { getUserById } from './user.service.js';
import { generateQrToken } from './user-qr.service.js';
import { getOrCreateUserQrCode } from './user-qr.service.js';

export interface Team {
  id: string;
  name: string | null;
  created_by: string;
  points_pool: number;
  created_at: Date;
  updated_at: Date;
  active: boolean;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: Date;
  points_contributed: number;
  user_name?: string;
  user_email?: string | null;
}

export interface TeamDetails extends Team {
  members: TeamMember[];
  creator_name: string;
  creator_email: string | null;
}

/**
 * Erstellt ein neues Team (nur Ersteller als Mitglied)
 */
export async function createTeam(creatorId: string, teamName?: string): Promise<Team> {
  const db = getPool();
  
  // Prüfe ob Benutzer existiert
  const creator = await getUserById(creatorId);
  
  if (!creator) {
    throw new Error('Creator user not found');
  }
  
  // Prüfe ob Benutzer bereits in einem Team ist
  const existingTeam = await db.query(
    `SELECT tm.team_id FROM team_members tm
     INNER JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = $1 AND t.active = true`,
    [creatorId]
  );
  
  if (existingTeam.rows.length > 0) {
    throw new Error('User is already a member of a team');
  }
  
  // Erstelle Team
  const finalTeamName = teamName || `Team ${creator.name}`;
  const teamResult = await db.query(
    `INSERT INTO teams (created_by, name) 
     VALUES ($1, $2) 
     RETURNING *`,
    [creatorId, finalTeamName]
  );
  
  const team = teamResult.rows[0];
  
  // Füge Ersteller als Mitglied hinzu
  await db.query(
    'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
    [team.id, creatorId]
  );
  
  // Generiere QR-Code für Team
  await generateTeamQrCode(team.id);
  
  return team;
}

/**
 * Tritt einem Team direkt bei (mit Team-ID)
 * Wird verwendet für automatische Zuordnung nach Registrierung
 */
export async function joinTeamById(userId: string, teamId: string): Promise<Team> {
  const db = getPool();
  
  // Prüfe ob Benutzer bereits Mitglied ist
  const existingMember = await db.query(
    'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  
  if (existingMember.rows.length > 0) {
    // Benutzer ist bereits Mitglied, gebe Team zurück
    const teamResult = await db.query(
      'SELECT * FROM teams WHERE id = $1 AND active = TRUE',
      [teamId]
    );
    if (teamResult.rows.length > 0) {
      return teamResult.rows[0];
    }
    throw new Error('Team not found or inactive');
  }
  
  // Prüfe ob Benutzer bereits in einem anderen Team ist
  const existingTeam = await db.query(
    `SELECT tm.team_id FROM team_members tm
     INNER JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = $1 AND t.active = true AND tm.team_id != $2`,
    [userId, teamId]
  );
  
  if (existingTeam.rows.length > 0) {
    throw new Error('User is already a member of another team');
  }
  
  // Prüfe ob Team aktiv ist
  const teamResult = await db.query(
    'SELECT * FROM teams WHERE id = $1 AND active = TRUE',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    throw new Error('Team not found or inactive');
  }
  
  // Füge Benutzer als Mitglied hinzu
  await db.query(
    'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
    [teamId, userId]
  );
  
  return teamResult.rows[0];
}

/**
 * Tritt einem Team bei durch Scannen des Team-QR-Codes
 */
export async function joinTeam(userId: string, teamQrToken: string): Promise<Team> {
  const db = getPool();
  
  // Finde Team über QR-Token
  const qrResult = await db.query(
    'SELECT team_id FROM team_qr_codes WHERE qr_token = $1',
    [teamQrToken]
  );
  
  if (qrResult.rows.length === 0) {
    throw new Error('Invalid team QR code');
  }
  
  const teamId = qrResult.rows[0].team_id;
  
  // Prüfe ob Benutzer bereits Mitglied ist
  const existingMember = await db.query(
    'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  
  if (existingMember.rows.length > 0) {
    throw new Error('User is already a member of this team');
  }
  
  // Prüfe ob Benutzer bereits in einem anderen Team ist
  const existingTeam = await db.query(
    `SELECT tm.team_id FROM team_members tm
     INNER JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = $1 AND t.active = true AND tm.team_id != $2`,
    [userId, teamId]
  );
  
  if (existingTeam.rows.length > 0) {
    throw new Error('User is already a member of another team');
  }
  
  // Prüfe ob Team aktiv ist
  const teamResult = await db.query(
    'SELECT * FROM teams WHERE id = $1 AND active = TRUE',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    throw new Error('Team not found or inactive');
  }
  
  // Füge Benutzer als Mitglied hinzu
  await db.query(
    'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
    [teamId, userId]
  );
  
  return teamResult.rows[0];
}

/**
 * Ruft alle Teams eines Benutzers ab
 */
export async function getUserTeams(userId: string): Promise<Team[]> {
  const db = getPool();
  
  const result = await db.query(
    `SELECT t.* FROM teams t
     INNER JOIN team_members tm ON tm.team_id = t.id
     WHERE tm.user_id = $1 AND t.active = TRUE
     ORDER BY t.created_at DESC`,
    [userId]
  );
  
  return result.rows;
}

/**
 * Ruft Team-Details mit Mitgliedern ab
 */
export async function getTeamDetails(teamId: string, userId: string): Promise<TeamDetails | null> {
  const db = getPool();
  
  // Prüfe ob Benutzer Mitglied ist
  const memberCheck = await db.query(
    'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  
  if (memberCheck.rows.length === 0) {
    return null;
  }
  
  // Hole Team-Informationen
  const teamResult = await db.query(
    'SELECT * FROM teams WHERE id = $1',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    return null;
  }
  
  const team = teamResult.rows[0];
  
  // Hole Ersteller-Informationen
  const creatorResult = await db.query(
    'SELECT name, email FROM users WHERE id = $1',
    [team.created_by]
  );
  const creator = creatorResult.rows[0];
  
  // Hole Mitglieder
  const membersResult = await db.query(
    `SELECT tm.*, u.name as user_name, u.email as user_email
     FROM team_members tm
     INNER JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = $1
     ORDER BY tm.joined_at ASC`,
    [teamId]
  );
  
  return {
    ...team,
    members: membersResult.rows,
    creator_name: creator?.name || 'Unknown',
    creator_email: creator?.email || null,
  };
}

/**
 * Trägt Punkte zum Team-Pool bei
 */
export async function contributePointsToTeam(userId: string, teamId: string, points: number): Promise<void> {
  const db = getPool();
  
  if (points <= 0) {
    throw new Error('Points must be positive');
  }
  
  // Prüfe ob Benutzer Mitglied ist
  const memberCheck = await db.query(
    'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  
  if (memberCheck.rows.length === 0) {
    throw new Error('User is not a member of this team');
  }
  
  // Prüfe ob Benutzer genug Punkte hat
  const userResult = await db.query(
    'SELECT points FROM users WHERE id = $1',
    [userId]
  );
  
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const userPoints = userResult.rows[0].points;
  if (userPoints < points) {
    throw new Error('Insufficient points');
  }
  
  // Beginne Transaktion
  await db.query('BEGIN');
  
  try {
    // Deduziere Punkte vom Benutzer
    await db.query(
      'UPDATE users SET points = points - $1 WHERE id = $2',
      [points, userId]
    );
    
    // Füge Punkte zum Team-Pool hinzu
    await db.query(
      'UPDATE teams SET points_pool = points_pool + $1, updated_at = NOW() WHERE id = $2',
      [points, teamId]
    );
    
    // Aktualisiere beigetragene Punkte des Mitglieds
    await db.query(
      'UPDATE team_members SET points_contributed = points_contributed + $1 WHERE team_id = $2 AND user_id = $3',
      [points, teamId, userId]
    );
    
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

/**
 * Löst eine Belohnung mit Team-Punkten ein
 */
export async function redeemRewardFromTeam(teamId: string, rewardId: string, userId: string): Promise<any> {
  const db = getPool();
  
  // Prüfe ob Benutzer Mitglied ist
  const memberCheck = await db.query(
    'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  
  if (memberCheck.rows.length === 0) {
    throw new Error('User is not a member of this team');
  }
  
  // Hole Belohnungs-Informationen
  const rewardResult = await db.query(
    'SELECT points_cost FROM rewards WHERE id = $1 AND active = TRUE',
    [rewardId]
  );
  
  if (rewardResult.rows.length === 0) {
    throw new Error('Reward not found or inactive');
  }
  
  const pointsCost = rewardResult.rows[0].points_cost;
  
  // Hole Team-Punktepool
  const teamResult = await db.query(
    'SELECT points_pool FROM teams WHERE id = $1 AND active = TRUE',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    throw new Error('Team not found or inactive');
  }
  
  const teamPointsPool = teamResult.rows[0].points_pool;
  
  if (teamPointsPool < pointsCost) {
    throw new Error('Insufficient team points');
  }
  
  // Beginne Transaktion
  await db.query('BEGIN');
  
  try {
    // Deduziere Punkte vom Team-Pool
    await db.query(
      'UPDATE teams SET points_pool = points_pool - $1, updated_at = NOW() WHERE id = $2',
      [pointsCost, teamId]
    );
    
    // Erstelle Redemption (ohne Punkte vom Benutzer zu deduzieren, da Team-Punkte verwendet werden)
    const redemptionResult = await db.query(
      `INSERT INTO reward_redemptions (user_id, reward_id, status)
       VALUES ($1, $2, 'used')
       RETURNING *`,
      [userId, rewardId]
    );
    
    await db.query('COMMIT');
    
    return {
      redemption: redemptionResult.rows[0],
      team: {
        id: teamId,
        points_pool: teamPointsPool - pointsCost,
      },
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

/**
 * Löst ein Team auf und verteilt Punkte gleichmäßig
 */
export async function dissolveTeam(teamId: string, userId: string, skipCreatorCheck: boolean = false): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.service.ts:409',message:'dissolveTeam entry',data:{teamId,userId,skipCreatorCheck},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const db = getPool();
  
  // Prüfe ob Benutzer der Ersteller ist
  const teamResult = await db.query(
    'SELECT created_by FROM teams WHERE id = $1',
    [teamId]
  );
  
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.service.ts:418',message:'dissolveTeam after query',data:{teamFound:teamResult.rows.length>0,rowCount:teamResult.rows.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  if (teamResult.rows.length === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.service.ts:419',message:'dissolveTeam team not found error',data:{teamId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw new Error('Team not found');
  }
  
  const team = teamResult.rows[0];
  
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.service.ts:424',message:'dissolveTeam before permission check',data:{teamCreatedBy:team.created_by,userId,isCreator:team.created_by===userId,skipCreatorCheck},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  if (!skipCreatorCheck && team.created_by !== userId) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.service.ts:425',message:'dissolveTeam permission denied error',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw new Error('Only the team creator can dissolve the team');
  }
  
  // Beginne Transaktion
  await db.query('BEGIN');
  
  try {
    // Entferne alle Mitglieder (CASCADE sollte das automatisch machen, aber zur Sicherheit)
    // Mitglieder behalten ihre eigenen Punkte - keine Umverteilung
    await db.query(
      'DELETE FROM team_members WHERE team_id = $1',
      [teamId]
    );
    
    // Lösche Team physisch (CASCADE entfernt automatisch team_members, aber wir haben es oben schon gemacht)
    // Die Trigger in der Datenbank kümmern sich um die Deaktivierung von zugeordneten Tasks/Rewards
    const deleteResult = await db.query(
      'DELETE FROM teams WHERE id = $1',
      [teamId]
    );
    
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.service.ts:459',message:'dissolveTeam DELETE executed',data:{teamId,rowCount:deleteResult.rowCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (deleteResult.rowCount === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.service.ts:463',message:'dissolveTeam DELETE no rows affected',data:{teamId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      throw new Error('Team not found or could not be deleted');
    }
    
    await db.query('COMMIT');
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.service.ts:469',message:'dissolveTeam DELETE committed',data:{teamId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    await db.query('ROLLBACK');
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.service.ts:474',message:'dissolveTeam DELETE rolled back',data:{teamId,error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

/**
 * Tritt aus einem Team aus (nicht der Ersteller)
 */
export async function leaveTeam(userId: string, teamId: string): Promise<void> {
  const db = getPool();
  
  // Prüfe ob Team existiert
  const teamResult = await db.query(
    'SELECT created_by, active FROM teams WHERE id = $1',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    throw new Error('Team not found');
  }
  
  const team = teamResult.rows[0];
  
  if (!team.active) {
    throw new Error('Team is not active');
  }
  
  // Prüfe ob Benutzer der Ersteller ist
  if (team.created_by === userId) {
    throw new Error('Team creator cannot leave the team. Use dissolve instead.');
  }
  
  // Prüfe ob Benutzer Mitglied ist
  const memberCheck = await db.query(
    'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  
  if (memberCheck.rows.length === 0) {
    throw new Error('User is not a member of this team');
  }
  
  // Beginne Transaktion
  await db.query('BEGIN');
  
  try {
    // Entferne Benutzer aus Team
    // Benutzer behält seine eigenen Punkte - keine Umverteilung
    await db.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

/**
 * Generiert einen QR-Code für ein Team
 */
export async function generateTeamQrCode(teamId: string): Promise<string> {
  const db = getPool();
  
  // Prüfe ob bereits ein QR-Code existiert
  const existing = await db.query(
    'SELECT qr_token FROM team_qr_codes WHERE team_id = $1',
    [teamId]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].qr_token;
  }
  
  // Erstelle neuen QR-Code
  const qrToken = generateQrToken();
  await db.query(
    'INSERT INTO team_qr_codes (team_id, qr_token) VALUES ($1, $2)',
    [teamId, qrToken]
  );
  
  return qrToken;
}

/**
 * Ruft den QR-Code eines Teams ab
 */
export async function getTeamQrCode(teamId: string): Promise<string | null> {
  const db = getPool();
  
  const result = await db.query(
    'SELECT qr_token FROM team_qr_codes WHERE team_id = $1',
    [teamId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0].qr_token;
}

/**
 * Berechnet den Gesamtbetrag aller Mitglieder eines Teams (Summe aller Punkte)
 */
export async function getTeamTotalPoints(teamId: string): Promise<number> {
  const db = getPool();
  
  const result = await db.query(
    `SELECT COALESCE(SUM(u.points), 0) as total_points
     FROM team_members tm
     INNER JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = $1`,
    [teamId]
  );
  
  return parseInt(result.rows[0]?.total_points || '0', 10);
}

/**
 * Ruft das aktive Team eines Benutzers ab (falls vorhanden)
 */
export async function getUserActiveTeam(userId: string): Promise<Team | null> {
  const db = getPool();
  
  const result = await db.query(
    `SELECT t.* FROM teams t
     INNER JOIN team_members tm ON tm.team_id = t.id
     WHERE tm.user_id = $1 AND t.active = TRUE
     LIMIT 1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

/**
 * Ruft alle Mitglieder eines Teams ab
 */
/**
 * Ruft das Ranking eines Teams ab (sortiert nach Punkten)
 */
export async function getTeamRanking(teamId: string): Promise<Array<{ user_id: string; user_name: string; user_email: string | null; points: number; rank: number }>> {
  const db = getPool();
  
  const result = await db.query(
    `SELECT 
       tm.user_id,
       u.name as user_name,
       u.email as user_email,
       u.points,
       ROW_NUMBER() OVER (ORDER BY u.points DESC, tm.joined_at ASC) as rank
     FROM team_members tm
     INNER JOIN users u ON u.id = tm.user_id
     INNER JOIN teams t ON t.id = tm.team_id
     WHERE tm.team_id = $1 AND t.active = TRUE
     ORDER BY u.points DESC, tm.joined_at ASC`,
    [teamId]
  );
  
  return result.rows.map((row) => ({
    user_id: row.user_id,
    user_name: row.user_name,
    user_email: row.user_email,
    points: row.points,
    rank: parseInt(row.rank, 10),
  }));
}

export async function getTeamMembers(teamId: string): Promise<string[]> {
  const db = getPool();
  
  const result = await db.query(
    'SELECT user_id FROM team_members WHERE team_id = $1',
    [teamId]
  );
  
  return result.rows.map((row: any) => row.user_id);
}

/**
 * Generiert einen Registrierungs-QR-Code für ein Team
 * Dieser QR-Code ermöglicht es neuen Benutzern, sich zu registrieren und automatisch dem Team beizutreten
 */
export async function generateTeamRegistrationQrCode(teamId: string): Promise<string> {
  const db = getPool();
  
  // Prüfe ob Team existiert
  const teamResult = await db.query(
    'SELECT id FROM teams WHERE id = $1 AND active = TRUE',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    throw new Error('Team not found or inactive');
  }
  
  // Prüfe ob bereits ein Registrierungs-QR-Code existiert
  const existing = await db.query(
    'SELECT qr_token FROM team_registration_qr_codes WHERE team_id = $1',
    [teamId]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].qr_token;
  }
  
  // Erstelle neuen Registrierungs-QR-Code
  const qrToken = generateQrToken();
  await db.query(
    'INSERT INTO team_registration_qr_codes (team_id, qr_token, enabled) VALUES ($1, $2, TRUE)',
    [teamId, qrToken]
  );
  
  return qrToken;
}

/**
 * Ruft den Registrierungs-QR-Code eines Teams ab
 */
export async function getTeamRegistrationQrCode(teamId: string): Promise<{ qrToken: string | null; enabled: boolean }> {
  const db = getPool();
  
  const result = await db.query(
    'SELECT qr_token, enabled FROM team_registration_qr_codes WHERE team_id = $1',
    [teamId]
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
 * Aktiviert oder deaktiviert die Registrierung für ein Team
 */
export async function enableTeamRegistration(teamId: string, enabled: boolean): Promise<void> {
  const db = getPool();
  
  // Prüfe ob Team existiert
  const teamResult = await db.query(
    'SELECT id FROM teams WHERE id = $1',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    throw new Error('Team not found');
  }
  
  // Prüfe ob Registrierungs-QR-Code existiert
  const existing = await db.query(
    'SELECT id FROM team_registration_qr_codes WHERE team_id = $1',
    [teamId]
  );
  
  if (existing.rows.length === 0) {
    // Erstelle QR-Code wenn er nicht existiert
    if (enabled) {
      await generateTeamRegistrationQrCode(teamId);
    } else {
      // Nichts zu tun, wenn disabled und nicht vorhanden
      return;
    }
  } else {
    // Aktualisiere enabled-Status
    await db.query(
      'UPDATE team_registration_qr_codes SET enabled = $1 WHERE team_id = $2',
      [enabled, teamId]
    );
  }
}

/**
 * Validiert einen Team-Registrierungs-Token und gibt die Team-ID zurück
 */
export async function validateTeamRegistrationToken(qrToken: string): Promise<string | null> {
  const db = getPool();
  
  const result = await db.query(
    'SELECT team_id FROM team_registration_qr_codes WHERE qr_token = $1 AND enabled = TRUE',
    [qrToken]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Prüfe ob Team noch aktiv ist
  const teamResult = await db.query(
    'SELECT id FROM teams WHERE id = $1 AND active = TRUE',
    [result.rows[0].team_id]
  );
  
  if (teamResult.rows.length === 0) {
    return null;
  }
  
  return result.rows[0].id;
}

/**
 * Ruft alle Teams ab (für Admin-Verwaltung)
 */
export async function getAllTeams(options?: { includeInactive?: boolean }): Promise<Team[]> {
  const db = getPool();
  
  try {
    const includeInactive = options?.includeInactive ?? false;
    const whereClause = includeInactive ? '' : 'WHERE t.active = TRUE';
    
    const result = await db.query(
      `SELECT t.*, u.name as creator_name, u.email as creator_email,
       (SELECT COUNT(*)::integer FROM team_members WHERE team_id = t.id) as member_count
       FROM teams t
       LEFT JOIN users u ON u.id = t.created_by
       ${whereClause}
       ORDER BY t.created_at DESC`
    );
    
    return result.rows;
  } catch (error: any) {
    console.error('Error in getAllTeams:', error);
    throw error;
  }
}

/**
 * Aktualisiert den Status mehrerer Teams (Bulk-Operation)
 */
export async function bulkUpdateTeamsStatus(teamIds: string[], active: boolean): Promise<void> {
  const db = getPool();
  
  if (teamIds.length === 0) {
    return;
  }
  
  await db.query(
    `UPDATE teams SET active = $1, updated_at = NOW() WHERE id = ANY($2::uuid[])`,
    [active, teamIds]
  );
}

/**
 * Löscht mehrere Teams (Bulk-Operation)
 * Hinweis: Teams werden nicht physisch gelöscht, sondern deaktiviert
 */
export async function bulkDeleteTeams(teamIds: string[]): Promise<void> {
  const db = getPool();
  
  if (teamIds.length === 0) {
    return;
  }
  
  // Lösche Team physisch (CASCADE entfernt automatisch team_members)s (CASCADE sollte team_members automatisch entfernen)
  await db.query(
    `UPDATE teams SET active = FALSE, updated_at = NOW() WHERE id = ANY($1::uuid[])`,
    [teamIds]
  );
}

/**
 * Aktualisiert Team-Daten
 */
export async function updateTeam(teamId: string, data: Partial<{ name: string | null; active: boolean }>): Promise<Team> {
  const db = getPool();
  
  // Prüfe ob Team existiert
  const teamResult = await db.query(
    'SELECT * FROM teams WHERE id = $1',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    throw new Error('Team not found');
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
  
  if (updates.length === 0) {
    return teamResult.rows[0];
  }
  
  updates.push(`updated_at = NOW()`);
  values.push(teamId);
  
  const result = await db.query(
    `UPDATE teams SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  return result.rows[0];
}

/**
 * Zieht Punkte von Team-Mitgliedern ab (gleichmäßig verteilt)
 * Regeln:
 * 1. Wenn der eigene Punktestand ausreicht: Nur eigene Punkte abziehen
 * 2. Wenn der eigene Punktestand nicht ausreicht: Alle eigenen Punkte abziehen (auf 0),
 *    fehlende Punkte gleichmäßig auf andere Teammitglieder verteilen
 * 3. Wenn ein Teammitglied nicht genug hat: Rest wieder gleichmäßig auf die anderen verteilen
 */
export async function deductTeamPoints(teamId: string, userId: string, totalPoints: number): Promise<void> {
  const db = getPool();
  
  // Prüfe ob Benutzer Mitglied ist
  const memberCheck = await db.query(
    'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  
  if (memberCheck.rows.length === 0) {
    throw new Error('User is not a member of this team');
  }
  
  // Beginne Transaktion
  await db.query('BEGIN');
  
  try {
    // Hole aktuellen Punktestand des Benutzers
    const userResult = await db.query(
      'SELECT points FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const userPoints = parseInt(userResult.rows[0].points || '0', 10);
    
    // Regel 1: Wenn der eigene Punktestand ausreicht, nur eigene Punkte abziehen
    if (userPoints >= totalPoints) {
      await db.query(
        'UPDATE users SET points = points - $1 WHERE id = $2',
        [totalPoints, userId]
      );
      await db.query('COMMIT');
      return;
    }
    
    // Regel 2: Eigene Punkte vollständig abziehen (auf 0 setzen)
    if (userPoints > 0) {
      await db.query(
        'UPDATE users SET points = 0 WHERE id = $1',
        [userId]
      );
    }
    
    // Berechne fehlende Punkte
    let remainingPoints = totalPoints - userPoints;
    
    // Regel 3: Fehlende Punkte gleichmäßig auf andere Teammitglieder verteilen
    // Wiederhole solange noch Punkte übrig sind und es noch Mitglieder gibt
    while (remainingPoints > 0) {
      // Hole aktuelle Punktestände aller anderen Mitglieder
      const otherMembersResult = await db.query(
        `SELECT u.id, u.points 
         FROM team_members tm
         INNER JOIN users u ON u.id = tm.user_id
         WHERE tm.team_id = $1 AND u.id != $2 AND u.points > 0`,
        [teamId, userId]
      );
      
      const otherMembers = otherMembersResult.rows;
      
      if (otherMembers.length === 0) {
        // Keine anderen Mitglieder mehr mit Punkten
        throw new Error('Insufficient team points: Not enough points available from team members');
      }
      
      // Berechne Punkte pro Mitglied (gleichmäßig verteilen)
      const pointsPerMember = Math.floor(remainingPoints / otherMembers.length);
      const remainder = remainingPoints % otherMembers.length;
      
      if (pointsPerMember === 0 && remainder === 0) {
        break; // Keine Punkte mehr zu verteilen
      }
      
      let newRemainingPoints = 0;
      
      // Ziehe Punkte von jedem anderen Mitglied ab
      for (let i = 0; i < otherMembers.length; i++) {
        const member = otherMembers[i];
        let pointsToDeduct = pointsPerMember;
        
        // Erster Benutzer bekommt den Rest
        if (i === 0 && remainder > 0) {
          pointsToDeduct += remainder;
        }
        
        // Hole aktuellen Punktestand des Mitglieds
        const memberPoints = parseInt(member.points || '0', 10);
        
        if (memberPoints >= pointsToDeduct) {
          // Mitglied hat genug Punkte
          await db.query(
            'UPDATE users SET points = points - $1 WHERE id = $2',
            [pointsToDeduct, member.id]
          );
        } else {
          // Mitglied hat nicht genug Punkte - ziehe alle verfügbaren ab
          if (memberPoints > 0) {
            await db.query(
              'UPDATE users SET points = 0 WHERE id = $1',
              [member.id]
            );
            newRemainingPoints += (pointsToDeduct - memberPoints);
          } else {
            // Mitglied hat bereits 0 Punkte - füge den Anteil zum Rest hinzu
            newRemainingPoints += pointsToDeduct;
          }
        }
      }
      
      // Wenn noch Punkte übrig sind, wiederhole den Prozess
      remainingPoints = newRemainingPoints;
    }
    
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

/**
 * Fügt Benutzer zu einem Team hinzu (nur für Administratoren)
 */
export async function addTeamMembers(teamId: string, userIds: string[]): Promise<void> {
  const db = getPool();
  
  if (userIds.length === 0) {
    return;
  }
  
  // Prüfe ob Team existiert
  const teamResult = await db.query(
    'SELECT id, active FROM teams WHERE id = $1',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    throw new Error('Team not found');
  }
  
  // Füge Benutzer hinzu (ignoriere Duplikate)
  for (const userId of userIds) {
    // Prüfe ob Benutzer bereits Mitglied ist
    const existingMember = await db.query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    
    if (existingMember.rows.length === 0) {
      // Prüfe ob Benutzer bereits in einem anderen Team ist
      const otherTeam = await db.query(
        `SELECT tm.team_id FROM team_members tm
         INNER JOIN teams t ON t.id = tm.team_id
         WHERE tm.user_id = $1 AND t.active = true AND tm.team_id != $2`,
        [userId, teamId]
      );
      
      if (otherTeam.rows.length === 0) {
        // Füge Benutzer hinzu
        await db.query(
          'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
          [teamId, userId]
        );
      }
    }
  }
}

/**
 * Entfernt Benutzer aus einem Team (nur für Administratoren)
 */
export async function removeTeamMembers(teamId: string, userIds: string[]): Promise<void> {
  const db = getPool();
  
  if (userIds.length === 0) {
    return;
  }
  
  // Prüfe ob Team existiert
  const teamResult = await db.query(
    'SELECT id, created_by FROM teams WHERE id = $1',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    throw new Error('Team not found');
  }
  
  const team = teamResult.rows[0];
  
  // Entferne Benutzer (außer Ersteller)
  for (const userId of userIds) {
    // Ersteller kann nicht entfernt werden
    if (team.created_by === userId) {
      continue;
    }
    
    await db.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
  }
}

/**
 * Ruft alle Mitglieder eines Teams ab (nur für Administratoren)
 */
export async function getTeamMembersAdmin(teamId: string): Promise<TeamMember[]> {
  const db = getPool();
  
  const result = await db.query(
    `SELECT tm.*, u.name as user_name, u.email as user_email
     FROM team_members tm
     INNER JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = $1
     ORDER BY tm.joined_at ASC`,
    [teamId]
  );
  
  return result.rows;
}