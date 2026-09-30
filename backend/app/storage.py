import re
from pathlib import Path
from tempfile import NamedTemporaryFile

from vercel.blob import AsyncBlobClient


async def upload_blob(file_path: Path, filename: str) -> str:
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", Path(filename).name).strip("-") or "document"
    client = AsyncBlobClient()
    try:
        uploaded = await client.put(
            f"documents/{safe_name}",
            file_path.read_bytes(),
            access="private",
            add_random_suffix=True,
        )
        return uploaded.url
    finally:
        await client.aclose()


async def download_blob(blob_url: str, suffix: str) -> Path:
    client = AsyncBlobClient()
    try:
        result = await client.get(blob_url, access="private")
        if result is None or result.status_code != 200 or result.stream is None:
            raise FileNotFoundError("Stored document was not found")
        with NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
            async for chunk in result.stream:
                temporary.write(chunk)
            return Path(temporary.name)
    finally:
        await client.aclose()


async def get_blob(blob_url: str):
    # The response stream owns the client until Starlette finishes streaming it.
    client = AsyncBlobClient()
    result = await client.get(blob_url, access="private")
    if result is None or result.stream is None:
        await client.aclose()
        return result, None

    async def stream():
        try:
            async for chunk in result.stream:
                yield chunk
        finally:
            await client.aclose()

    return result, stream()


async def delete_blob(blob_url: str) -> None:
    client = AsyncBlobClient()
    try:
        await client.delete(blob_url)
    finally:
        await client.aclose()
