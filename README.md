# RAG Document Chatbot

Upload PDF, Word, and text files to chat with cited passages, or switch to general chat for questions beyond your documents.

## Stack

- FastAPI backend
- LangChain text splitting
- FAISS vector search
- OpenAI or Gemini LLM/embeddings
- React + Vite frontend
- SQLite metadata and chat history

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

- Upload PDFs, DOCX, or UTF-8 TXT files up to 20 MB each
- Index uploads in the background with status and retry controls
- Extract and chunk document text
- Store embeddings in a local FAISS index
- Ask questions across all documents or a selected document, or use general chat
- Receive AI answers with persistent document/page citations and source links
- Keep separate conversations and chat history in SQLite
- Delete a document and its indexed chunks
- Clear or delete individual conversations
- Download the visible chat transcript as text

## Limits and deployment

- Scanned/image-only PDFs currently need OCR before upload; text extraction alone cannot read them.
- General chat uses the configured AI model and does not consult uploaded files. Document mode remains grounded in retrieved passages.
- The app currently has no user accounts or private document isolation. Keep it on localhost or behind a trusted access layer; do not deploy it publicly with sensitive documents.
- SQLite and the FAISS index in `backend/data` must be backed up together. This folder is intentionally Git-ignored.
- Gemini quotas can delay or fail indexing. Failed documents can be retried from the sidebar when quota is available.

