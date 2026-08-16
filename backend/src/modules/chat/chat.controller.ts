import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ChatService } from './chat.service';
import { prisma } from '../../lib/prisma';

export class ChatController {
  /**
   * Handle the POST /api/v1/chat/query request
   * Streams the AI response back to the client using Server-Sent Events (SSE)
   */
  static async queryChat(req: AuthRequest, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // 1. Extract user info from the authenticated request
      const userId = req.user!.userId;
      const companyId = req.user!.companyId;

      // 2. Extract query parameters from the request body
      const { query, sessionId } = req.body;

      if (!query || typeof query !== 'string') {
        res.status(400).json({ message: 'Query text is required' });
        return;
      }

      // 3. Get or create a chat session
      const session = await ChatService.getOrCreateSession({
        sessionId,
        companyId,
        userId,
      });

      // 4. Set up SSE headers for streaming
      // This tells the browser: "I'm going to stream data to you"
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // 5. Retrieve relevant context chunks from the AI Service
      //    This performs vector search in ChromaDB + enriches with PostgreSQL data
      let contextData: any = {};
      let retrievedChunkIds: string[] = [];
      try {
        contextData = await ChatService.retrieveContext(query, companyId);
        retrievedChunkIds = contextData.chunks.map((c: any) => c.id);
      } catch (error) {
        console.warn('Warning: Could not retrieve context, proceeding without it');
      }

      const retrievedChunks = contextData.results || [];

      // 6. Build the full response by streaming from the AI Service
      let fullResponse = '';

      // Send a message indicating we're starting the stream
      res.write(`data: ${JSON.stringify({ type: 'start', sessionId: session.id })}\n\n`);

      try {
        // Stream the chat response from the AI Service
        // Pass the retrieved chunk texts so the AI service can skip re-querying ChromaDB
        const stream = await ChatService.streamChatResponse(query, companyId, retrievedChunks);

        // Handle the stream data
        stream.on('data', (chunk: Buffer) => {
          const rawText = chunk.toString('utf8');
          
          // AI Service sends data as "data: \"content\"\n\n"
          // We need to extract the string between data: and \n\n
          const lines = rawText.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const content = JSON.parse(line.slice(6));
                if (content && typeof content === 'string') {
                  fullResponse += content;
                  res.write(`data: ${JSON.stringify({ type: 'chunk', content: content })}\n\n`);
                }
              } catch (e) {
                // Ignore parsing errors for partial or non-json chunks
              }
            }
          }
        });

        // Handle stream errors
        stream.on('error', (error: any) => {
          console.error('Stream error:', error);
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: 'Stream error occurred' })}\n\n`
          );
          res.end();
        });

        // Stream ends, save to database and close connection
        stream.on('end', async () => {
          try {
            const endTime = Date.now();
            const latencyMs = endTime - startTime;

            // 7. Save the query and response to the database
            //    including which chunks were used for retrieval
            await ChatService.saveQuery({
              sessionId: session.id,
              companyId,
              userId,
              queryText: query,
              responseText: fullResponse,
              retrievedChunkIds, // Use the actual PostgreSQL chunk IDs
              model: 'gpt-4o',
              tokensUsed: Math.ceil(fullResponse.length / 4), // Rough estimate
              latencyMs,
            });

            // 8. Send a final message indicating the stream is complete
            res.write(
              `data: ${JSON.stringify({
                type: 'end',
                sessionId: session.id,
                latencyMs,
              })}\n\n`
            );
          } catch (dbError: any) {
            console.error('Error saving query to database:', dbError);
            res.write(
              `data: ${JSON.stringify({ type: 'error', message: 'Failed to save query' })}\n\n`
            );
          } finally {
            res.end();
          }
        });
      } catch (streamError: any) {
        console.error('Error streaming from AI service:', streamError.message);
        res.write(
          `data: ${JSON.stringify({ type: 'error', message: 'Failed to stream response' })}\n\n`
        );
        res.end();
      }
    } catch (error: any) {
      console.error('Chat query error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  /**
   * Get chat session history
   */
  static async getChatHistory(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.userId;

      // Retrieve all queries in this session
      const queries = await prisma.query.findMany({
        where: {
          session_id: sessionId as string,
          user_id: userId as string, // Ensuring both are typed as single strings
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      return res.status(200).json({
        sessionId,
        messages: queries,
      });
    } catch (error: any) {
      console.error('Error fetching chat history:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
