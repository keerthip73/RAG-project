import json
import logging
import zipfile
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import ChatMessage, Conversation, Document, SessionLocal, get_db, init_db
from app.rag import answer_general, answer_question, index_document, remove_document_vectors, unique_upload_path
from app.schemas import ChatMessageOut, ChatRequest, ChatResponse, ConversationCreate, ConversationOut, DocumentOut, SourceOut
from app.storage import delete_blob, download_blob, get_blob, upload_blob

settings = get_settings()
app = FastAPI(
    title="RAG Document Chatbot",
    version="0.3.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)
api = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def configuration_error() -> str | None:
    if settings.is_vercel and not settings.database_url:
        return "DATABASE_URL is missing. Connect a Neon Postgres database to the backend Vercel project."
    if settings.is_vercel and not settings.blob_read_write_token:
        return "BLOB_READ_WRITE_TOKEN is missing. Connect a private Vercel Blob store to the backend project."
    provider = settings.llm_provider.lower()
    if provider == "gemini" and not settings.gemini_api_key:
        return "GEMINI_API_KEY is missing. Add a new Gemini key to backend/.env, then restart the backend."
    if provider == "openai" and not settings.openai_api_key:
        return "OPENAI_API_KEY is missing. Add it to backend/.env, or set LLM_PROVIDER=gemini and add GEMINI_API_KEY."
    if provider not in {"gemini", "openai"}:
        return "LLM_PROVIDER must be either gemini or openai."
    return None


@api.get("/health")
def health() -> dict[str, str | bool | None]:
    error = configuration_error()
    return {
        "status": "ok",
        "provider": settings.llm_provider.lower(),
        "ai_ready": error is None,
        "configuration_error": error,
    }


async def process_document(document_id: int, source_path: Path | None = None) -> None:
    temporary_path: Path | None = None
    with SessionLocal() as db:
        document = db.get(Document, document_id)
        if document is None:
            return
        document.status = "processing"
        db.commit()
        try:
            if source_path is None:
                if document.storage_kind == "blob":
                    temporary_path = await download_blob(document.stored_path, Path(document.filename).suffix.lower())
                    source_path = temporary_path
                else:
                    source_path = Path(document.stored_path)
            document.chunk_count = index_document(source_path, document.id, document.filename, db)
            document.status = "ready"
            document.error = None
        except Exception as exc:
            db.rollback()
            document = db.get(Document, document_id)
            logger.exception("Document indexing failed for %s", document_id)
            document.status = "failed"
            document.error = (
                str(exc)
                if isinstance(exc, RuntimeError) and "API_KEY" in str(exc)
                else
                "Gemini quota reached. Retry indexing in a minute."
                if "429" in str(exc) or "ResourceExhausted" in type(exc).__name__
                else "No readable text found. Scanned PDFs need OCR before indexing."
                if isinstance(exc, ValueError) and "No readable text found" in str(exc)
                else "Indexing failed. Check the backend logs, then retry."
            )
        finally:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)
        db.commit()


