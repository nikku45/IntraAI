# IntraAI — Multi-Tenant AI Knowledge & RAG Platform

> An enterprise-grade, multi-tenant Retrieval-Augmented Generation (RAG) platform that transforms unstructured internal documentation into secure, searchable, and queryable organizational intelligence.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-FF4400?style=flat&logo=bull&logoColor=white)](https://bullmq.io/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-FF6F61?style=flat&logo=databricks&logoColor=white)](https://www.trychroma.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 1. Overview

**IntraAI** is a multi-tenant AI Knowledge Platform designed to bridge the gap between static internal documents and employee decision-making. 

Organizations upload internal knowledge assets — standard operating procedures, employee handbooks, policy documentation, project specs, and engineering guidelines — in formats like PDF, DOCX, or plain text. IntraAI automatically parses, chunks, embeds, and indexes these assets into isolated vector spaces per tenant.

When an employee poses a question, IntraAI executes a semantic vector similarity search against the organization's isolated knowledge base, constructs a contextually grounded prompt, and streams precise, hallucination-resistant answers powered by Large Language Models (LLMs) back to the user in real time.

---

## 2. Problem & Solution

### The Problem
* **Information Fragmentation**: Critical company knowledge is scattered across PDFs, Word documents, wikis, and local drives, forcing employees to waste hours manually reading documents.
* **Inaccuracy of Keyword Search**: Standard keyword searches (e.g., Ctrl+F) match exact strings rather than intent or semantics, failing when users phrase queries naturally.
* **LLM Hallucinations**: Off-the-shelf LLMs possess no knowledge of private organizational data and tend to confidently fabricate facts when asked company-specific questions.
* **Data Security & Privacy**: Enterprises cannot upload internal data to public, un-isolated consumer AI models without risking data leakage across organizational boundaries.

### The Solution: IntraAI RAG Architecture
IntraAI solves these challenges using **Retrieval-Augmented Generation (RAG)** coupled with **strict tenant-level data isolation**:

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌────────────────────────┐
│  Internal Documents    │ ───► │  Asynchronous Worker &  │ ───► │ Tenant Vector Storage  │
│  (PDF, DOCX, TXT)      │      │  Embedding Engine       │      │  (ChromaDB Collection) │
└────────────────────────┘      └─────────────────────────┘      └────────────────────────┘
                                                                             │
┌────────────────────────┐      ┌─────────────────────────┐                  ▼
│ Grounded LLM Response  │ ◄─── │ Grounded Prompt Context │ ◄─── │ Semantic Similarity    │
│ (SSE Real-Time Stream) │      │ (Strict System Guard)   │      │ Search (Top-K Chunks)  │
└────────────────────────┘      └─────────────────────────┘      └────────────────────────┘
```

1. **Semantic Understanding**: Uses vector embeddings (`all-MiniLM-L6-v2`) to capture conceptual meaning rather than exact keywords.
2. **Fact-Grounded Generation**: Answers are synthesized strictly from retrieved document chunks, virtually eliminating LLM hallucination.
3. **Tenant Boundary Guarantees**: Data isolation is enforced at every layer: database schemas, queue workloads, and vector collection namespaces (`company_<company_id>`).

---

## 3. Key Features

- **Multi-Tenant Architecture**: Complete logical isolation of users, documents, vectors, and chat histories across different organizations.
- **Asynchronous Document Processing Pipeline**: Decoupled ingestion worker powered by **BullMQ** and **Redis** to parse, chunk, and embed large documents without blocking HTTP handlers.
- **Multi-Format Document Extraction**: Native text extraction support for `.pdf`, `.docx`, and plain text files.
- **Overlapping Sliding-Window Chunking**: Custom text splitter maintaining contextual continuity across chunk boundaries (1,000 characters per chunk, 200 character overlap).
- **High-Performance Vector Storage**: Tenant-partitioned ChromaDB collections for fast cosine/Euclidean vector similarity matching.
- **Real-Time Streaming SSE Responses**: Server-Sent Events (SSE) streaming model responses token-by-token directly to the Next.js frontend UI.
- **Session-Based Persistent Chat History**: Automatic session titling, persistence of query-response pairs, token usage metrics, and query latency tracking in PostgreSQL.
- **Cloud & Local Storage Fallback**: Integrated Cloudinary cloud storage with automated fallback to local disk storage for seamless developer experience.

---

## 4. Technology Stack

| Layer | Technology | Version / Tool | Purpose & Role |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Next.js / React | Next.js 16 / React 19 | Server/Client components, App Router, SSE stream handling |
| **Styling** | Tailwind CSS / Lucide | Tailwind v4 / Lucide React | Modern dark-mode interface and micro-animations |
| **State Management** | Zustand | v5.0 | Persistent client-side session state & auth token management |
| **Backend API** | Node.js / Express | Express v5 / TypeScript | RESTful API gateway, JWT auth, request routing & control logic |
| **Database ORM** | Prisma ORM | v7.6 | Type-safe PostgreSQL client, schema migrations, and queries |
| **Relational DB** | PostgreSQL | v16 | Primary storage for Companies, Users, Documents, Chunks & History |
| **Task Queue** | BullMQ | v5.73 | Producer/Consumer asynchronous job management |
| **In-Memory Cache** | Redis / IORedis | Redis v7 / IORedis v5 | Queue transport backing BullMQ |
| **Background Worker** | Node.js Worker | TypeScript / `pdf-parse` | Standalone worker consuming document parsing jobs |
| **AI / Microservice** | Python / FastAPI | FastAPI v0.100 / Uvicorn | Dedicated Python service for embeddings, vector search & LLM |
| **Vector Database** | ChromaDB | v0.4 | Local persistent or HTTP client vector collection database |
| **Embeddings** | HuggingFace | `all-MiniLM-L6-v2` | SentenceTransformer model producing 384-dim dense vectors |
| **LLM Provider** | Google Gemini API | `gemini-3.6-flash` / `pro` | Streaming response generation over retrieved prompt context |
| **Containerization** | Docker / Compose | Docker v3.8 | Local multi-container orchestration (Postgres, Redis, Chroma) |

---

## 5. System Architecture

IntraAI follows a decoupled, microservices-oriented monorepo architecture designed for reliability, horizontal scalability, and strict boundary separation between web handling, background ingestion, and heavy AI/embedding workloads.

```mermaid
graph TD
    subgraph Client Layer
        FE["Next.js Frontend App<br/>(React 19 / Tailwind / SSE)"]
    end

    subgraph API Gateway & Service Layer
        BE["Node.js / Express Backend API<br/>(JWT Auth / REST Endpoints)"]
        AUTH["Auth Middleware<br/>(Tenant Context Extraction)"]
    end

    subgraph Primary Storage & Transport
        PG[(PostgreSQL Database<br/>Prisma ORM)]
        REDIS[(Redis Server<br/>v7.0)]
    end

    subgraph Background Asynchronous Processing
        QUEUE["BullMQ Queue<br/>('document_processing')"]
        WORKER["Node.js Background Worker<br/>(pdf-parse / mammoth / splitter)"]
    end

    subgraph Dedicated AI Microservice
        FASTAPI["Python FastAPI Service<br/>('IntraAI Brain')"]
        ST_MODEL["Embedding Model<br/>(all-MiniLM-L6-v2)"]
        CHROMA[(ChromaDB Vector Store<br/>Tenant Collections)]
        GEMINI["Google Gemini API<br/>(LLM Generation)"]
    end

    FE -->|HTTP REST / SSE Stream| BE
    BE --> AUTH
    AUTH -->|Validate JWT & Enforce Tenant ID| BE
    BE -->|Read / Write Metadata & History| PG
    BE -->|Enqueue Processing Jobs| REDIS
    REDIS --> QUEUE
    QUEUE --> WORKER
    WORKER -->|Update Processing Status| PG
    WORKER -->|POST /index (Chunks & Metadata)| FASTAPI
    BE -->|POST /query & POST /chat| FASTAPI
    FASTAPI --> ST_MODEL
    ST_MODEL -->|Generate Embeddings| CHROMA
    FASTAPI -->|Retrieve Vector Matches| CHROMA
    FASTAPI -->|Prompt + Context Stream| GEMINI
    GEMINI -->|SSE Response Chunks| FASTAPI
    FASTAPI -->|SSE Stream Pipe| BE
    BE -->|SSE Stream Pipe| FE
```

### Component Responsibilities

1. **Frontend App (`frontend/`)**: Renders the authenticated dashboard, document upload manager, and real-time chat workspace. It manages tokens via Zustand and consumes chunked SSE streams from the API.
2. **Backend API (`backend/`)**: Handles authentication, user management, document upload ingestion, JWT generation, session history, and orchestrates requests to the queue and AI service.
3. **PostgreSQL Database (`backend/prisma/`)**: Serves as the single source of truth for structured relational data (companies, users, document metadata, chunk text references, and query logs).
4. **BullMQ Worker (`worker/`)**: Runs independently of the HTTP loop. It fetches uploaded files (from Cloudinary or local disk), extracts raw text, executes sliding-window chunking, triggers vector indexing, and writes chunk records to PostgreSQL.
5. **AI Service (`ai-service/`)**: A stateless Python FastAPI service encapsulating embedding generation, vector store retrieval, and LLM prompt stream construction.

---

## 6. Complete End-to-End Request Flow

When an employee submits a query (e.g., *"What is our company's remote work policy?"*), the request flows through the entire system via the sequence below:

```mermaid
sequenceDiagram
    autonumber
    actor User as Employee (Client)
    participant FE as Next.js Frontend
    participant BE as Express Backend API
    participant PG as PostgreSQL DB
    participant AI as Python AI Service
    participant CDB as ChromaDB Store
    participant LLM as Google Gemini API

    User->>FE: Submits question in chat input
    FE->>BE: POST /api/v1/chat/query { query, sessionId }<br/>[Header: Authorization: Bearer <JWT>]
    BE->>BE: Authenticate JWT -> Extract userId & companyId
    
    alt New Session
        BE->>PG: Create ChatSession record linked to companyId & userId
    else Existing Session
        BE->>PG: Validate session ownership
    end

    BE->>AI: POST /query { query, company_id, top_k: 5 }
    AI->>AI: Embed query string using all-MiniLM-L6-v2
    AI->>CDB: Query collection "company_<company_id>" (top_k=5)
    CDB-->>AI: Return matching chunk texts & document_ids
    AI-->>BE: Return retrieved vector results & metadata
    
    BE->>PG: Verify retrieved chunk IDs against tenant document_chunks table
    PG-->>BE: Return validated chunk records

    BE->>AI: POST /chat { query, company_id, context: [chunks], model }
    AI->>AI: Construct System Prompt + Grounded Document Context
    AI->>LLM: Call Gemini API with stream=True
    
    loop Real-Time Event Streaming (SSE)
        LLM-->>AI: Yield response token chunk
        AI-->>BE: SSE Event "data: {content_chunk}"
        BE-->>FE: SSE Event "data: {type: 'chunk', content: '...'}"
        FE-->>User: Render token in chat UI
    end

    BE->>PG: Save Query record (query, response, chunk_ids, latency, tokens)
    BE->>PG: Update ChatSession title & updated_at
```

### Step-by-Step Breakdown

1. **Authentication & Tenant Isolation**: The request carries a JWT containing `userId` and `companyId`. Middleware verifies the token signature and injects `req.user` into the request scope.
2. **Vector Similarity Retrieval**: The backend calls the Python AI service. The AI service embeds the user query using the local `all-MiniLM-L6-v2` model and queries the tenant's dedicated ChromaDB collection (`company_<company_id>`).
3. **Relational Data Verification**: The backend verifies the retrieved chunk IDs against PostgreSQL to ensure the referenced documents belong to the tenant and have an `indexed` status.
4. **Prompt Context Framing**: The retrieved text chunks are assembled into a structured system prompt instruct-tuned to prevent hallucinations.
5. **Streaming Generation**: The response is streamed from Gemini back to the frontend via Server-Sent Events (SSE), allowing immediate UI rendering without waiting for full completion.
6. **Audit & Analytics Persistence**: Upon stream completion, the full response, query parameters, token estimates, and latency statistics are saved to PostgreSQL for auditability.

---

## 7. Document Ingestion Pipeline

To keep the web API fast and responsive, file uploads and heavy processing (parsing, chunking, embedding) are processed asynchronously via a job queue.

```mermaid
graph LR
    subgraph Ingestion Trigger
        A[User Uploads File] --> B[Express Controller]
        B --> C{Cloudinary Configured?}
        C -->|Yes| D[Upload to Cloudinary]
        C -->|No / Fallback| E[Save to Local Disk /uploads]
        D --> F[Create DB Record: status='pending']
        E --> F
    end

    subgraph Queue Producer
        F --> G[Push Job to BullMQ Queue 'document_processing']
    end

    subgraph Async Worker Consumer
        G --> H[Worker Picks Up Job]
        H --> I[Update DB: status='processing']
        H --> J{Detect File Format}
        J -->|.pdf| K[pdf-parse Extraction]
        J -->|.docx| L[mammoth Text Extraction]
        J -->|.txt| M[Plain Text Read]
        K --> N[Sanitize Text Null Bytes]
        L --> N
        M --> N
    end

    subgraph Chunking & Vector Store
        N --> O[Sliding-Window Splitter<br/>1000 chars / 200 overlap]
        O --> P[POST /index to AI Service]
        P --> Q[ChromaDB Embed & Add to 'company_id' Collection]
        P --> R[Batch Insert DocumentChunk Records to PostgreSQL]
        R --> S[Update DB: status='indexed', chunk_count=N]
    end
```

### Why Asynchronous Queueing?
Parsing a 100-page PDF, generating embeddings for hundreds of chunks, and performing batch database writes can take tens of seconds. Running this on the main Express HTTP thread would block incoming user traffic and lead to gateway timeouts. BullMQ offloads this work to background workers with automatic error capturing and status reporting.

---

## 8. RAG Architecture

IntraAI implements a closed-loop Retrieval-Augmented Generation pipeline engineered specifically to eliminate LLM hallucinations by grounding answer generation strictly in retrieved context.

```mermaid
flowcard
graph TD
    subgraph Phase 1: Ingestion & Vectorization
        DOC[Raw Document] --> PARSE[Text Extractor]
        PARSE --> SPLIT[Sliding-Window Splitter]
        SPLIT --> EMBED_IN[SentenceTransformer all-MiniLM-L6-v2]
        EMBED_IN --> VEC_DB[(ChromaDB: Collection 'company_id')]
    end

    subgraph Phase 2: Retrieval & Verification
        USER_Q[User Query] --> EMBED_Q[Embed Query String]
        EMBED_Q --> COSINE[Cos/Euclidean Similarity Match]
        VEC_DB --> COSINE
        COSINE --> TOP_K[Select Top-K Chunks]
        TOP_K --> PG_VERIFY[PostgreSQL Tenant Verification]
    end

    subgraph Phase 3: Context-Grounded Generation
        PG_VERIFY --> PROMPT_ENG[Construct System & User Prompt]
        PROMPT_ENG --> LLM_GEN[Google Gemini API]
        LLM_GEN --> STREAM[SSE Token Stream to User]
    end
```

### Technical Details of RAG Steps

1. **Text Chunking strategy**:
   Uses an overlapping character-level sliding window (`splitText`):
   - **Chunk Size**: `1000` characters
   - **Chunk Overlap**: `200` characters
   - Overlap ensures that sentences split across chunk boundaries do not lose semantic connection.

2. **Embedding Model**:
   `all-MiniLM-L6-v2` via HuggingFace / `sentence-transformers`.
   - **Dimensionality**: 384 dimensions
   - Runs locally inside the `ai-service` container for zero API cost and fast vector computation.

3. **Tenant-Isolated Vector Storage**:
   ChromaDB uses named collections: `company_<company_id>`. Vectors, raw text, and document metadata IDs are co-located in the same tenant collection.

4. **Prompt Framing Strategy**:
   The retrieved document chunks are formatted into a strict system prompt:
   ```text
   You are a helpful AI assistant for a company.
   You have been provided with relevant context from company documents.
   Answer the user's question based on the provided context.
   If the context doesn't contain relevant information, acknowledge this and provide a helpful response based on general knowledge.
   Be concise and professional.
   ```

---

## 9. Multi-Tenancy & Data Isolation

Multi-tenancy in IntraAI is built from the ground up using **Logical Tenant Partitioning** across all layers: API authentication, relational queries, queue payloads, and vector store namespaces.

```mermaid
graph TD
    subgraph Request Authentication
        REQ[Incoming HTTP Request] --> JWT_MIDDLEWARE[Auth Middleware]
        JWT_MIDDLEWARE -->|Decode & Verify Token| TENANT_CTX[Extract tenant_id / company_id]
    end

    subgraph Relational Database Isolation
        TENANT_CTX --> PG_QUERY[PostgreSQL Query Scope]
        PG_QUERY -->|Enforce WHERE company_id = tenant_id| PG_DATA[(Tenant-Scoped Tables)]
    end

    subgraph Vector Store Isolation
        TENANT_CTX --> CHROMA_QUERY[ChromaDB Vector Scope]
        CHROMA_QUERY -->|Access Collection: company_tenant_id| VEC_DATA[(Isolated Tenant Vector Collection)]
    end
```

### Security Boundary Guarantees

| Boundary Layer | Isolation Mechanism | Enforced Location |
| :--- | :--- | :--- |
| **Authentication** | Cryptographically signed JWT tokens storing `userId` and `companyId`. | `auth.middleware.ts` |
| **Relational Data** | Every database query includes explicit `where: { company_id: req.user.companyId }`. | `Prisma ORM Services` |
| **Vector Storage** | ChromaDB collections are dynamically created per tenant using `company_<company_id>`. | `ai-service/main.py` |
| **Background Jobs** | BullMQ job payloads contain `companyId` for worker-level database & vector isolation. | `worker/src/index.ts` |
| **Chat History** | Chat sessions and queries are linked via foreign keys to `company_id`. | PostgreSQL `chat_sessions` |

---

## 10. Database Architecture

IntraAI utilizes PostgreSQL 16 managed via Prisma ORM for structured relational storage, coupled with ChromaDB for vector storage.

### Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    Company ||--o{ User : "has many"
    Company ||--o{ Document : "owns"
    Company ||--o{ DocumentChunk : "owns"
    Company ||--o{ ChatSession : "owns"
    Company ||--o{ Query : "owns"

    User ||--o{ Document : "uploads"
    User ||--o{ ChatSession : "initiates"
    User ||--o{ Query : "executes"

    Document ||--o{ DocumentChunk : "contains"
    ChatSession ||--o{ Query : "contains"

    Company {
        uuid id PK
        string name
        string slug UK
        enum plan "free | pro | enterprise"
        int max_users
        int max_documents
        datetime created_at
        datetime updated_at
    }

    User {
        uuid id PK
        uuid company_id FK
        string email UK
        string password_hash
        enum role "admin | member | viewer"
        boolean is_active
        datetime last_login_at
        datetime created_at
    }

    Document {
        uuid id PK
        uuid company_id FK
        uuid uploaded_by FK
        string name
        string s3_key
        bigint file_size
        string mime_type
        enum status "pending | processing | indexed | failed"
        int chunk_count
        string error_message
        datetime created_at
    }

    DocumentChunk {
        uuid id PK
        uuid document_id FK
        uuid company_id FK
        int chunk_index
        string chunk_text
        int token_count
        string vector_id
        datetime created_at
    }

    ChatSession {
        uuid id PK
        uuid company_id FK
        uuid user_id FK
        string title
        datetime created_at
        datetime updated_at
    }

    Query {
        uuid id PK
        uuid session_id FK
        uuid company_id FK
        uuid user_id FK
        string query_text
        string response_text
        string_array retrieved_chunk_ids
        string model_used
        int tokens_used
        int latency_ms
        datetime created_at
    }
```

### Relational Database vs. Vector Database Linkage
- **PostgreSQL**: Stores human-readable chunk text (`chunk_text`), metadata, token counts, and ownership relationships.
- **ChromaDB**: Stores numeric 384-dimensional vector embeddings referenced by `vector_id` (`{document_id}_{chunk_index}`).

---

## 11. Backend Architecture

The backend API is built with Express and TypeScript, organized into modular feature domains:

```mermaid
graph TD
    REQ[Client Request] --> ROUTE[Express Router]
    ROUTE --> MIDDLEWARE[Auth & Validation Middleware]
    MIDDLEWARE --> CONTROLLER[Controller Layer]
    CONTROLLER --> SERVICE[Service Layer]
    SERVICE --> PRISMA[Prisma Client / DB]
    SERVICE --> QUEUE[BullMQ Queue Producer]
    SERVICE --> AISVC[Python AI Service Client]
```

### Architectural Modules
- **`src/modules/auth`**: User registration, company onboarding in single Prisma transactions, password hashing, and JWT issuance.
- **`src/modules/documents`**: File upload handler (Multer + Cloudinary), document registry, and BullMQ queue dispatcher.
- **`src/modules/chat`**: Context retrieval orchestration, chat session lifecycle, SSE stream piping, and analytics logging.

---

## 12. Worker & Queue Architecture

The worker process is decoupled from the main HTTP API, using **Redis** as a persistent queue message broker.

```mermaid
graph TD
    subgraph Express Web Process
        UPLOAD[File Upload Endpoint] --> QUEUE_PROD[BullMQ Queue Producer]
        QUEUE_PROD -->|Job Data: documentId, companyId, filePath| REDIS_Q[(Redis Broker)]
    end

    subgraph Independent Worker Process
        REDIS_Q -->|Fetch Next Job| WORKER_CONS[BullMQ Worker Loop]
        WORKER_CONS --> DB_PROC[Set Document Status = 'processing']
        WORKER_CONS --> PARSER[Parse PDF / DOCX / TXT]
        PARSER --> SPLIT[Split Text into Chunks]
        SPLIT --> INDEX[HTTP POST /index to AI Service]
        INDEX --> SAVE_CHUNKS[Batch Insert DocumentChunk Records]
        SAVE_CHUNKS --> DB_DONE[Set Document Status = 'indexed']
        WORKER_CONS -->|On Exception| DB_FAIL[Set Document Status = 'failed']
    end
```

---

## 13. AI Service Architecture

The AI service (`ai-service/main.py`) acts as the specialized intelligence engine for vector operations and LLM inference.

```mermaid
graph TD
    subgraph FastAPI Application
        INDEX_EP["POST /index"]
        QUERY_EP["POST /query"]
        CHAT_EP["POST /chat"]
    end

    subgraph Embedding Engine
        ST_EMBED["SentenceTransformer ('all-MiniLM-L6-v2')"]
    end

    subgraph Vector Database
        CDB_LOCAL["ChromaDB Local Persistent Storage / HTTP"]
    end

    subgraph LLM Provider
        GEMINI_API["Google Gemini API ('gemini-3.6-flash')"]
    end

    INDEX_EP --> ST_EMBED
    ST_EMBED -->|Vector Array| CDB_LOCAL
    QUERY_EP --> ST_EMBED
    ST_EMBED -->|Query Vector| CDB_LOCAL
    CDB_LOCAL -->|Top-K Chunks| QUERY_EP
    CHAT_EP -->|Prompt + Grounded Context| GEMINI_API
    GEMINI_API -->|SSE Token Generator| CHAT_EP
```

---

## 14. API Documentation

### Base URL: `/api/v1`

| Method | Endpoint | Description | Auth Required | Tenant Scoped |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new company & admin user | No | Created |
| `POST` | `/auth/login` | Authenticate user & return JWT token | No | Resolved |
| `POST` | `/documents/upload` | Upload a document for asynchronous RAG indexing | Yes (Bearer) | Yes |
| `GET` | `/documents` | List all uploaded documents for the organization | Yes (Bearer) | Yes |
| `POST` | `/chat/query` | Send a query and receive a real-time SSE stream answer | Yes (Bearer) | Yes |
| `GET` | `/chat/sessions` | Fetch all historical chat sessions for the user | Yes (Bearer) | Yes |
| `GET` | `/chat/history/:id` | Fetch message history for a specific chat session | Yes (Bearer) | Yes |
| `PATCH` | `/chat/sessions/:id`| Rename a chat session | Yes (Bearer) | Yes |
| `DELETE`| `/chat/sessions/:id`| Delete a chat session and all linked queries | Yes (Bearer) | Yes |

### Representative Request & Response Example

#### Upload Document: `POST /api/v1/documents/upload`
**Headers**: `Authorization: Bearer <JWT_TOKEN>`  
**Body**: `multipart/form-data` (`file: <PDF/DOCX/TXT>`)

**Response (`201 Created`)**:
```json
{
  "message": "Document uploaded successfully! Task queued for processing.",
  "document": {
    "id": "e8c3aeed-3031-4345-8182-a7d80bd06fad",
    "name": "Employee_Handbook_2026.pdf",
    "status": "pending"
  }
}
```

---

## 15. Security

### Implemented Security Features
- **JWT Cryptographic Authentication**: Signed tokens containing `userId` and `companyId` with expiration.
- **Password Hashing**: Passwords are hashed using `bcryptjs` with a cost factor of 12.
- **Transactional Organization Creation**: Company registration and admin creation occur within an atomic database transaction (`prisma.$transaction`).
- **HTTP Security Headers**: Express app secured with `helmet` middleware.
- **Cross-Origin Resource Sharing (CORS)**: Configured to restrict unauthorized cross-origin requests.
- **Data Null-Byte Sanitization**: Text extractions sanitized to prevent SQL/Postgres null byte (`\u0000`) injection errors.
- **Tenant Scope Enforcement**: Strict multi-tenant data boundaries enforced on all database queries and vector collections.

### Future Security Enhancements
- Fine-grained Role-Based Access Control (RBAC) per document folder.
- Dynamic rate limiting per IP and tenant using Redis rate limiters.
- Automated prompt injection detection & sanitization filters.

---

## 16. Project Structure

```text
IntraAI/
├── ai-service/                 # Dedicated Python FastAPI AI/RAG Microservice
│   ├── chroma_db/              # Local persistent ChromaDB vector storage
│   ├── main.py                 # FastAPI endpoints (/index, /query, /chat)
│   └── requirements.txt        # Python dependencies (FastAPI, ChromaDB, Gemini)
├── backend/                    # Node.js Express REST API
│   ├── prisma/
│   │   └── schema.prisma       # Database models & Prisma ORM configuration
│   ├── src/
│   │   ├── lib/                # Shared utilities (Prisma client, Cloudinary, Queue)
│   │   ├── middleware/         # Auth & global error middleware
│   │   ├── modules/
│   │   │   ├── auth/           # Login, registration, token generation
│   │   │   ├── chat/           # RAG query handler, session manager, SSE streaming
│   │   │   └── documents/      # Upload controller, document listing service
│   │   └── index.ts            # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Next.js 16 Web Application
│   ├── app/
│   │   ├── (auth)/             # Auth routes (/login, /register)
│   │   ├── dashboard/          # Application workspace (/documents, /chat)
│   │   ├── globals.css         # Global styling & Tailwind directives
│   │   └── layout.tsx          # Root layout
│   ├── lib/                    # Axios API client with automatic JWT interceptors
│   ├── store/                  # Zustand global state (authStore)
│   ├── package.json
│   └── next.config.ts
├── worker/                     # Asynchronous BullMQ Background Worker
│   ├── src/
│   │   ├── index.ts            # Worker consumer loop & file processing pipeline
│   │   ├── prisma.ts           # Shared Prisma database instance
│   │   └── splitter.ts         # Sliding-window text chunking utility
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml          # Multi-container orchestration (PostgreSQL, Redis, ChromaDB)
├── render.yaml                 # Infrastructure-as-code deployment blueprint
├── vercel.json                 # Vercel deployment configuration
└── README.md                   # Engineering documentation
```

---

## 17. Local Setup

### Prerequisites
- **Node.js**: `v18+` or `v20+`
- **Python**: `v3.10+`
- **Docker & Docker Desktop**: Installed and running
- **Git**

### Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/nikku45/IntraAI.git
cd IntraAI
```

#### 2. Start Infrastructure Containers via Docker
```bash
docker compose up -d
```
This boots up PostgreSQL on port `5433`, Redis on port `6379`, and ChromaDB on port `8001`.

#### 3. Setup Backend Environment & Install Dependencies
```bash
cd backend
npm install
```
Create `backend/.env`:
```env
PORT=4000
DATABASE_URL="postgresql://admin:password@localhost:5433/intraai_db?schema=public"
JWT_SECRET="super_secret_jwt_key_for_development"
AI_SERVICE_URL="http://localhost:8000"
REDIS_HOST="localhost"
REDIS_PORT=6379
# Optional Cloudinary credentials:
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Sync Database Schema:
```bash
npx prisma db push
npx prisma generate
```

#### 4. Setup Worker Environment & Install Dependencies
```bash
cd ../worker
npm install
```
Create `worker/.env`:
```env
REDIS_HOST="localhost"
REDIS_PORT=6379
DATABASE_URL="postgresql://admin:password@localhost:5433/intraai_db?schema=public"
AI_SERVICE_URL="http://localhost:8000"
```

#### 5. Setup AI Service Environment & Install Dependencies
```bash
cd ../ai-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```
Create `ai-service/.env`:
```env
GEMINI_API_KEY="your_google_gemini_api_key"
CHROMA_HOST="localhost"
CHROMA_PORT=8001
```

#### 6. Setup Frontend Environment & Install Dependencies
```bash
cd ../frontend
npm install
```
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
```

#### 7. Run All Services concurrently

Open separate terminal windows:

- **Terminal 1 (Backend API)**:
  ```bash
  cd backend && npm run dev
  ```
- **Terminal 2 (Worker Service)**:
  ```bash
  cd worker && npm run dev
  ```
- **Terminal 3 (Python AI Service)**:
  ```bash
  cd ai-service && python main.py
  ```
- **Terminal 4 (Next.js Frontend)**:
  ```bash
  cd frontend && npm run dev
  ```

Visit `http://localhost:3000` to access IntraAI.

---

## 18. Engineering Decisions

### 1. Dedicated AI Microservice vs. Monolithic Node.js AI Processing
* **Problem**: Running heavy vector transformations, embedding models, and LLM orchestration inside Express blocks the Node.js event loop.
* **Decision**: Built a dedicated Python FastAPI service (`ai-service`).
* **Reason**: Python has native support for HuggingFace embeddings (`sentence-transformers`) and ChromaDB vector operations.
* **Trade-off**: Increases system operational complexity by adding a inter-service HTTP dependency.

### 2. Asynchronous Queue Processing (BullMQ + Redis) vs. Direct Ingestion
* **Problem**: Parsing large PDFs and embedding hundreds of chunks takes time, risking client timeouts.
* **Decision**: Implemented BullMQ queue for document ingestion.
* **Reason**: Immediate 201 response to client while background workers reliably process jobs asynchronously.
* **Trade-off**: Requires Redis infrastructure.

### 3. SentenceTransformer Embeddings vs. Cloud API Embeddings
* **Problem**: Paying third-party APIs for embedding generation during heavy document processing creates high recurring costs.
* **Decision**: Used CPU-optimized `all-MiniLM-L6-v2` running locally in Python.
* **Reason**: Zero cost, fast execution, 384-dimensional dense representations ideal for domain documents.
* **Trade-off**: Higher CPU/RAM usage during ingestion.

---

## 19. Scalability

```mermaid
graph TD
    subgraph Horizontal API Scaling
        LB[Load Balancer] --> API1[Backend API Node 1]
        LB --> API2[Backend API Node 2]
    end

    subgraph Distributed Worker Scaling
        REDIS[(Redis Queue Broker)] --> W1[Worker Instance 1]
        REDIS --> W2[Worker Instance 2]
        REDIS --> W3[Worker Instance 3]
    end

    subgraph Vector & Database Scaling
        W1 --> PG[(PostgreSQL Pool / Read Replicas)]
        W2 --> PG
        W3 --> CHROMA[(ChromaDB Cluster)]
    end
```

### Current Architectural Scaling Strategies
- **Stateless API Gateway**: Express instances can be scaled horizontally behind a Load Balancer.
- **Horizontal Worker Scaling**: Additional BullMQ workers can be spawned across servers to scale document parsing capacity.
- **Relational Connection Pooling**: Managed PostgreSQL connection pools allow high concurrent connection limits.

---

## 20. Failure Handling & Reliability

- **Graceful Storage Fallback**: If Cloudinary upload fails, the controller automatically falls back to local disk storage (`uploads/`).
- **Database Transaction Safety**: User registration and tenant initialization execute inside an atomic Prisma `$transaction` block.
- **Error Tracking**: Unhandled document parsing exceptions update the document record in PostgreSQL with `status: 'failed'` and save the sanitized `error_message`.
- **Text Null-Byte Filtering**: Prevents PostgreSQL string encoding crashes caused by invalid binary characters in PDFs.

---

## 21. Deployment Architecture

IntraAI is configured for multi-tier cloud deployment using Render and Vercel.

```mermaid
graph TD
    subgraph Vercel Cloud Platform
        VERCEL[Next.js Frontend Deployment]
    end

    subgraph Render Cloud Platform
        API_SVC[intraai-backend: Express Web Service]
        AI_SVC[intraai-ai-service: Python Web Service]
        PG_CLOUD[(intraai-postgres: Managed PostgreSQL)]
    end

    subgraph External Cloud Infrastructure
        CLOUDINARY[Cloudinary CDN Storage]
        GEMINI_CLOUD[Google Gemini LLM API]
        UPSTASH[Upstash Managed Redis]
    end

    VERCEL -->|REST & SSE Requests| API_SVC
    API_SVC --> PG_CLOUD
    API_SVC --> UPSTASH
    API_SVC --> CLOUDINARY
    API_SVC -->|POST /query & /chat| AI_SVC
    AI_SVC --> GEMINI_CLOUD
```

---

## 22. Future Improvements

- **Hybrid Search & Reranking**: Combining BM25 keyword search with dense vector embeddings (Cross-Encoders) to improve retrieval accuracy.
- **Document Chunk Citation**: Highlighting specific page numbers and document passages in the chat UI.
- **Fine-Grained RBAC**: Folder-level and document-level permission controls for enterprise users.
- **Semantic Caching**: Caching previous LLM answers in Redis using vector similarity thresholds to reduce API costs.

---

## 23. Engineering Concepts Demonstrated

- **Full-Stack Systems Architecture**: End-to-end multi-tier monorepo implementation.
- **Multi-Tenant System Isolation**: Complete data separation across relational databases and vector stores.
- **Retrieval-Augmented Generation (RAG)**: Complete pipeline construction (chunking, vectorization, prompt grounding, streaming).
- **Asynchronous Workflows**: Event-driven background processing with BullMQ and Redis.
- **Database Engineering**: Relational modeling, indexing, foreign keys, transaction handling with Prisma.
- **Production AI Integration**: Local vector embeddings coupled with external streaming LLMs (Gemini API).

---

Distributed under the ISC License. Built by **Nitin Rajput**.
