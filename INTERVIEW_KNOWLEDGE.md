# INTERVIEW_KNOWLEDGE.md

# PHASE 1 — UNDERSTAND THE PROJECT

### High-Level Summary
**Project Name:** IntraAI
**Purpose of the Application:** A company-specific AI Knowledge Base and RAG (Retrieval-Augmented Generation) system. It allows companies to upload their internal documents, index them using vector embeddings, and interact with an AI assistant that answers questions based strictly on those documents.
**Business Problem:** Companies have vast amounts of internal data (PDFs, DOCX, etc.) but no easy way to query or retrieve specific information quickly without manual searching. IntraAI provides an "AI brain" for company knowledge.
**Target Users:** Company employees, admins, and members who need to query internal documentation.

### Core Architecture Flow
```text
User
 ↓ (Uploads doc / Asks question via Next.js Frontend)
Frontend (Next.js)
 ↓ (REST APIs / SSE for Chat)
Backend (Express.js + Prisma)
 │
 ├──▶ [Auth Middleware] 
 │
 ├──▶ Document Upload Flow
 │    ↓ (Saves file, adds job to Redis Queue)
 │   Redis (BullMQ)
 │    ↓ 
 │   Worker (Node.js) ─▶ Extracts text (pdf-parse/mammoth) ─▶ Chunks text
 │    ↓
 │   AI Service (FastAPI) ─▶ all-MiniLM-L6-v2 ─▶ ChromaDB (Vector DB)
 │    ↓
 │   PostgreSQL (Updates document status to 'indexed')
 │
 └──▶ Chat Query Flow
      ↓ (Calls /query)
     Backend Controller
      ↓ (Fetches Context)
     AI Service (FastAPI) ─▶ Similarity Search in ChromaDB
      ↓ (Streams Response via Google Gemini)
     AI Service streams back to Backend
      ↓ (SSE - Server-Sent Events)
     Frontend displays real-time response
      ↓
     PostgreSQL (Saves chat session and query metadata)
```

---

# PHASE 2 — PROJECT STRUCTURE

### Project Directory Structure

| Directory/File | Purpose | Important Components |
| -------------- | ------- | -------------------- |
| `backend/` | Main API server for handling auth, uploads, and routing chat queries. | `src/modules/auth`, `src/modules/chat`, `src/modules/documents`, `prisma/schema.prisma` |
| `frontend/` | The user interface built with Next.js. | `app/page.tsx`, `app/(auth)/`, `app/dashboard/` |
| `worker/` | Background job processor for heavy document parsing tasks. | `src/index.ts` (BullMQ worker), `src/splitter.ts` |
| `ai-service/` | Python microservice for embeddings, vector storage, and LLM interaction. | `main.py` (FastAPI), `chroma_db/` |
| `infra/` | Infrastructure and deployment configurations. | `docker-compose.yml` (Postgres, Redis, ChromaDB) |
| `shared/` | Shared utilities or types (Inferred based on folder existence). | `UNKNOWN` |

---

# PHASE 3 — TECHNOLOGY STACK

| Technology | Where Used | Why Used | Important Concept |
| ---------- | ---------- | -------- | ----------------- |
| **TypeScript / Node.js** | Backend, Worker, Frontend | Type safety, unified language across stack, vast ecosystem. | Interfaces, Promises, Event Loop. |
| **Express.js** | Backend API | Lightweight, flexible routing framework for the main API. | Middlewares, Routes, Controllers. |
| **Next.js** | Frontend | React framework providing SSR/SSG, routing, and optimized builds. | App Router, Server/Client components. |
| **Python / FastAPI** | AI Service | Python has the best ecosystem for AI/ML (SentenceTransformers). FastAPI is asynchronous and fast. | ASGI, Pydantic validation, StreamingResponse. |
| **PostgreSQL** | Primary Database | Relational integrity for Users, Companies, Chat Sessions, and Document metadata. | Foreign keys, ACID compliance. |
| **Prisma ORM** | Backend & Worker | Type-safe database client, schema migrations, and easy relationship management. | Schema models, `$transaction`, generated client. |
| **ChromaDB** | AI Service | Open-source vector database to store and query text embeddings for RAG. | Similarity Search, Persistent storage. |
| **Redis & BullMQ** | Backend & Worker | Redis is the message broker; BullMQ handles reliable background job processing for heavy document parsing. | Queues, Workers, Retries, Async processing. |
| **SentenceTransformers** | AI Service | Local embedding model (`all-MiniLM-L6-v2`) running on CPU to convert text to vectors without API costs. | Embeddings, Vectorization. |
| **Google Gemini API** | AI Service | The LLM (Large Language Model) used to generate final answers based on retrieved context. | RAG prompt engineering, Streaming (SSE). |
| **JWT & bcryptjs** | Backend Auth | Stateless authentication and secure password hashing. | Access tokens, Hash salts. |
| **Docker Compose** | Infra | Container orchestration to run Postgres, Redis, and Chroma locally with one command. | Services, Volumes, Port mapping. |