@api.post("/documents", response_model=DocumentOut, status_code=202)
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".pdf", ".docx", ".txt"}:
        raise HTTPException(status_code=400, detail="Upload a PDF, Word (.docx), or text (.txt) file")
    path = unique_upload_path(file.filename)
    size = 0
    try:
        with path.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > settings.upload_limit_mb * 1024 * 1024:
                    raise HTTPException(status_code=413, detail=f"File exceeds {settings.upload_limit_mb} MB")
                destination.write(chunk)
        if not size:
            raise HTTPException(status_code=400, detail="File is empty")
        if suffix == ".pdf":
            with path.open("rb") as uploaded:
                if uploaded.read(5) != b"%PDF-":
                    raise HTTPException(status_code=400, detail="File is not a valid PDF")
        if suffix == ".docx" and not zipfile.is_zipfile(path):
            raise HTTPException(status_code=400, detail="File is not a valid Word document")
        if suffix == ".txt":
            path.read_text(encoding="utf-8-sig")
    except HTTPException:
        path.unlink(missing_ok=True)
        raise
    except (OSError, UnicodeError) as exc:
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Could not read this file") from exc

    storage_kind = "local"
    stored_path = str(path)
    if settings.blob_read_write_token:
        try:
            stored_path = await upload_blob(path, file.filename)
            storage_kind = "blob"
        except Exception as exc:
            path.unlink(missing_ok=True)
            logger.exception("Blob upload failed")
            raise HTTPException(status_code=502, detail="Could not store the uploaded document") from exc

    document = Document(
        filename=file.filename,
        stored_path=stored_path,
        storage_kind=storage_kind,
        chunk_count=0,
        status="pending",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    if storage_kind == "blob" or settings.is_vercel:
        await process_document(document.id, path)
        path.unlink(missing_ok=True)
        db.refresh(document)
    else:
        background_tasks.add_task(process_document, document.id)
    return document


@api.get("/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.created_at.desc()).all()


@api.post("/documents/{document_id}/retry", response_model=DocumentOut, status_code=202)
async def retry_document(document_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    if document.status != "failed":
        raise HTTPException(status_code=409, detail="Only failed documents can be retried")
    document.status = "pending"
    document.error = None
    db.commit()
    db.refresh(document)
    if document.storage_kind == "blob" or settings.is_vercel:
        await process_document(document_id)
        db.refresh(document)
    else:
        background_tasks.add_task(process_document, document_id)
    return document


@api.get("/documents/{document_id}/file")
async def view_document(document_id: int, db: Session = Depends(get_db)):
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    media_type = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
    }[Path(document.filename).suffix.lower()]
    if document.storage_kind == "blob":
        result, stream = await get_blob(document.stored_path)
        if result is None or result.status_code != 200 or stream is None:
            raise HTTPException(status_code=404, detail="Document not found")
        return StreamingResponse(
            stream,
            media_type=media_type,
            headers={"Content-Disposition": f"inline; filename*=UTF-8''{quote(document.filename)}"},
        )
    if not Path(document.stored_path).is_file():
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(document.stored_path, media_type=media_type, filename=document.filename, content_disposition_type="inline")


@api.delete("/documents/{document_id}", status_code=204)
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    if document.status in {"pending", "processing"}:
        raise HTTPException(status_code=409, detail="Wait for indexing to finish before deleting this document")
    remove_document_vectors(document_id, db)
    conversation_ids = [row[0] for row in db.query(Conversation.id).filter(Conversation.document_id == document_id).all()]
    if conversation_ids:
        db.query(ChatMessage).filter(ChatMessage.conversation_id.in_(conversation_ids)).delete(synchronize_session=False)
        db.query(Conversation).filter(Conversation.id.in_(conversation_ids)).delete(synchronize_session=False)
    db.query(ChatMessage).filter(ChatMessage.document_id == document_id).delete(synchronize_session=False)
    stored_path = document.stored_path
    storage_kind = document.storage_kind
    db.delete(document)
    db.commit()
    if storage_kind == "blob":
        try:
            await delete_blob(stored_path)
        except Exception:
            logger.exception("Blob cleanup failed for document %s", document_id)
    else:
        Path(stored_path).unlink(missing_ok=True)


def _validate_mode(mode: str) -> None:
    if mode not in {"documents", "general"}:
        raise HTTPException(status_code=400, detail="Mode must be documents or general")


@api.get("/conversations", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db)):
    return db.query(Conversation).order_by(Conversation.created_at.desc(), Conversation.id.desc()).all()


@api.post("/conversations", response_model=ConversationOut)
def create_conversation(request: ConversationCreate, db: Session = Depends(get_db)):
    _validate_mode(request.mode)
    if request.mode == "general" and request.document_id is not None:
        raise HTTPException(status_code=400, detail="General chat cannot select a document")
    if request.document_id is not None and db.get(Document, request.document_id) is None:
        raise HTTPException(status_code=404, detail="Document not found")
    conversation = Conversation(title="New chat", mode=request.mode, document_id=request.document_id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@api.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation_id).delete()
    db.delete(conversation)
    db.commit()


@api.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    conversation = db.get(Conversation, request.conversation_id) if request.conversation_id else None
    if request.conversation_id and conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    mode = conversation.mode if conversation else request.mode
    document_id = conversation.document_id if conversation else request.document_id
    _validate_mode(mode)
    if mode == "general" and document_id is not None:
        raise HTTPException(status_code=400, detail="General chat cannot select a document")
    if document_id is not None:
        document = db.get(Document, document_id)
        if document is None or document.status != "ready":
            raise HTTPException(status_code=400, detail="Selected document is not ready")

    recent = (
        db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation.id)
        .order_by(ChatMessage.id.desc()).limit(6).all()
        if conversation else []
    )
    history = "\n".join(f"{message.role}: {message.content[:1000]}" for message in reversed(recent))

    try:
        if mode == "general":
            answer, docs = answer_general(question, history=history), []
        else:
            answer, docs = answer_question(question, db=db, document_id=document_id, history=history)
    except Exception as exc:
        logger.exception("Chat request failed")
        if isinstance(exc, RuntimeError) and ("API_KEY" in str(exc) or "LLM_PROVIDER" in str(exc)):
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        if "429" in str(exc) or "ResourceExhausted" in type(exc).__name__:
            raise HTTPException(status_code=429, detail="Gemini rate limit reached. Please retry shortly.") from exc
        raise HTTPException(status_code=502, detail="The AI service could not complete the request. Check the backend logs.") from exc

    sources = [
        SourceOut(
            document_id=doc.metadata.get("document_id"),
            filename=doc.metadata.get("filename", "Unknown"),
            page=doc.metadata.get("page"),
            snippet=doc.page_content[:350],
        )
        for doc in docs
    ]
    if conversation is None:
        conversation = Conversation(title=question[:80], mode=mode, document_id=document_id)
        db.add(conversation)
        db.flush()
    elif conversation.title == "New chat":
        conversation.title = question[:80]
    db.add_all([
        ChatMessage(document_id=document_id, conversation_id=conversation.id, role="user", content=question),
        ChatMessage(document_id=document_id, conversation_id=conversation.id, role="assistant", content=answer, sources_json=json.dumps([source.model_dump() for source in sources])),
    ])
    db.commit()
    return ChatResponse(answer=answer, sources=sources, conversation_id=conversation.id)


@api.get("/history", response_model=list[ChatMessageOut])
def chat_history(conversation_id: int | None = None, document_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(ChatMessage)
    if conversation_id is not None:
        query = query.filter(ChatMessage.conversation_id == conversation_id)
    elif document_id is not None:
        query = query.filter(ChatMessage.document_id == document_id)
    rows = query.order_by(ChatMessage.id.desc()).limit(200).all()
    return [
        ChatMessageOut(
            id=row.id, document_id=row.document_id, conversation_id=row.conversation_id,
            role=row.role, content=row.content, created_at=row.created_at,
            sources=json.loads(row.sources_json or "[]"),
        )
        for row in reversed(rows)
    ]


@api.delete("/history", status_code=204)
def clear_chat_history(conversation_id: int | None = None, document_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(ChatMessage)
    if conversation_id is not None:
        query = query.filter(ChatMessage.conversation_id == conversation_id)
    elif document_id is not None:
        query = query.filter(ChatMessage.document_id == document_id)
    query.delete(synchronize_session=False)
    db.commit()


app.include_router(api)
