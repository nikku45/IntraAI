import os
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions
from pydantic import BaseModel
from typing import List, Optional
import json

# Prefer Google's Generative AI client for Gemini
try:
    import google.generativeai as genai
except Exception:
    genai = None

# 1. Load environment variables from .env file
load_dotenv()

# 2. Initialize our FastAPI app
app = FastAPI(title="IntraAI Brain Service")

# 3. Setup Gemini (Google) API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if genai and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    if not genai:
        print("WARNING: google.generativeai library not installed. Install it to use Gemini.")
    if not GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY / GOOGLE_API_KEY not set. Gemini chat endpoint will fail.")

# 4. Setup our Local "Translator" (The Embedding Model)
# This is the "Engine" that turns text into vectors (lists of numbers).
# It runs entirely on your CPU — no API keys needed!
print("Loading local embedding model (all-MiniLM-L6-v2)...")
local_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# 5. Connect to ChromaDB (Our Vector Storage)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# ──────────────────────────────────────────────
# Data Models (Like TypeScript Interfaces)
# ──────────────────────────────────────────────
class IndexRequest(BaseModel):
    document_id: str
    company_id: str
    chunks: List[str]

class QueryRequest(BaseModel):
    query: str
    company_id: str
    top_k: int = 3  # How many "top" paragraphs should we find?

class ChatRequest(BaseModel):
    query: str
    company_id: str
    top_k: int = 5  # How many relevant chunks to retrieve
    model: str = "gpt-4o"  # or "gpt-3.5-turbo"
    context: Optional[List[str]] = None  # Optional: pre-retrieved chunk texts

# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "model": "all-MiniLM-L6-v2 (Local HuggingFace)",
        "vector_store": "ChromaDB Connected"
    }

@app.post("/index")
async def index_document(data: IndexRequest):
    """
    Receives text chunks, turns them into vectors using our local model,
    and saves them into a company-specific collection in ChromaDB.
    """
    # 1. Get or create a "bucket" for this company
    #    Notice: we pass local_ef so ChromaDB knows HOW to embed the text!
    collection = chroma_client.get_or_create_collection(
        name=f"company_{data.company_id}",
        embedding_function=local_ef  # <-- THE MAGIC LINK!
    )

    # 2. Store the chunks (ChromaDB auto-embeds them using local_ef)
    collection.add(
        documents=data.chunks,
        ids=[f"{data.document_id}_{i}" for i in range(len(data.chunks))],
        metadatas=[{"document_id": data.document_id} for _ in data.chunks]
    )

    return {
        "message": f"Successfully indexed {len(data.chunks)} chunks",
        "document_id": data.document_id,
        "company_id": data.company_id
    }

@app.post("/query")
async def query_knowledge(data: QueryRequest):
    """
    Takes a question, finds the most relevant knowledge in ChromaDB,
    and returns it to be used in a chat response.
    """
    # 1. Open the company's "Memory" bucket (same model so search matches indexing!)
    collection = chroma_client.get_or_create_collection(
        name=f"company_{data.company_id}",
        embedding_function=local_ef  # <-- SAME model used for indexing!
    )

    # 2. Perform the "Similarity Search" (Finding Nearest Neighbors)
    results = collection.query(
        query_texts=[data.query],
        n_results=data.top_k
    )

    # 3. Return the matching text chunks
    return {
        "query": data.query,
        "results": results['documents'][0] if results['documents'] else [],
        "metadata": results['metadatas'][0] if results['metadatas'] else []
    }

@app.post("/chat")
async def chat_with_knowledge(data: ChatRequest):
    """
    Full RAG pipeline: retrieves relevant documents, injects them into a prompt,
    and streams the GPT response back to the client.
    
    Uses Server-Sent Events (SSE) streaming for real-time response delivery.
    """
    try:
        # 1. Use provided context if available, otherwise retrieve from ChromaDB
        if data.context and len(data.context) > 0:
            retrieved_chunks = data.context
        else:
            collection = chroma_client.get_or_create_collection(
                name=f"company_{data.company_id}",
                embedding_function=local_ef
            )

            results = collection.query(
                query_texts=[data.query],
                n_results=data.top_k
            )

            retrieved_chunks = results['documents'][0] if results['documents'] else []

        # 2. Build the context string from retrieved chunks
        context = "\n\n".join([f"[Document]:\n{chunk}" for chunk in retrieved_chunks])

        # 3. Create the prompt with context
        system_prompt = """You are a helpful AI assistant for a company. 
You have been provided with relevant context from company documents.
Answer the user's question based on the provided context.
If the context doesn't contain relevant information, acknowledge this and provide a helpful response based on general knowledge.
Be concise and professional."""

        user_message = f"""Context from company documents:
{context if context else "No relevant documents found."}

User Question: {data.query}

Please provide a helpful answer based on the context above."""

        # 4. Stream the response from Gemini (Google) if available, otherwise fallback
        def generate():
            """Generator function that streams the response from Gemini or falls back."""
            # Prepare messages in a neutral format
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]

            # If google.genrativeai is available, try streaming
            if genai and GEMINI_API_KEY:
                try:
                    for event in genai.chat.stream(model=data.model, messages=messages, temperature=0.7):
                        # Event can be a dict-like object; extract text content defensively
                        text = None
                        if isinstance(event, dict):
                            # common field names: 'delta', 'message', 'content'
                            if 'delta' in event and isinstance(event['delta'], dict):
                                # delta may contain 'content' or 'text'
                                text = event['delta'].get('content') or event['delta'].get('text')
                            elif 'message' in event and isinstance(event['message'], dict):
                                # message may have 'content' as list or string
                                m = event['message']
                                if isinstance(m.get('content'), list):
                                    # concatenate text parts
                                    parts = []
                                    for c in m['content']:
                                        if isinstance(c, dict) and 'text' in c:
                                            parts.append(c['text'])
                                    text = ''.join(parts) if parts else None
                                else:
                                    text = m.get('content')
                        elif hasattr(event, 'delta'):
                            d = getattr(event, 'delta')
                            if isinstance(d, dict):
                                text = d.get('content') or d.get('text')

                        if text:
                            # Send as SSE fragment
                            yield f"data: {json.dumps(text)}\n\n"
                    return
                except Exception as e:
                    print(f"Gemini streaming failed: {e}")

            # Fallback: try a synchronous call (non-streaming) using genai.chat.create if available
            try:
                if genai and GEMINI_API_KEY:
                    resp = genai.chat.create(model=data.model, messages=messages, temperature=0.7)
                    # resp may contain 'candidates' or 'output' fields
                    text_out = None
                    if isinstance(resp, dict):
                        # attempt common keys
                        if 'candidates' in resp and len(resp['candidates']) > 0:
                            cand = resp['candidates'][0]
                            text_out = cand.get('content') or cand.get('output') or json.dumps(cand)
                        elif 'output' in resp:
                            text_out = resp['output']
                    else:
                        text_out = str(resp)

                    if text_out:
                        yield f"data: {json.dumps(text_out)}\n\n"
                        return
            except Exception as e:
                print(f"Gemini non-streaming failed: {e}")

            # Last resort: error message
            yield f"data: {json.dumps('Error: no LLM available')}\n\n"

        # 5. Return the streaming response
        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        print(f"Chat error: {str(e)}")
        return {"error": str(e)}, 500

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
