from pathlib import Path
from uuid import uuid4

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document as LCDocument
from langchain_core.prompts import ChatPromptTemplate

from app.config import get_settings
from app.llm import get_chat_model, get_embeddings


PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a careful document assistant. Answer only from the supplied context. "
            "If the context is insufficient, say you do not know. Include concise reasoning and cite sources.",
        ),
        (
            "human",
            "Question: {question}\n\nContext:\n{context}",
        ),
    ]
)


def _index_path() -> Path:
    return get_settings().index_dir


def load_vector_store() -> FAISS | None:
    path = _index_path()
    if not (path / "index.faiss").exists():
        return None
    return FAISS.load_local(
        str(path),
        get_embeddings(),
        allow_dangerous_deserialization=True,
    )


def save_vector_store(store: FAISS) -> None:
    store.save_local(str(_index_path()))


def index_pdf(file_path: Path, document_id: int, filename: str) -> int:
    loader = PyPDFLoader(str(file_path))
    pages = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=180)
    chunks = splitter.split_documents(pages)

    for chunk in chunks:
        chunk.metadata.update(
            {
                "document_id": document_id,
                "filename": filename,
                "page": chunk.metadata.get("page", 0) + 1,
            }
        )

    store = load_vector_store()
    if store is None:
        store = FAISS.from_documents(chunks, get_embeddings())
    else:
        store.add_documents(chunks)
    save_vector_store(store)
    return len(chunks)


def search_documents(question: str, document_id: int | None = None, k: int = 5) -> list[LCDocument]:
    store = load_vector_store()
    if store is None:
        return []
    docs = store.similarity_search(question, k=20)
    if document_id is not None:
        docs = [doc for doc in docs if doc.metadata.get("document_id") == document_id]
    return docs[:k]


def answer_question(question: str, document_id: int | None = None) -> tuple[str, list[LCDocument]]:
    docs = search_documents(question, document_id=document_id)
    if not docs:
        return "I could not find relevant document context for that question.", []

    context = "\n\n".join(
        f"Source {idx}: {doc.metadata.get('filename')} page {doc.metadata.get('page')}\n{doc.page_content}"
        for idx, doc in enumerate(docs, start=1)
    )
    chain = PROMPT | get_chat_model()
    response = chain.invoke({"question": question, "context": context})
    return response.content, docs


def empty_vector_store() -> FAISS:
    embeddings = get_embeddings()
    index = __import__("faiss").IndexFlatL2(len(embeddings.embed_query("dimension probe")))
    return FAISS(
        embedding_function=embeddings,
        index=index,
        docstore=InMemoryDocstore(),
        index_to_docstore_id={},
    )


def unique_upload_path(filename: str) -> Path:
    suffix = Path(filename).suffix.lower() or ".pdf"
    return get_settings().uploads_dir / f"{uuid4().hex}{suffix}"

