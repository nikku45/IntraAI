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
 * GET /api/v1/chat/history/:sessionId
 * Retrieve the chat history for a specific session
 */
router.get('/history/:sessionId', authenticate, ChatController.getChatHistory);

export default router;
