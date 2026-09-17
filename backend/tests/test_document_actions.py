import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from langchain_core.documents import Document as LCDocument
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, ChatMessage, Document, get_db
from app.main import app
from app.rag import remove_document_vectors


class DocumentActionsTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.session_factory = sessionmaker(bind=self.engine)

        def test_db():
            with self.session_factory() as session:
                yield session

        app.dependency_overrides[get_db] = test_db
        self.client = TestClient(app)
        self.temp_dir = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        self.engine.dispose()
        self.temp_dir.cleanup()

    def test_delete_document_removes_history_file_and_vectors(self):
        pdf_path = Path(self.temp_dir.name) / "test.pdf"
        pdf_path.write_bytes(b"%PDF-1.4")
        with self.session_factory() as session:
            document = Document(filename="test.pdf", stored_path=str(pdf_path), chunk_count=2)
            session.add(document)
            session.flush()
            document_id = document.id
            session.add(ChatMessage(document_id=document_id, role="user", content="Question"))
            session.commit()

        with patch("app.main.remove_document_vectors") as remove_vectors:
            response = self.client.delete(f"/documents/{document_id}")

        self.assertEqual(response.status_code, 204)
        remove_vectors.assert_called_once_with(document_id)
        self.assertFalse(pdf_path.exists())
        with self.session_factory() as session:
            self.assertIsNone(session.get(Document, document_id))
            self.assertEqual(session.query(ChatMessage).count(), 0)

    def test_clear_history_only_selected_document(self):
        with self.session_factory() as session:
            docs = [
                Document(filename=name, stored_path=name, chunk_count=1)
                for name in ("one.pdf", "two.pdf")
            ]
            session.add_all(docs)
            session.flush()
            ids = [doc.id for doc in docs]
            session.add_all(
                ChatMessage(document_id=doc_id, role="user", content="Question")
                for doc_id in ids
            )
            session.commit()

        response = self.client.delete(f"/history?document_id={ids[0]}")
        self.assertEqual(response.status_code, 204)
        with self.session_factory() as session:
            remaining = session.query(ChatMessage).all()
            self.assertEqual([message.document_id for message in remaining], [ids[1]])

    def test_remove_document_vectors_keeps_other_documents(self):
        store = MagicMock()
        store.index_to_docstore_id = {0: "first", 1: "second"}
        store.docstore.search.side_effect = [
            LCDocument(page_content="One", metadata={"document_id": 1}),
            LCDocument(page_content="Two", metadata={"document_id": 2}),
        ]

        with patch("app.rag.load_vector_store", return_value=store), patch("app.rag.save_vector_store") as save:
            remove_document_vectors(1)

        store.delete.assert_called_once_with(["first"])
        save.assert_called_once_with(store)

    def test_quota_error_does_not_save_failed_question(self):
        with patch("app.main.answer_question", side_effect=RuntimeError("429 quota exceeded")):
            response = self.client.post("/chat", json={"question": "What is Java?"})

        self.assertEqual(response.status_code, 429)
        self.assertIn("retry", response.json()["detail"].lower())
        with self.session_factory() as session:
            self.assertEqual(session.query(ChatMessage).count(), 0)


if __name__ == "__main__":
    unittest.main()
