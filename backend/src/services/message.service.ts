import { getPool } from '../database/connection.js';

export interface Message {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content?: string;
  metadata?: any;
  read: boolean;
  created_at: Date;
  read_at?: Date;
}

export interface CreateMessageData {
  user_id: string;
  type: string;
  title: string;
  content?: string;
  metadata?: any;
}

/**
 * Create a new message
 */
export async function createMessage(data: CreateMessageData): Promise<Message> {
  const db = getPool();
  
  const result = await db.query(
    `INSERT INTO messages (user_id, type, title, content, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.user_id,
      data.type,
      data.title,
      data.content || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );

  // metadata is JSONB, so PostgreSQL already returns it as an object
  return {
    ...result.rows[0],
    metadata: result.rows[0].metadata || null,
  };
}

/**
 * Create messages for multiple users (e.g., notify all admins)
 */
export async function createMessagesForUsers(userIds: string[], data: Omit<CreateMessageData, 'user_id'>): Promise<Message[]> {
  const db = getPool();
  const messages: Message[] = [];

  console.log('[MESSAGE SERVICE] Creating messages for users:', {
    userIds: userIds.length,
    type: data.type,
    title: data.title,
  });

  for (const userId of userIds) {
    try {
      const result = await db.query(
        `INSERT INTO messages (user_id, type, title, content, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          userId,
          data.type,
          data.title,
          data.content || null,
          data.metadata ? JSON.stringify(data.metadata) : null,
        ]
      );

      // metadata is JSONB, so PostgreSQL already returns it as an object
      messages.push({
        ...result.rows[0],
        metadata: result.rows[0].metadata || null,
      });
      console.log('[MESSAGE SERVICE] Created message for user:', userId);
    } catch (error) {
      console.error('[MESSAGE SERVICE] Failed to create message for user:', userId, error);
      throw error;
    }
  }

  console.log('[MESSAGE SERVICE] Created', messages.length, 'messages total');
  return messages;
}

/**
 * Get all messages for a user
 */
export async function getUserMessages(userId: string, includeRead: boolean = true): Promise<Message[]> {
  try {
    const db = getPool();
    
    let query = `
      SELECT * FROM messages
      WHERE user_id = $1
    `;
    
    const params: any[] = [userId];
    
    if (!includeRead) {
      query += ` AND read = FALSE`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await db.query(query, params);
    
    console.log('[MESSAGE SERVICE] getUserMessages for user:', userId, 'found', result.rows.length, 'messages (includeRead:', includeRead, ')');
    
    return result.rows.map((row) => {
      // metadata is JSONB, so PostgreSQL already returns it as an object
      // No need to parse it
      return {
        ...row,
        metadata: row.metadata || null,
      };
    });
  } catch (error: any) {
    console.error('[MESSAGE SERVICE] getUserMessages - Error:', error);
    console.error('[MESSAGE SERVICE] getUserMessages - Error stack:', error.stack);
    throw error;
  }
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const db = getPool();
  
  try {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM messages WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  } catch (error: any) {
    throw error;
  }
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(messageId: string, userId: string): Promise<Message | null> {
  const db = getPool();
  
  const result = await db.query(
    `UPDATE messages 
     SET read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [messageId, userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    ...result.rows[0],
    metadata: result.rows[0].metadata || null,
  };
}

/**
 * Mark all messages as read for a user
 */
export async function markAllMessagesAsRead(userId: string): Promise<void> {
  const db = getPool();
  
  await db.query(
    `UPDATE messages 
     SET read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND read = FALSE`,
    [userId]
  );
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  const db = getPool();
  
  const result = await db.query(
    `DELETE FROM messages WHERE id = $1 AND user_id = $2`,
    [messageId, userId]
  );
  
  return result.rowCount > 0;
}

/**
 * Get users with specific roles (for notifying admins/rezeption)
 */
export async function getUsersByRoles(roles: string[]): Promise<{ id: string; email: string; role: string }[]> {
  const db = getPool();
  
  const result = await db.query(
    `SELECT id, email, role FROM users WHERE role = ANY($1::text[])`,
    [roles]
  );
  
  return result.rows;
}
