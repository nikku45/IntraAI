# Phase 1: Minimum Viable Product (MVP) - Step-by-Step Execution Plan

**Goal:** Build a working ingestion pipeline, authentication, document upload, and basic RAG chat focusing on a single-tenant experience first.

As your AI pair programmer, I will guide you through each of these steps. When you are ready to begin, just tell me which step you're on, and I will provide the necessary code snippets, commands, or explanations!

---

## Step 1: Repository & Infrastructure Setup

_Our first goal is to establish the monorepo structure and spin up our local dependencies (Database, Redis, etc.) using Docker._

- [ ] **1.1 Initialize the Monorepo**
  - Create the base folders: `frontend`, `backend`, `ai-service`, `worker`, `shared`, and `infra`.
  - Initialize Git and set up code quality tools: ESLint, Prettier, and Husky pre-commit hooks.
- [ ] **1.2 Setup Docker Compose (`infra/docker-compose.yml`)**
  - Configure **PostgreSQL 16** for relational data.
  - Configure **Redis 7** for queues (BullMQ) and caching/rate-limiting.
  - Configure **ChromaDB** for vector storage.
  - (Optional) Configure MinIO if you prefer completely local S3-compatible file storage before moving to AWS S3.

## Step 2: Database Design & Initialization

_We need to define our relational data structures before building our backend API._

- [ ] **2.1 Choose an ORM/Query Builder**
  - Decide on Prisma, Drizzle, or raw pg (recommend Prisma for speed in an MVP).
- [ ] **2.2 Create the PostgreSQL Schema**
  - Define tables: `companies`, `users`, `documents`, `document_chunks`, `chat_sessions`, and `queries`.
  - Ensure `company_id` is present on every relevant table as a base for future tenant isolation.
- [ ] **2.3 Run Migrations**
  - Apply the schema to your local Docker PostgreSQL instance to verify it works.

  [done].

## Step 3: Node.js Backend API (Express.js) Setup

_Creating the core Express server that the frontend will interact with directly._

- [ ] **3.1 Initialize Express Project (`backend/`)**
  - Set up TypeScript, Express, error handling middleware, and folder structures (e.g., `/modules`, `/middleware`).
- [ ] **3.2 Implement Authentication**
  - Build `POST /api/v1/auth/register` (creates Company + User).
  - Build `POST /api/v1/auth/login` (verifies bcrypt hash, returns JWT).
  - Create a JWT authentication middleware to protect routes.
- [ ] **3.3 Implement Document Upload API**
  - Build `POST /api/v1/documents/upload` protected by JWT.
  - Use `multer` to handle file buffering.
  - Upload raw file to S3 (or local storage).
  - Create a `document` record in your PostgreSQL DB with status: `pending`.
  - Enqueue a BullMQ job `document_processing` indicating a file is ready.

## Step 4: Python AI Service Setup (FastAPI)

_Setting up the AI microservice that handles LangChain, Embeddings, and OpenAI interactions._

- [ ] **4.1 Initialize FastAPI Project (`ai-service/`)**
  - Setup Python (e.g., using `poetry` or `venv`), install `fastapi`, `langchain`, `uvicorn`, `chromadb`, and `openai`.
- [ ] **4.2 Implement Embedding & Indexing Endpoint**
  - Build `POST /embed` and `POST /index` endpoints.
  - Connect AI service to local ChromaDB.
  - This endpoint should take text chunks, use `text-embedding-3-small` to embed them, ano a `company_id` namespace.
- [ ] **4.3 Implement Query/RAG Pipeline Endpoint**
  - Build `POST /query`.
  - Extract query embeddings, perform cosine similarity search in ChromaDB.
  - Inject retrieved chunks into a LangChain context prompt.
  - Call `GPT-4o` (or `gpt-3.5-turbo`) and return the streamed response.

## Step 5: Background Worker (BullMQ + Node.js)

_Processing files behind the scenes so the UI d store them securely mapped tisn't blocked during heavy chunking/embedding operations._

- [ ] **5.1 Initialize Worker Project (`worker/`)**
  - Setup Node.js project and connect it to Redis via `BullMQ`.
- [ ] **5.2 Implement Document Processing Consumer**
  - Listen for jobs from `document_processing` queue.
  - Download the pending file from storage.
  - Parse text from PDF/DOCX (e.g., using `pdf-parse` or `mammoth`).
  - Use LangChain's `RecursiveCharacterTextSplitter` (1000 chars, 200 overlap) to chunk text.
- [ ] **5.3 Trigger indexing & Update Status**
  - Iterate over chunks and call the AI Service `POST /embed` API.
  - Update document status to `indexed` in PostgreSQL upon success (or `failed` if an error occurs).

## Step 6: Wrap up Backend & Chat Proxy

_Wiring the chat logic together before starting the UI._

- [ ] **6.1 Implement Chat Endpoint in Node Backend**
  - Build `POST /api/v1/chat/query` in the Node.js API to proxy requests to the Python AI service.
  - Establish Server-Sent Events (SSE) streaming back to the client.

## Step 7: Frontend Application (Next.js)

_Building the user interfaces using React, TailwindCSS, and shadcn/ui._

- [ ] **7.1 Initialize Next.js (`frontend/`)**
  - Configure TailwindCSS, install `shadcn/ui`, `lucide-react`, and state management like `zustand`.
- [ ] **7.2 Build Authentication Screens**
  - Login and Registration forms.
- [ ] **7.3 Build the Dashboard & Upload UI**
  - A dashboard to view documents and their statuses (`pending`, `processing`, `indexed`, `failed`).
  - A drag-and-drop file uploader that calls the `/documents/upload` API.
- [ ] **7.4 Build the Chat Interface**
  - Create the chat UI with streaming support (handling SSE).

---

**How we should proceed:**
Since you are leading the development, whenever you want to begin, just say something like:
_"Let's start with Step 1.1"_ or _"Help me configure the docker-compose.yml for Step 1.2"_ and I'll jump right in with the exact guidance, commands, and code you need!
