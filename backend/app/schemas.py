from datetime import datetime

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: int
    filename: str
    chunk_count: int
    status: str
    error: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SourceOut(BaseModel):
    document_id: int
    filename: str
    page: int | None = None
    snippet: str


class ChatRequest(BaseModel):
    question: str
    document_id: int | None = None
    conversation_id: int | None = None
    mode: str = "documents"


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceOut]
    conversation_id: int


class ConversationCreate(BaseModel):
    mode: str = "documents"
    document_id: int | None = None


class ConversationOut(BaseModel):
    id: int
    title: str
    mode: str
    document_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageOut(BaseModel):
    id: int
    document_id: int | None
    conversation_id: int | None
    role: str
    content: str
    sources: list[SourceOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}

