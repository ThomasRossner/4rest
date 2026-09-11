import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import {
  getUserMessages,
  getUnreadMessageCount,
  markMessageAsRead,
  markAllMessagesAsRead,
  deleteMessage,
} from '../services/message.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMessages: RequestHandler = asyncHandler(async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { includeRead } = req.query;
    const includeReadFlag = includeRead !== 'false';
    
    console.log('[MESSAGE CONTROLLER] getMessages - userId:', authReq.user.id, 'includeRead:', includeReadFlag);
    const messages = await getUserMessages(authReq.user.id, includeReadFlag);
    console.log('[MESSAGE CONTROLLER] getMessages - Returning', messages?.length || 0, 'messages');
    res.json(messages);
  } catch (error: any) {
    console.error('[MESSAGE CONTROLLER] getMessages - Error:', error);
    console.error('[MESSAGE CONTROLLER] getMessages - Error stack:', error.stack);
    throw error;
  }
});

export const getUnreadCount: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const count = await getUnreadMessageCount(authReq.user.id);
  res.json({ count });
});

export const markAsRead: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const message = await markMessageAsRead(req.params.id, authReq.user.id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.json(message);
});

export const markAllAsRead: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await markAllMessagesAsRead(authReq.user.id);
  res.json({ success: true });
});

export const deleteMessageHandler: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const deleted = await deleteMessage(req.params.id, authReq.user.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.json({ success: true });
});
