import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/v1/chat/query
 * Send a query and receive a streamed response (Server-Sent Events)
 * 
 * Request body:
 * {
 *   query: string,           // The user's question
 *   sessionId?: string       // Optional: continue existing session
 * }
 * 
 * Response: Server-Sent Events stream with chunks of the response
 */
router.post('/query', authenticate, ChatController.queryChat);

/**
 * GET /api/v1/chat/sessions
 * Retrieve all chat sessions for the authenticated user
 */
router.get('/sessions', authenticate, ChatController.getUserSessions);

/**
 * GET /api/v1/chat/history/:sessionId
 * Retrieve the chat history for a specific session
 */
router.get('/history/:sessionId', authenticate, ChatController.getChatHistory);

/**
 * PATCH /api/v1/chat/sessions/:sessionId
 * Rename a specific chat session
 */
router.patch('/sessions/:sessionId', authenticate, ChatController.renameSession);

/**
 * DELETE /api/v1/chat/sessions/:sessionId
 * Delete a specific chat session and its history
 */
router.delete('/sessions/:sessionId', authenticate, ChatController.deleteSession);

export default router;