---

# PHASE 4 — COMPLETE APPLICATION ARCHITECTURE

```text
                    ┌────────────────────────┐
                    │  User (Web Browser)    │
                    └───────────┬────────────┘
                                │ HTTP / SSE
                                ▼
                    ┌────────────────────────┐
                    │   Frontend (Next.js)   │
                    └───────────┬────────────┘
                                │ API Calls
                                ▼
         ┌──────────────────────────────────────────────┐
         │              Backend (Express)               │
         │                                              │
         │  [Auth]        [Documents]        [Chat]     │
         └───────┬────────────────┬─────────────┬───────┘
                 │                │             │
        (Reads/Writes)      (Adds Job)          │ (REST HTTP)
                 │                │             │
                 ▼                ▼             ▼
          ┌────────────┐   ┌────────────┐  ┌──────────────────┐
          │ PostgreSQL │   │   Redis    │  │   AI Service     │
          │ (Metadata) │   │  (BullMQ)  │  │   (FastAPI)      │
          └────────────┘   └──────┬─────┘  └──────┬─────┬─────┘
                 ▲                │               │     │
                 │                ▼               ▼     ▼
                 │         ┌────────────┐  ┌────────┐ ┌────────┐
                 │         │   Worker   │  │ Chroma │ │ Google │
                 └─────────┤ (Node.js)  ├──┤  (DB)  │ │ Gemini │
             (Updates DB)  └────────────┘  └────────┘ └────────┘
                           (Parses PDFs)
```

---

# PHASE 5 — DATABASE DEEP DIVE

**Technology:** PostgreSQL managed via Prisma ORM.

### Key Models & Relationships

```text
Model: Company
Purpose: Multi-tenant architecture. Groups users and documents together.
Fields: id, name, slug, plan, max_users.
Relationships: 1-to-Many with User, Document, DocumentChunk, ChatSession, Query.
Validation: Unique slug.

Model: User
Purpose: Represents a person logging into the system.
Fields: id, company_id, email, password_hash, role.
Relationships: Belongs to Company. Has many Documents, ChatSessions.
Indexes: Unique on email.

Model: Document
Purpose: Tracks uploaded files before and after AI processing.
Fields: id, company_id, uploaded_by, s3_key, status (pending, processing, indexed, failed).
Relationships: Belongs to Company, User. Has many DocumentChunks.

Model: DocumentChunk
Purpose: Stores the actual text chunks extracted from a document for fallback and token counting.
Fields: chunk_index, chunk_text, token_count, vector_id.
Relationships: Belongs to Document, Company.
Why it exists: ChromaDB holds the vectors, Postgres holds the text and metadata for easy querying and deletion.

Model: Query
Purpose: Logs every question asked and the AI's response for history and analytics.
Fields: query_text, response_text, retrieved_chunk_ids, tokens_used, latency_ms.
Relationships: Belongs to ChatSession.
```

**Interview Prep:**
*   **Why PostgreSQL + Prisma?** Postgres offers strong relational integrity needed for a multi-tenant SaaS (Companies -> Users -> Documents). Prisma provides type-safe queries, preventing runtime errors.
*   **How do you prevent data bleeding between companies?** Every core model (User, Document, ChatSession, Query) has a `company_id`. Queries always filter by the authenticated user's `company_id`.
*   **Why store DocumentChunks in Postgres if they are in ChromaDB?** ChromaDB is optimized for similarity search, not relational querying. Storing the raw text and metadata in Postgres allows us to easily delete a document and cascade delete its chunks, while keeping a reliable source of truth.

---

# PHASE 6 — API DOCUMENTATION

