import { prisma } from '../../lib/prisma';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export class ChatService {
  /**
   * Create or retrieve an existing chat session for a user
   */
  static async getOrCreateSession(data: {
    sessionId?: string;
    companyId: string;
    userId: string;
    title?: string;
  }) {
    if (data.sessionId) {
      // User is continuing an existing session
      const session = await prisma.chatSession.findUnique({
        where: { id: data.sessionId },
      });
      if (!session) {
        throw new Error('Chat session not found');
      }
      return session;
    }

    // Create a new session
    const session = await prisma.chatSession.create({
      data: {
        title: data.title || 'New Chat',
        company: { connect: { id: data.companyId } },
        user: { connect: { id: data.userId } },
      },
    });

    return session;
  }

  /**
   * Retrieve relevant document chunks from the AI Service
   * This queries ChromaDB for the most relevant knowledge,
   * then verifies and enriches with data from PostgreSQL
   */
  static async retrieveContext(queryText: string, companyId: string) {
    try {
      // 1. Get embeddings & similarity search from ChromaDB via AI Service
      const chromatResults = await axios.post(`${AI_SERVICE_URL}/query`, {
        query: queryText,
        company_id: companyId,
        top_k: 5, // Retrieve top 5 most relevant chunks
      });

      const retrievedChunkIds = chromatResults.data.metadata
        .map((m: any) => m.document_id)
        .filter(Boolean);

      // 2. Query PostgreSQL to get the actual chunk records
      //    This ensures we have all metadata, permissions, etc.
      const chunks = await prisma.documentChunk.findMany({
        where: {
          company_id: companyId,
          document_id: {
            in: retrievedChunkIds,
          },
        },
        include: {
          document: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      // 3. Enrich results with PostgreSQL data
      return {
        query: queryText,
        results: chromatResults.data.results, // Chunk texts from ChromaDB
        chunks: chunks, // Full chunk objects from PostgreSQL
        metadata: chromatResults.data.metadata,
      };
    } catch (error: any) {
      console.error('Error retrieving context:', error.message);
      throw new Error('Failed to retrieve context');
    }
  }

  /**
   * Send the query to the AI Service and get a streamed response
   * This returns a readable stream that we can pipe to the client
   */
  static async streamChatResponse(queryText: string, companyId: string, context?: string[]) {
    try {
      // Make a request with responseType: 'stream' to get a stream
      const response = await axios.post(
        `${AI_SERVICE_URL}/chat`,
        {
          query: queryText,
          company_id: companyId,
          // If the backend already retrieved relevant chunks, pass them
          // so the AI service can skip another vector search.
          context: context && context.length ? context : undefined,
        },
        {
          responseType: 'stream',
        }
      );

      return response.data; // Return the stream directly
    } catch (error: any) {
      console.error('Error streaming from AI service:', error.message);
      throw new Error('Failed to stream chat response');
    }
  }

  /**
   * Save the query and response to the database for history/audit
   */
  static async saveQuery(data: {
    sessionId: string;
    companyId: string;
    userId: string;
    queryText: string;
    responseText: string;
    retrievedChunkIds: string[];
    model: string;
    tokensUsed: number;
    latencyMs: number;
  }) {
    const query = await prisma.query.create({
      data: {
        session: { connect: { id: data.sessionId } },
        company: { connect: { id: data.companyId } },
        user: { connect: { id: data.userId } },
        query_text: data.queryText,
        response_text: data.responseText,
        retrieved_chunk_ids: data.retrievedChunkIds,
        model_used: data.model,
        tokens_used: data.tokensUsed,
        latency_ms: data.latencyMs,
      },
    });

    return query;
  }
}
