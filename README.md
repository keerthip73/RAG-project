# RAG Document Chatbot

Upload PDF, Word, and text files to chat with cited passages, or switch to general chat for questions beyond your documents.

## Stack

- FastAPI backend
- LangChain text splitting
- Database-backed semantic search
- OpenAI or Gemini LLM/embeddings
- React + Vite frontend
- SQLite locally; Neon Postgres on Vercel
- Vercel Blob for production uploads

## Quick Start

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --reload-dir app --port 8000
```

Set `LLM_PROVIDER=gemini` and `GEMINI_API_KEY`, or configure OpenAI, in `backend/.env`. Do not commit API keys. Rotate any key that has been shared publicly.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

## Features

- Upload PDFs, DOCX, or UTF-8 TXT files up to 20 MB locally
- Index uploads in the background with status and retry controls
- Extract and chunk document text
- Store document chunks and embeddings in the configured database
- Ask questions across all documents or a selected document, or use general chat
- Receive AI answers with persistent document/page citations and source links
- Keep separate conversations and chat history in durable storage
- Delete a document and its indexed chunks
- Clear or delete individual conversations
- Download the visible chat transcript as text

## Limits and deployment

- Scanned/image-only PDFs currently need OCR before upload; text extraction alone cannot read them.
- General chat uses the configured AI model and does not consult uploaded files. Document mode remains grounded in retrieved passages.
- The app currently has no user accounts or private document isolation. Keep it on localhost or behind a trusted access layer; do not deploy it publicly with sensitive documents.
- Local SQLite data and uploads live in `backend/data`, which is intentionally Git-ignored.
- Vercel Function requests are limited to 4.5 MB, so production uploads are capped at 4 MB. Larger files require a direct-to-Blob upload flow.
- Gemini quotas can delay or fail indexing. Failed documents can be retried from the sidebar when quota is available.

## Deploy everything on Vercel

The root `vercel.json` uses Vercel Services to deploy the Vite frontend and FastAPI backend together. Browser requests to `/api/*` go to FastAPI; all other requests go to the frontend.

1. Import this GitHub repository into Vercel. Keep the project root at the repository root; do not select `frontend` or `backend` as the root directory.
2. Add a Neon Postgres integration to the project. It injects `DATABASE_URL` automatically.
3. Add a private Vercel Blob store to the same project. It injects `BLOB_READ_WRITE_TOKEN` automatically.
4. Add these project environment variables for Production, Preview, and Development:

```text
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-new-private-key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
```

5. Deploy, then open `/api/health` on the deployment. It should return `"ai_ready": true`.

Never use a Gemini key that has been pasted into chat or committed anywhere; create a new key for deployment. Never put `GEMINI_API_KEY`, `DATABASE_URL`, or `BLOB_READ_WRITE_TOKEN` in a `VITE_*` variable because Vite variables are public browser code. This app does not yet provide user accounts, so upload only non-sensitive demonstration documents to a public deployment.