| Method | Endpoint | Purpose | Controller | Service |
| ------ | -------- | ------- | ---------- | ------- |
| POST | `/api/v1/auth/register` | Register company/admin | `auth.controller.ts` | `AuthService.registerUser` |
| POST | `/api/v1/auth/login` | User login | `auth.controller.ts` | `AuthService.loginUser` |
| POST | `/api/v1/documents/upload`| Upload file for RAG | `DocumentController` | `DocumentService.uploadDocument` |
| GET | `/api/v1/documents` | List company documents | `DocumentController` | `DocumentService.getDocuments` |
| POST | `/api/v1/chat/query` | Ask the AI a question | `ChatController` | `ChatService.streamChatResponse` |
| GET | `/api/v1/chat/:sessionId/history`| Get chat history | `ChatController` | `prisma.query.findMany` |

### Detailed Flow: Document Upload (`POST /api/v1/documents/upload`)
1. **Client:** Sends `multipart/form-data` with a file (PDF/DOCX).
2. **Middleware:** `auth.middleware.ts` validates JWT. `multer` saves the file to disk (e.g., `uploads/`).
3. **Controller:** `DocumentController.uploadDocument` validates file existence.
4. **Service:** Creates a `Document` record in Postgres with status `pending`. Pushes a job to the BullMQ Redis queue `document_processing`.
5. **Response:** Returns `201 Created` with document ID, allowing the user to continue working while processing happens in the background.

---

# PHASE 7 — FUNCTION-BY-FUNCTION UNDERSTANDING

```text
Function: worker (BullMQ Worker Instance)
File: worker/src/index.ts
Purpose: Process uploaded documents asynchronously.

Step-by-step execution:
1. Pulls a job from Redis `document_processing` queue.
2. Updates Postgres Document status to `processing`.
3. Reads the file from disk using `fs`.
4. Extracts text using `pdf-parse` (for PDFs) or `mammoth` (for DOCX).
5. Sanitizes text (removes null characters that crash Postgres).
6. Calls `splitText` to chunk the document into 1000-char blocks with 200-char overlaps.
7. Makes an HTTP POST to AI Service (`/index`) to generate embeddings in ChromaDB.
8. Saves the text chunks into Postgres `DocumentChunk`.
9. Updates Document status to `indexed`.

Why it is implemented this way: Document parsing (especially PDFs) and embedding generation are CPU-intensive and slow. If done synchronously in the main Express API, it would block the event loop and crash the server. Using BullMQ guarantees job completion and retries on failure.
```

```text
Function: chat_with_knowledge (FastAPI Endpoint)
File: ai-service/main.py
Purpose: The core RAG (Retrieval-Augmented Generation) engine.

Step-by-step execution:
1. Receives a user query and `company_id`.
2. Connects to the company's specific ChromaDB collection using `all-MiniLM-L6-v2` embedding model.
3. Performs a similarity search (`collection.query`) to find the top 5 relevant text chunks.
4. Constructs a Prompt injecting the retrieved chunks as "Context".
5. Calls Google Gemini (`model.generate_content`) with `stream=True`.
6. Yields the response chunk-by-chunk using Server-Sent Events (SSE).

Why it is implemented this way: Streaming the response drastically improves UX, as the user doesn't have to wait 10 seconds for the LLM to finish thinking before seeing text.
```

---

# PHASE 8 — COMPLETE BUSINESS FLOWS

## Flow: Chat Query (RAG Flow)

### Step-by-step
1. **User asks:** "What is our company's refund policy?"
2. **Frontend:** Sends POST to Backend `/api/v1/chat/query`.
3. **Backend Controller:** Validates JWT, extracts `company_id`. Sets up SSE headers (`Content-Type: text/event-stream`).
4. **Backend Service:** Makes HTTP POST to AI Service `/query` to fetch relevant chunks from ChromaDB.
5. **AI Service:** Embeds the question, searches ChromaDB, returns top 3 matching chunks.
6. **Backend Service:** Makes HTTP POST to AI Service `/chat` passing the chunks to bypass re-querying.
7. **AI Service:** Connects to Gemini, streams the response back to Backend.
8. **Backend Controller:** Pipes the stream directly to the Frontend using SSE (`res.write`).
9. **Stream End:** Backend saves the Query (prompt, response, chunks used, latency) to Postgres.
10. **Frontend:** Renders the markdown incrementally.

**Failure Handling:** If the AI Service is down, the Backend catches the error and sends an SSE error event to the frontend, safely terminating the stream.

---

