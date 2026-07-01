from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import ChatMessage, Document, get_db, init_db
from app.rag import answer_question, index_pdf, unique_upload_path
from app.schemas import ChatMessageOut, ChatRequest, ChatResponse, DocumentOut, SourceOut

settings = get_settings()
app = FastAPI(title="RAG Document Chatbot", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/documents", response_model=DocumentOut)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    path = unique_upload_path(file.filename)
    content = await file.read()
    path.write_bytes(content)

    document = Document(filename=file.filename, stored_path=str(path), chunk_count=0)
    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        document.chunk_count = index_pdf(path, document.id, document.filename)
        db.commit()
        db.refresh(document)
    except Exception as exc:
        db.delete(document)
        db.commit()
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return document


@app.get("/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.created_at.desc()).all()


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    if request.document_id is not None:
        exists = db.query(Document).filter(Document.id == request.document_id).first()
        if exists is None:
            raise HTTPException(status_code=404, detail="Document not found")

    db.add(ChatMessage(document_id=request.document_id, role="user", content=question))
    answer, docs = answer_question(question, document_id=request.document_id)
    db.add(ChatMessage(document_id=request.document_id, role="assistant", content=answer))
    db.commit()

    sources = [
        SourceOut(
            document_id=doc.metadata.get("document_id"),
            filename=doc.metadata.get("filename", "Unknown"),
            page=doc.metadata.get("page"),
            snippet=doc.page_content[:350],
        )
        for doc in docs
    ]
    return ChatResponse(answer=answer, sources=sources)


@app.get("/history", response_model=list[ChatMessageOut])
def chat_history(document_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(ChatMessage)
    if document_id is not None:
        query = query.filter(ChatMessage.document_id == document_id)
    return query.order_by(ChatMessage.created_at.asc()).limit(200).all()

