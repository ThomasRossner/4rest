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
export async function dissolveTeam(teamId: string, userId: string): Promise<void> {
  const db = getPool();
  
  // Prüfe ob Benutzer der Ersteller ist
  const teamResult = await db.query(
    'SELECT created_by FROM teams WHERE id = $1',
    [teamId]
  );
  
  if (teamResult.rows.length === 0) {
    throw new Error('Team not found');
  }
  
  const team = teamResult.rows[0];
  
  if (team.created_by !== userId) {
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
    
    // Deaktiviere Team
    await db.query(
      'UPDATE teams SET active = FALSE, updated_at = NOW() WHERE id = $1',
      [teamId]
    );
    
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
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