# PHASE 9 — AUTHENTICATION & AUTHORIZATION

**Mechanism:** JWT (JSON Web Tokens) with Bearer token header.

**Registration Flow:**
1. `AuthService.registerUser` checks if the email exists.
2. Hashes the password using `bcryptjs` (salt rounds: 12).
3. Uses a **Prisma `$transaction`** to create the `Company` and the `User` (as admin) simultaneously. This prevents orphaned users if company creation fails.
4. Generates a JWT containing `userId` and `companyId`, expiring in 7 days.

**Login Flow:**
1. `AuthService.loginUser` fetches user and compares passwords using `bcrypt.compare`.
2. Issues JWT.

**Middleware:** `auth.middleware.ts` intercepts requests, verifies the JWT using `jsonwebtoken`, and attaches the `userId` and `companyId` to the `req` object, ensuring downstream controllers are inherently secure.

**Interview Prep:**
*   **Why JWT?** It's stateless. The backend doesn't need to query the database or a session store on every request to know who the user is.
*   **Where is the token stored?** (Inferred from standard practices) Usually in HttpOnly cookies or LocalStorage on the frontend.
*   **Weakness:** The current implementation has a 7-day expiration but no refresh token logic mentioned. If the token is stolen, it's valid for 7 days. *Improvement:* Implement short-lived access tokens (15 mins) and HttpOnly refresh tokens.

---

# PHASE 10 — ERROR HANDLING

**Mechanism:** Centralized Error Handling in Express.

1. Any error thrown in a controller/service is passed to `next(error)`.
2. The `app.use(errorHandler)` in `backend/src/index.ts` catches it.
3. Errors have a `.statusCode` property. If missing, it defaults to 500.
4. **Worker Errors:** If a document fails (e.g., corrupted PDF), BullMQ catches it in a `try/catch`. The worker updates the `Document` status in Postgres to `failed` and saves the `error_message` so the frontend can display it to the user.

**Interview Prep:**
*   **Why centralized error handling?** It prevents duplicated `try/catch/res.status(500)` logic in every single route. It ensures consistent error JSON structure across the entire API.

---

# PHASE 11 — EXTERNAL SERVICES

| Service | Purpose | Where | Fallback / Failure Behavior |
| ------- | ------- | ----- | --------------------------- |
| **Google Gemini API** | LLM generation | AI Service | If Gemini fails, the stream yields an error JSON object. |
| **HuggingFace Models** | Text Embedding | AI Service | Runs **locally** using `all-MiniLM-L6-v2`. No API failure risk, but uses CPU. |

---

# PHASE 12 — ASYNC / BACKGROUND PROCESSING

**Technology:** BullMQ (Redis-backed).

**Why it's used:**
Parsing a 50-page PDF, running OCR, chunking it, and calculating vector embeddings takes time (often 5-20 seconds).
If this was synchronous inside Express:
1. The user's browser would spin, waiting for a response (poor UX).
2. Express's single thread (Event Loop) would be blocked, making the API unresponsive to other users.

**Implementation:**
1. Express creates a DB record and pushes `{ documentId, filePath }` to Redis. Responds immediately (201).
2. The Worker (a separate Node process) picks up the job, processes it, and updates the DB status to `indexed`.
3. The Frontend can poll the DB or use WebSockets (if implemented) to show progress.

---

# PHASE 13 — FRONTEND DEEP DIVE

*(Inferred based on standard Next.js App Router and Project context)*
**Technology:** Next.js (React).
**Features:**
*   **File Uploads:** Standard forms calling the `/upload` endpoint.
*   **Chat Interface:** Uses Server-Sent Events (SSE) to read the stream from the backend. The UI updates continuously as chunks of text arrive, similar to ChatGPT.
*   **State:** Likely uses React `useState` to append incoming SSE text chunks to the current message bubble.

---

# PHASE 14 — SECURITY ANALYSIS

**Current Defenses:**
*   **SQL Injection:** Prevented entirely by using Prisma ORM.
*   **Password Storage:** Secured using `bcryptjs` (salt rounds: 12).
*   **Tenant Isolation:** `company_id` enforced in the JWT and Prisma queries.
*   **Headers:** `helmet` is used in Express to secure HTTP headers.

