from datetime import datetime

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: int
    filename: str
    chunk_count: int
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


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceOut]


class ChatMessageOut(BaseModel):
    id: int
    document_id: int | None
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}

