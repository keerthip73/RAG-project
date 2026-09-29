from time import sleep
from threading import Lock

from langchain_core.embeddings import Embeddings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.config import get_settings


class RateLimitedEmbeddings(Embeddings):
    _request_lock = Lock()

    def __init__(self, wrapped: Embeddings, batch_size: int, pause_seconds: int):
        self.wrapped = wrapped
        self.batch_size = batch_size
        self.pause_seconds = pause_seconds

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        embeddings: list[list[float]] = []
        for start in range(0, len(texts), self.batch_size):
            batch = texts[start : start + self.batch_size]
            with self._request_lock:
                embeddings.extend(self._retry(lambda: self.wrapped.embed_documents(batch)))
                if start + self.batch_size < len(texts):
                    sleep(self.pause_seconds)
        return embeddings

    def embed_query(self, text: str) -> list[float]:
        with self._request_lock:
            return self._retry(lambda: self.wrapped.embed_query(text))

    def _retry(self, request):
        try:
            return request()
        except Exception as exc:
            if "429" not in str(exc) and "ResourceExhausted" not in type(exc).__name__:
                raise
            sleep(self.pause_seconds)
            return request()


def get_embeddings():
    settings = get_settings()
    provider = settings.llm_provider.lower()
    if provider == "gemini":
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini")
        embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.gemini_embedding_model,
            google_api_key=settings.gemini_api_key,
        )
        return RateLimitedEmbeddings(
            embeddings,
            batch_size=settings.gemini_embedding_batch_size,
            pause_seconds=settings.gemini_embedding_pause_seconds,
        )
    if provider == "openai":
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
        return OpenAIEmbeddings(
            model=settings.openai_embedding_model,
            api_key=settings.openai_api_key,
        )
    raise RuntimeError("LLM_PROVIDER must be either gemini or openai")


def get_chat_model():
    settings = get_settings()
    provider = settings.llm_provider.lower()
    if provider == "gemini":
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini")
        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key,
            temperature=0.2,
        )
    if provider == "openai":
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
        return ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0.2,
        )
    raise RuntimeError("LLM_PROVIDER must be either gemini or openai")