**Known Limitations (NOT IMPLEMENTED):**
*   **Rate Limiting:** No rate limiting is visible. A malicious user could spam the `/chat` endpoint, driving up Gemini API costs. *Fix:* Add `express-rate-limit`.
*   **File Upload Validation:** `multer` saves the file, but we should strictly validate MIME types and file sizes to prevent malware uploads.
*   **Vector Isolation:** ChromaDB collections are namespaced `company_{id}`, which is good, but if a bug allows injecting a different company ID, isolation breaks.

---

# PHASE 15 — PERFORMANCE & SCALABILITY

**Current Bottlenecks:**
1.  **AI Service CPU Usage:** Local embeddings (`all-MiniLM-L6-v2`) run on the CPU. Under heavy load, this will choke.
2.  **File System Uploads:** Files are saved to a local `uploads/` folder. This breaks horizontal scalability. If we spin up 3 Backend instances, Instance B cannot access a file uploaded to Instance A.

**How to Scale (Interview Answers):**
1.  **Storage:** Move uploads to AWS S3 immediately. The worker should download from S3 instead of local disk.
2.  **Embeddings:** Move embedding generation to a GPU-backed instance or use an external API (like OpenAI's `text-embedding-ada-002`) to offload CPU work.
3.  **Database:** Add connection pooling (PgBouncer) for Postgres, as serverless or heavily scaled Node apps can exhaust DB connections.

---

# PHASE 16 — DEPLOYMENT & DEVOPS

**Current Infrastructure:**
*   Docker Compose manages Postgres, Redis, and ChromaDB locally.
*   Backend, Worker, and AI Service are run locally via `nodemon` and `uvicorn`.

**Production Deployment Strategy (How I would deploy it):**
1.  **Backend/Worker/Frontend:** Dockerize all Node.js and Python apps.
2.  **Hosting:** Deploy to AWS ECS (Fargate) or a Kubernetes cluster for auto-scaling.
3.  **Databases:** Use managed services: AWS RDS for Postgres, ElastiCache for Redis.
4.  **Vector DB:** Host ChromaDB on an EC2 instance with attached EBS volumes, or use a managed vector DB like Pinecone/Weaviate.

---

# PHASE 17 — DESIGN DECISIONS

*   **Decision:** Splitting Backend and Worker.
    *   **Why:** Document parsing blocks the Event Loop. Separating it keeps the API fast.
*   **Decision:** Using Python for the AI Service.
    *   **Why:** While LangChain.js exists, the Python ML ecosystem (SentenceTransformers, ChromaDB) is vastly superior, more stable, and easier to implement local models with.
*   **Decision:** Storing document chunks in Postgres AND ChromaDB.
    *   **Why:** ChromaDB is a vector index, not a relational database. Keeping text chunks in Postgres allows us to easily render them in the UI, trace them back to specific pages, and cascade delete them when a document is removed.

---

# PHASE 18 — PROBLEMS AND CHALLENGES

**Challenge:** Handling large PDF parsing and Null characters.
**Problem:** Postgres crashes if you try to insert text containing the null character `\u0000`, which frequently occurs in dirty PDF extracts.
**Solution:** Added regex sanitization `rawText.replace(/\0/g, '')` in the worker before inserting into Postgres.

**Challenge:** Slow LLM response times.
**Problem:** Waiting for a full generated answer takes 5-10 seconds, ruining UX.
**Solution:** Implemented Server-Sent Events (SSE) in the AI Service and Express Backend. The Backend listens to the Python stream and pipes it directly `res.write()` to the frontend, providing a ChatGPT-like typing experience.

---

# PHASE 19 — INTERVIEW QUESTIONS

### Beginner
*   What is the purpose of this project?
*   What is the tech stack?
*   Why did you choose Prisma over raw SQL?
*   How do you run this project locally? (Docker Compose).

### Intermediate
*   How does the document upload and parsing flow work?
*   Why use BullMQ and Redis? Why not just `await processDocument()`?
*   Explain the RAG (Retrieval-Augmented Generation) pipeline in your app.
*   How does the streaming chat response work across Microservices (Python -> Express -> React)?

### Advanced
*   How do you ensure data isolation between different companies in the Vector Database?
*   If you deployed this to production tomorrow, what would break first under high load? (Local file uploads, CPU bounds on embeddings).
*   How do you handle failures if the LLM provider (Gemini) goes down?

### Scenario-Based
*   *Interviewer:* "What happens if two users upload the same document at exactly the same time?"
*   *Interviewer:* "How would you implement a feature to 'delete' a document from the AI's memory?"

---

# PHASE 20 — INTERVIEW-READY ANSWERS

### Q: Explain the RAG pipeline in your app.
**Answer:**
"When a user asks a question, the request hits our Express backend, which forwards it to our Python AI Service. The AI Service uses a local HuggingFace model (`all-MiniLM-L6-v2`) to convert the question into a vector. It then queries ChromaDB, our vector database, to perform a similarity search against the user's company-specific collection. Once it retrieves the top 3 most relevant text chunks, it injects those chunks into a prompt alongside the user's question. This prompt is sent to Google's Gemini API. Finally, we stream the response back through Python to Express, and then via Server-Sent Events to the frontend React app."

### Q: Why did you separate the background worker from the main API?
**Answer:**
"Node.js runs on a single-threaded Event Loop. Document parsing, especially reading PDFs and chunking text, is a highly CPU-intensive task. If I ran that in the main Express application, it would block the event loop, meaning no other users could log in or chat while a document was processing. By offloading this to a separate BullMQ worker process backed by Redis, the Express API simply queues the job and responds instantly with a 201 Created. The worker handles the heavy lifting independently, ensuring the API remains highly available."

---

# PHASE 21 — "EXPLAIN THIS PROJECT" ANSWER

**Candidate:**
"I built IntraAI, a B2B SaaS platform that acts as an AI knowledge base for companies. The problem it solves is that companies have scattered internal documents, and finding specific answers is tedious. 

I architected a microservices-based system using Next.js on the frontend, an Express.js backend with PostgreSQL, and a separate Python FastAPI service for the AI logic. When a company uploads a document, my Node backend pushes a job to a Redis queue. A background worker picks it up, extracts the text, and sends it to the Python service, which uses a local embedding model to vectorize the text and store it in ChromaDB. 

The coolest part is the chat interface. When a user asks a question, the system retrieves relevant document chunks from ChromaDB, feeds them to the Gemini LLM as context, and streams the answer back to the UI in real-time using Server-Sent Events. The biggest technical challenge was orchestrating the streaming architecture across three different systems (React to Express to Python) while maintaining low latency."

---

# PHASE 22 — DEEP-DIVE QUESTIONS

**Interviewer:** "You mentioned storing files locally. How does this impact deployment?"
**Candidate:** "Right now, it's a limitation. Storing files in the local `uploads/` folder prevents horizontal scaling because a worker on Server B can't access a file uploaded to Server A. If I were to deploy this to production, my immediate next step would be integrating AWS S3. The Express app would generate a Presigned URL for direct upload, or save to S3 and pass the S3 Key to the worker."

**Interviewer:** "How do you handle Vector Database tenant isolation?"
**Candidate:** "I handle multi-tenancy by dynamically creating a unique collection in ChromaDB for every company, named `company_{id}`. When an API request comes in, the Express backend extracts the `company_id` from the secure JWT, ensuring the Python service only ever queries that specific company's vector collection."

---

# QUICK REVISION

### Project
*   **Purpose:** RAG-based AI assistant for internal company documents.
*   **Main Flow:** Upload Doc -> Queue -> Worker Parses -> Python Embeds -> ChromaDB -> User Asks Question -> ChromaDB Retrieves -> Gemini Answers.

### Stack
*   **Backend:** Express, TypeScript, Prisma, Postgres, Redis, BullMQ.
*   **AI Service:** Python, FastAPI, ChromaDB, SentenceTransformers (local embeddings), Gemini.
*   **Frontend:** Next.js.

### Most Important Functions
*   `worker/src/index.ts`: Pulls from queue, parses PDFs, chunks text, calls AI service.
*   `ai-service/main.py -> chat_with_knowledge`: Performs Vector Search, builds Prompt, streams Gemini.
*   `chat.controller.ts -> queryChat`: Manages SSE connection, saves query history to DB.

### Biggest Technical Challenge
Orchestrating real-time streaming (SSE) across a Node.js backend and a Python microservice, while ensuring the data was correctly parsed and chunked in the background without blocking the main event loop.

### Known Limitations
*   **Local File Storage:** Needs S3 for horizontal scaling.
*   **No Rate Limiting:** Vulnerable to API spam and high LLM costs.
*   **CPU Embeddings:** Local embeddings on the AI service will become a bottleneck under heavy load.

---
*Generated by Antigravity AI based on full codebase analysis.*
