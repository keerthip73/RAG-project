from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_path: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="ready", nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    mode: Mapped[str] = mapped_column(String(20), default="documents", nullable=False)
    document_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    document_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id"), nullable=True)
    conversation_id: Mapped[int | None] = mapped_column(ForeignKey("conversations.id"), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sources_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    document: Mapped[Document | None] = relationship()


settings = get_settings()
engine = create_engine(f"sqlite:///{settings.db_path}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        columns = {column["name"] for column in inspect(connection).get_columns("documents")}
        if "status" not in columns:
            connection.execute(text("ALTER TABLE documents ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ready'"))
        if "error" not in columns:
            connection.execute(text("ALTER TABLE documents ADD COLUMN error TEXT"))
        columns = {column["name"] for column in inspect(connection).get_columns("chat_messages")}
        if "conversation_id" not in columns:
            connection.execute(text("ALTER TABLE chat_messages ADD COLUMN conversation_id INTEGER"))
        if "sources_json" not in columns:
            connection.execute(text("ALTER TABLE chat_messages ADD COLUMN sources_json TEXT NOT NULL DEFAULT '[]'"))
        # Preserve chats created before conversations existed.
        if connection.execute(text("SELECT COUNT(*) FROM chat_messages WHERE conversation_id IS NULL")).scalar():
            connection.execute(text("INSERT INTO conversations (title, mode, created_at) VALUES ('Previous chat', 'documents', CURRENT_TIMESTAMP)"))
            conversation_id = connection.execute(text("SELECT last_insert_rowid()")).scalar()
            connection.execute(text("UPDATE chat_messages SET conversation_id = :id WHERE conversation_id IS NULL"), {"id": conversation_id})


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

