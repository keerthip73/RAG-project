# RAG Document Chatbot

Upload PDFs, index their contents, and chat with them using semantic retrieval plus source citations.

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

Set either OpenAI or Gemini keys in `backend/.env`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

## Features

- Upload one or more PDF files
- Extract and chunk PDF text
- Store embeddings in a local FAISS index
- Ask questions across all documents or a selected document
- Receive AI answers with document/page citations
- Persist chat history in SQLite
- Delete a document and its indexed chunks
- Clear chat history for the selected document or all documents
- Download the visible chat transcript as text

