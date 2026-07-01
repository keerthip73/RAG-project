from time import sleep

from langchain_core.embeddings import Embeddings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.config import get_settings


class RateLimitedEmbeddings(Embeddings):
    def __init__(self, wrapped: Embeddings, batch_size: int, pause_seconds: int):
        self.wrapped = wrapped
        self.batch_size = batch_size
        self.pause_seconds = pause_seconds

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        embeddings: list[list[float]] = []
        for start in range(0, len(texts), self.batch_size):
            batch = texts[start : start + self.batch_size]
            embeddings.extend(self.wrapped.embed_documents(batch))
            if start + self.batch_size < len(texts):
                sleep(self.pause_seconds)
        return embeddings

    def embed_query(self, text: str) -> list[float]:
        return self.wrapped.embed_query(text)


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
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
    return OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        api_key=settings.openai_api_key,
    )


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
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.2,
    )
